import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { DEFAULT_GATEWAY_IP, GATEWAY_API_PORT, getApiToken } from '../api/client';
import {
  TelemetryDiagnostics,
  WifiNetwork,
  UpdateProgress,
  CalibrationState,
  ArduinoCmdType,
} from '../types';

// ═══════════════════════════════════════════════════════════════
// WebSocket Context — Bastet CORE Gateway
// Handles: chat, state, telemetry_diagnostics, wifi (legacy),
//          cmd_vel, request_camera, arduino_cmd, calibration
// ═══════════════════════════════════════════════════════════════

interface Message {
  id: string;
  text: string;
  isAi: boolean;
  timestamp: Date;
}

interface RobotState {
  id: string;
  name: string;
  status: string;
  battery: number;
  latitude: number;
  longitude: number;
  speed: number;
  colorTheme: string;
  [key: string]: unknown;
}

interface WSContextData {
  connected: boolean;
  robotState: RobotState;
  messages: Message[];
  telemetry: TelemetryDiagnostics | null;
  wifiNetworks: WifiNetwork[];
  wifiScanning: boolean;
  knownSsids: string[];
  wifiConnecting: boolean;
  wifiConnectionResult: { status: 'success' | 'error'; message: string } | null;
  wifiScanError: { error: string; interface: string; manager: string } | null;
  wifiForgetting: boolean;
  updateProgress: { gateway: UpdateProgress | null; robot: UpdateProgress | null; arduino: UpdateProgress | null };
  calibrationState: CalibrationState;
  sendMessage: (text: string) => void;
  sendCmdVel: (linear: number, angular: number) => void;
  sendJoystick: (x: number, y: number) => void;
  sendWifiScan: () => void;
  requestCamera: (camera: 1 | 2, vSlam?: boolean) => void;
  releaseCamera: (camera: 1 | 2) => void;
  stopCamera: (camera: 1 | 2) => void;
  sendCameraSetup: (camera: 1 | 2, enable: boolean) => void;
  connectWifi: (ssid: string, password?: string) => void;
  forgetWifi: (ssid: string) => void;
  sendNavGoal: (x: number, y: number) => void;
  sendArduinoCmd: (cmd: ArduinoCmdType, index?: number, angle?: number) => void;
  sendManualJoints: (angles: number[]) => void;
  runMonoCalib: (params: { camera: 1 | 2; chessboard_cols: number; chessboard_rows: number; square_size_mm: number; timeout_seconds?: number }) => void;
  runStereoCalib: (params: { chessboard_cols: number; chessboard_rows: number; square_size_mm: number; timeout_seconds?: number }) => void;
  clearWifiConnectionResult: () => void;
  clearWifiScanError: () => void;
  sendRaw: (data: unknown) => void;
  connect: () => void;
  disconnect: () => void;
}

const defaultRobotState: RobotState = {
  id: 'BST-01',
  name: 'BASTET CORE',
  status: 'Hors ligne',
  battery: 100,
  latitude: 48.8566,
  longitude: 2.3522,
  speed: 0,
  colorTheme: '#D5001C',
};

const defaultCalibrationState: CalibrationState = {
  active: false,
  mode: null,
  camera: null,
  progress: 0,
  message: '',
  lastResult: null,
  lastFrame: null,
};

const WebSocketContext = createContext<WSContextData>({} as WSContextData);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>(defaultRobotState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryDiagnostics | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [wifiScanning, setWifiScanning] = useState(false);
  const [knownSsids, setKnownSsids] = useState<string[]>([]);
  const [wifiConnecting, setWifiConnecting] = useState(false);
  const [wifiConnectionResult, setWifiConnectionResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [wifiScanError, setWifiScanError] = useState<{ error: string; interface: string; manager: string } | null>(null);
  const [wifiForgetting, setWifiForgetting] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ gateway: UpdateProgress | null; robot: UpdateProgress | null; arduino: UpdateProgress | null }>({
    gateway: null, robot: null, arduino: null,
  });
  const [calibrationState, setCalibrationState] = useState<CalibrationState>(defaultCalibrationState);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = async () => {
    if (ws.current) return;

    try {
      const token = await getApiToken();
      if (!token) return;

      const isSecure = process.env.EXPO_PUBLIC_USE_SSL !== 'false';
      const protocol = isSecure ? 'wss' : 'ws';
      const url = `${protocol}://${DEFAULT_GATEWAY_IP}:${GATEWAY_API_PORT}/ws/app?token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(url);

      socket.onopen = () => {
        setConnected(true);
        console.log(`\n🟢 [WS] CONNECTÉ à ${url}\n`);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const dataStr = JSON.stringify(data);
          const truncated = dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr;

          console.log(`📨 [WS ← ${data.type || 'UNKNOWN'}] ${truncated}`);

          switch (data.type) {
            case 'state':
              setRobotState(prev => ({ ...prev, ...(data.payload || data) }));
              break;

            case 'chat': {
              const textContent = data.text || data.payload?.text;
              const isAiContent = data.payload?.isAi !== undefined
                ? data.payload.isAi
                : (data.isAi !== undefined ? data.isAi : true);
              if (textContent) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  text: textContent,
                  isAi: isAiContent,
                  timestamp: new Date(),
                }]);
              }
              break;
            }

            case 'telemetry_diagnostics':
              setTelemetry(data.payload || data);
              break;

            case 'wifi_list': {
              const networks = data.payload?.networks || data.networks || [];
              const ssids = data.payload?.known_ssids || data.known_ssids || [];
              setWifiNetworks(networks);
              setKnownSsids(ssids);
              setWifiScanning(false);
              break;
            }

            case 'wifi_list_error': {
              const errMsg = data.payload?.error || data.error || 'Erreur inconnue';
              const iface = data.payload?.interface || data.interface || 'wlan0';
              const mgr = data.payload?.manager || data.manager || 'inconnu';
              setWifiScanning(false);
              setWifiScanError({ error: errMsg, interface: iface, manager: mgr });
              break;
            }

            case 'wifi_connect_result': {
              const status = data.payload?.status || data.status;
              const msg = data.payload?.message || data.message || '';
              setWifiConnecting(false);
              setWifiConnectionResult({ status, message: msg });
              break;
            }

            case 'wifi_forget_result': {
              setWifiForgetting(false);
              ws.current?.send(JSON.stringify({ type: 'scan_wifi' }));
              break;
            }

            case 'stream_status': {
              const cam = data.camera ?? data.payload?.camera;
              const active = data.active ?? data.payload?.active;
              if (cam !== undefined && active !== undefined) {
                setRobotState(prev => ({ ...prev, [`cam${cam}_active`]: active }));
              }
              break;
            }

            case 'keep_stream_status':
              break;

            case 'gateway_update_progress':
              setUpdateProgress(prev => ({ ...prev, gateway: data.payload || data }));
              break;
            case 'robot_update_progress':
              setUpdateProgress(prev => ({ ...prev, robot: data.payload || data }));
              break;
            case 'arduino_update_progress':
              setUpdateProgress(prev => ({ ...prev, arduino: data.payload || data }));
              break;

            case 'mono_calib_frame':
              setCalibrationState(prev => ({
                ...prev,
                active: true,
                mode: 'mono',
                camera: data.camera ?? data.payload?.camera ?? null,
                lastFrame: data.image || data.payload?.image || null,
              }));
              break;

            case 'mono_calib_progress':
              setCalibrationState(prev => ({
                ...prev,
                active: true,
                mode: 'mono',
                camera: data.camera ?? data.payload?.camera ?? prev.camera,
                progress: data.progress ?? data.payload?.progress ?? 0,
                message: data.message || data.payload?.message || '',
              }));
              break;

            case 'mono_calib_result':
              setCalibrationState(prev => ({
                ...prev,
                active: false,
                progress: 100,
                message: data.message || data.payload?.message || '',
                lastResult: data.payload || data,
              }));
              break;

            case 'stereo_calib_frame':
              setCalibrationState(prev => ({
                ...prev,
                active: true,
                mode: 'stereo',
                lastFrame: data.image || data.payload?.image || null,
              }));
              break;

            case 'stereo_calib_progress':
              setCalibrationState(prev => ({
                ...prev,
                active: true,
                mode: 'stereo',
                progress: data.progress ?? data.payload?.progress ?? 0,
                message: data.message || data.payload?.message || '',
              }));
              break;

            case 'stereo_calib_result':
              setCalibrationState(prev => ({
                ...prev,
                active: false,
                progress: 100,
                message: data.message || data.payload?.message || '',
                lastResult: data.payload || data,
              }));
              break;

            default:
              console.warn(`   ↳ [WS] ⚠️ TYPE NON-GÉRÉ: "${data.type}"`, truncated);
              break;
          }
        } catch (e) {
          console.error(`🚨 [WS] Message invalide (non-JSON?):`, event.data);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        ws.current = null;
        reconnectTimer.current = setTimeout(() => connect(), 5000);
      };

      socket.onerror = (e) => {
        console.error(`🚨 [WS] ERREUR WebSocket:`, e);
      };

      ws.current = socket;
    } catch (e) {
      console.error('Failed to connect WS', e);
    }
  };

  const disconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setConnected(false);
  };

  const sendRaw = useCallback((data: unknown) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify(data));
    }
  }, [connected]);

  const sendMessage = useCallback((text: string) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'chat', text }));
      setMessages(prev => [...prev, { id: Date.now().toString(), text, isAi: false, timestamp: new Date() }]);
    }
  }, [connected]);

  const sendCmdVel = useCallback((linear: number, angular: number) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'cmd_vel', linear, angular }));
    }
  }, [connected]);

  const sendJoystick = useCallback((x: number, y: number) => {
    sendCmdVel(-y * 0.2, -x * 0.5);
  }, [sendCmdVel]);

  const sendWifiScan = useCallback(() => {
    if (ws.current && connected) {
      setWifiScanning(true);
      setWifiNetworks([]);
      ws.current.send(JSON.stringify({ type: 'scan_wifi' }));
    }
  }, [connected]);

  const requestCamera = useCallback((camera: 1 | 2, vSlam = false) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'request_camera', camera, v_slam: vSlam }));
    }
  }, [connected]);

  const releaseCamera = useCallback((camera: 1 | 2) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'release_camera', camera }));
    }
  }, [connected]);

  const stopCamera = useCallback((camera: 1 | 2) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'stop_camera', camera }));
    }
  }, [connected]);

  const sendCameraSetup = useCallback((camera: 1 | 2, enable: boolean) => {
    if (enable) requestCamera(camera);
    else releaseCamera(camera);
  }, [requestCamera, releaseCamera]);

  const connectWifi = useCallback((ssid: string, password?: string) => {
    if (ws.current && connected) {
      setWifiConnecting(true);
      setWifiConnectionResult(null);
      ws.current.send(JSON.stringify({ type: 'connect_wifi', ssid, password }));
    }
  }, [connected]);

  const forgetWifi = useCallback((ssid: string) => {
    if (ws.current && connected) {
      setWifiForgetting(true);
      ws.current.send(JSON.stringify({ type: 'forget_wifi', ssid }));
    }
  }, [connected]);

  const sendNavGoal = useCallback((x: number, y: number) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'nav_goal', x, y }));
    }
  }, [connected]);

  const sendArduinoCmd = useCallback((cmd: ArduinoCmdType, index?: number, angle?: number) => {
    if (ws.current && connected) {
      const payload: Record<string, unknown> = { type: 'arduino_cmd', cmd };
      if (index !== undefined) payload.index = index;
      if (angle !== undefined) payload.angle = angle;
      ws.current.send(JSON.stringify(payload));
    }
  }, [connected]);

  const sendManualJoints = useCallback((angles: number[]) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'manual_joint_control', angles }));
    }
  }, [connected]);

  const runMonoCalib = useCallback((params: { camera: 1 | 2; chessboard_cols: number; chessboard_rows: number; square_size_mm: number; timeout_seconds?: number }) => {
    if (ws.current && connected) {
      setCalibrationState({ ...defaultCalibrationState, active: true, mode: 'mono', camera: params.camera });
      ws.current.send(JSON.stringify({ type: 'run_mono_calib', ...params }));
    }
  }, [connected]);

  const runStereoCalib = useCallback((params: { chessboard_cols: number; chessboard_rows: number; square_size_mm: number; timeout_seconds?: number }) => {
    if (ws.current && connected) {
      setCalibrationState({ ...defaultCalibrationState, active: true, mode: 'stereo' });
      ws.current.send(JSON.stringify({ type: 'run_stereo_calib', ...params }));
    }
  }, [connected]);

  const clearWifiConnectionResult = useCallback(() => setWifiConnectionResult(null), []);
  const clearWifiScanError = useCallback(() => setWifiScanError(null), []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  useEffect(() => {
    if (!wifiScanning) return;
    const watchdog = setTimeout(() => setWifiScanning(false), 60000);
    return () => clearTimeout(watchdog);
  }, [wifiScanning]);

  return (
    <WebSocketContext.Provider value={{
      connected,
      robotState,
      messages,
      telemetry,
      wifiNetworks,
      wifiScanning,
      knownSsids,
      wifiConnecting,
      wifiConnectionResult,
      wifiScanError,
      wifiForgetting,
      updateProgress,
      calibrationState,
      sendMessage,
      sendCmdVel,
      sendJoystick,
      sendWifiScan,
      requestCamera,
      releaseCamera,
      stopCamera,
      sendCameraSetup,
      connectWifi,
      forgetWifi,
      sendNavGoal,
      sendArduinoCmd,
      sendManualJoints,
      runMonoCalib,
      runStereoCalib,
      clearWifiConnectionResult,
      clearWifiScanError,
      sendRaw,
      connect,
      disconnect,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
