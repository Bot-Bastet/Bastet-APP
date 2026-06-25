import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AppNavigation from './src/navigation';
import { BotProvider } from './src/context/BotContext';
import { WebSocketProvider } from './src/context/WebSocketContext';

export default function App() {
  return (
    <WebSocketProvider>
      <BotProvider>
        <StatusBar style="light" />
        <AppNavigation />
      </BotProvider>
    </WebSocketProvider>
  );
}
