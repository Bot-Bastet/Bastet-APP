import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useCallback } from 'react';
import AppNavigation from './src/navigation';
import { BotProvider } from './src/context/BotContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = React.useState(false);

  useEffect(() => {
    setAppReady(true);
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  return (
    <WebSocketProvider>
      <BotProvider>
        <StatusBar style="light" />
        <AppNavigation onReady={onLayoutRootView} />
      </BotProvider>
    </WebSocketProvider>
  );
}
