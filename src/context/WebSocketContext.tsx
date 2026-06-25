import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_GATEWAY_IP } from '../api/client';

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
  sendMessage: (text: string) => void;
  sendJoystick: (x: number, y: number) => void;
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
  const ws = useRef<WebSocket | null>(null);

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
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'state') {
            setRobotState(prev => ({ ...prev, ...(data.payload || data) }));
          } else if (data.type === 'chat') {
            const textContent = data.payload?.text || data.text;
            const isAiContent = data.payload?.isAi !== undefined ? data.payload.isAi : (data.isAi !== false);
            
            if (textContent) {
              const newMsg: Message = {
                id: Date.now().toString(),
                text: textContent,
                isAi: isAiContent,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, newMsg]);
            }
          }
        } catch (e) {
          console.warn('Invalid WS message', event.data);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        ws.current = null;
        // Auto-reconnect logic could be added here
      };

      socket.onerror = (e) => {
        console.error('WebSocket Error:', e);
      };

      ws.current = socket;
    } catch (e) {
      console.error('Failed to connect WS', e);
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  const sendMessage = (text: string) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'chat', payload: { text } }));
      setMessages(prev => [...prev, { id: Date.now().toString(), text, isAi: false, timestamp: new Date() }]);
    }
  };

  const sendJoystick = (x: number, y: number) => {
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ type: 'joystick', payload: { x, y } }));
    }
  };

  useEffect(() => {
    // Attempt initial connect if token exists
    connect();
    return () => disconnect();
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, robotState, messages, sendMessage, sendJoystick, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};
