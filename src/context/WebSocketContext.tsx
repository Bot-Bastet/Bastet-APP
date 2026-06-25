import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_GATEWAY_IP } from '../api/client';
import { TelemetryDiagnostics, WifiNetwork, CameraSetupPayload, UpdateProgress } from '../types';

// ═══════════════════════════════════════════════════════════════
// WebSocket Context — Bastet CORE Gateway
// Handles: chat, state, telemetry_diagnostics, wifi_list,
//          scan_wifi, camera_setup
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
}

interface WSContextData {
  connected: boolean;
  robotState: RobotState;
  messages: Message[];
  telemetry: TelemetryDiagnostics | null;
  wifiNetworks: WifiNetwork[];
  wifiScanning: boolean;
  updateProgress: { gateway: UpdateProgress | null; robot: UpdateProgress | null; arduino: UpdateProgress | null };
  sendMessage: (text: string) => void;
  sendJoystick: (x: number, y: number) => void;
  sendWifiScan: () => void;
  sendCameraSetup: (camera: 1 | 2, enable: boolean) => void;
  sendRaw: (data: any) => void;
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

const WebSocketContext = createContext<WSContextData>({} as WSContextData);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>(defaultRobotState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryDiagnostics | null>(null);
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
  const [wifiScanning, setWifiScanning] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ gateway: UpdateProgress | null; robot: UpdateProgress | null; arduino: UpdateProgress | null }>({
    gateway: null, robot: null, arduino: null
  });
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = async () => {
    if (ws.current) return;

    try {
      let savedIp = DEFAULT_GATEWAY_IP;
      let token = process.env.EXPO_PUBLIC_DEV_TOKEN || null;

      if (!token) {
        if (Platform.OS !== 'web') {
          savedIp = (await SecureStore.getItemAsync('gateway_ip')) || DEFAULT_GATEWAY_IP;
          token = await SecureStore.getItemAsync('jwt_token');
        } else {
          token = localStorage.getItem('jwt_token');
        }
      }

      if (!token) return; // Wait for login

      const isSecure = process.env.EXPO_PUBLIC_USE_SSL === 'true';
      const protocol = isSecure ? 'wss' : 'ws';

      // Note: React Native WebSocket supports headers, but Web doesn't. 
      // Using query param for token is safer across platforms if Gateway supports it.
      const url = `${protocol}://${savedIp}:44888/ws/app?token=${token}`;
      
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setConnected(true);
        console.log(`\n🟢 [WS] ════════════════════════════════════`);
        console.log(`🟢 [WS] CONNECTÉ à ${url}`);
        console.log(`🟢 [WS] ════════════════════════════════════\n`);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const dataStr = JSON.stringify(data);
          const truncated = dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr;
          
          console.log(`📨 [WS ← ${data.type || 'UNKNOWN'}] ${truncated}`);
          
          switch (data.type) {
            // ─── État général du robot ─────────────────────
            case 'state':
              console.log(`   ↳ [WS] 🤖 State update:`, JSON.stringify(data.payload || data).substring(0, 300));
              setRobotState(prev => ({ ...prev, ...(data.payload || data) }));
              break;

            // ─── Chat bidirectionnel ──────────────────────
            case 'chat': {
              const textContent = data.payload?.text || data.text;
              const isAiContent = data.payload?.isAi !== undefined ? data.payload.isAi : (data.isAi !== false);
              console.log(`   ↳ [WS] 💬 Chat: [${isAiContent ? 'AI' : 'USER'}] "${textContent}"`);
              
              if (textContent) {
                const newMsg: Message = {
                  id: Date.now().toString(),
                  text: textContent,
                  isAi: isAiContent,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, newMsg]);
              }
              break;
            }

            // ─── Télémétrie complète (Section 1 — DocsGateway) ─
            case 'telemetry_diagnostics':
              console.log(`   ↳ [WS] 📊 Telemetry: joints=${data.payload?.joints?.length || '?'}, imu=${JSON.stringify(data.payload?.imu || {})}`);
              setTelemetry(data.payload || data);
              break;

            // ─── Liste WiFi reçue du robot ────────────────
            case 'wifi_list': {
              const networks = data.payload || data.networks || [];
              console.log(`   ↳ [WS] 📶 WiFi: ${networks.length} réseaux reçus`);
              setWifiNetworks(networks);
              setWifiScanning(false);
              break;
            }

            // ─── Statut des flux caméra ───────────────────
            case 'stream_status': {
              const cam = data.camera || data.payload?.camera;
              const active = data.active ?? data.payload?.active;
              console.log(`   ↳ [WS] 📹 Stream: cam${cam} = ${active ? 'ACTIVE' : 'INACTIVE'}`);
              if (cam !== undefined && active !== undefined) {
                setRobotState(prev => ({ ...prev, [`cam${cam}_active`]: active }));
              }
              break;
            }
            
            case 'keep_stream_status': {
              const cam = data.camera || data.payload?.camera;
              const keep = data.keep ?? data.payload?.keep;
              console.log(`   ↳ [WS] 📹 Keep Stream: cam${cam} = ${keep ? 'KEEP ACTIVE' : 'LET DIE'}`);
              break;
            }

            // ─── Progression des mises à jour (Section 7) ─
            case 'gateway_update_progress':
              console.log(`   ↳ [WS] ⬇️ Gateway Update: ${data.status || data.payload?.status} ${data.percent || data.payload?.percent}%`);
              setUpdateProgress(prev => ({ ...prev, gateway: data.payload || data }));
              break;
            case 'robot_update_progress':
              console.log(`   ↳ [WS] ⬇️ Robot Update: ${data.status || data.payload?.status} ${data.percent || data.payload?.percent}%`);
              setUpdateProgress(prev => ({ ...prev, robot: data.payload || data }));
              break;
            case 'arduino_update_progress':
              console.log(`   ↳ [WS] ⬇️ Arduino Update: ${data.status || data.payload?.status} ${data.percent || data.payload?.percent}%`);
              setUpdateProgress(prev => ({ ...prev, arduino: data.payload || data }));
              break;

            default:
              console.warn(`   ↳ [WS] ⚠️ TYPE NON-GÉRÉ: "${data.type}"`, truncated);
              break;
          }
        } catch (e) {
          console.error(`🚨 [WS] Message invalide (non-JSON?):`, event.data);
        }
      };

      socket.onclose = (e) => {
        setConnected(false);
        ws.current = null;
        console.log(`\n🔴 [WS] ════════════════════════════════════`);
        console.log(`🔴 [WS] DÉCONNECTÉ — code: ${(e as any)?.code || '?'}, reason: ${(e as any)?.reason || 'none'}`);
        console.log(`🔴 [WS] Reconnexion dans 5s...`);
        console.log(`🔴 [WS] ════════════════════════════════════\n`);
        // Auto-reconnect after 5 seconds
        reconnectTimer.current = setTimeout(() => {
          console.log(`🔄 [WS] Tentative de reconnexion...`);
          connect();
        }, 5000);
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
  };

  const sendRaw = useCallback((data: any) => {
    if (ws.current && connected) {
      console.log(`📤 [WS SEND] RAW:`, JSON.stringify(data));
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn(`⚠️ [WS SEND] CANNOT SEND RAW, NOT CONNECTED:`, JSON.stringify(data));
    }
  }, [connected]);

  const sendMessage = useCallback((text: string) => {
    if (ws.current && connected) {
      console.log(`📤 [WS SEND] CHAT: "${text}"`);
      ws.current.send(JSON.stringify({ type: 'chat', payload: { text } }));
      setMessages(prev => [...prev, { id: Date.now().toString(), text, isAi: false, timestamp: new Date() }]);
    } else {
      console.warn(`⚠️ [WS SEND] CANNOT SEND CHAT, NOT CONNECTED: "${text}"`);
    }
  }, [connected]);

  const sendJoystick = useCallback((x: number, y: number) => {
    if (ws.current && connected) {
      console.log(`📤 [WS SEND] JOYSTICK: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
      ws.current.send(JSON.stringify({ type: 'joystick', payload: { x, y } }));
    }
  }, [connected]);

  /**
   * Envoie une demande de scan WiFi au robot (Section 1 — DocsGateway)
   * Le robot répondra avec un message `wifi_list`
   */
  const sendWifiScan = useCallback(() => {
    if (ws.current && connected) {
      console.log(`📤 [WS SEND] SCAN_WIFI`);
      setWifiScanning(true);
      setWifiNetworks([]);
      ws.current.send(JSON.stringify({ type: 'scan_wifi' }));
    } else {
      console.warn(`⚠️ [WS SEND] CANNOT SEND SCAN_WIFI, NOT CONNECTED`);
    }
  }, [connected]);

  /**
   * Active ou désactive un flux caméra sur le robot (Section 1 — DocsGateway)
   * camera: 1 ou 2, enable: true/false
   */
  const sendCameraSetup = useCallback((camera: 1 | 2, enable: boolean) => {
    if (ws.current && connected) {
      console.log(`📤 [WS SEND] CAMERA_SETUP: cam${camera} = ${enable ? 'ON' : 'OFF'}`);
      ws.current.send(JSON.stringify({ 
        type: 'camera_setup', 
        payload: { camera, enable } 
      }));
    } else {
      console.warn(`⚠️ [WS SEND] CANNOT SEND CAMERA_SETUP, NOT CONNECTED`);
    }
  }, [connected]);

  useEffect(() => {
    // Attempt initial connect if token exists
    connect();
    return () => disconnect();
  }, []);

  return (
    <WebSocketContext.Provider value={{ 
      connected, 
      robotState, 
      messages, 
      telemetry,
      wifiNetworks,
      wifiScanning,
      updateProgress,
      sendMessage, 
      sendJoystick,
      sendWifiScan,
      sendCameraSetup,
      sendRaw,
      connect, 
      disconnect 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
