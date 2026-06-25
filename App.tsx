import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import AppNavigation from './src/navigation';
import { BotProvider } from './src/context/BotContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    setReady(true);
    SplashScreen.hideAsync();
  }, []);

  return (
    <WebSocketProvider>
      <BotProvider>
        <StatusBar style="light" />
        <AppNavigation />
      </BotProvider>
    </WebSocketProvider>
  );
}
