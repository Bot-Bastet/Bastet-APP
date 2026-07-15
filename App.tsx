import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useCallback, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigation from './src/navigation';
import { BotProvider } from './src/context/BotContext';
import { WebSocketProvider, useWebSocket } from './src/context/WebSocketContext';
import * as SplashScreen from 'expo-splash-screen';
import { getApiToken } from './src/api/client';

SplashScreen.preventAutoHideAsync();

function AppInner() {
  const [appReady, setAppReady] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const { connect, connected } = useWebSocket();

  useEffect(() => {
    (async () => {
      const token = await getApiToken();
      setHasToken(!!token);
      if (token && !connected) {
        connect();
      }
      setAppReady(true);
    })();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (hasToken === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D5001C" />
      </View>
    );
  }

  return (
    <AppNavigation initialRoute={hasToken ? 'HomeStack' : 'Login'} onReady={onLayoutRootView} />
  );
}

export default function App() {
  return (
    <WebSocketProvider>
      <BotProvider>
        <StatusBar style="light" />
        <AppInner />
      </BotProvider>
    </WebSocketProvider>
  );
}
