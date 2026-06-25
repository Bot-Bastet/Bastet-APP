import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { DEFAULT_GATEWAY_IP } from '../api/client';
import { theme } from '../theme';

export default function VisionScreen() {
  const isSecure = process.env.EXPO_PUBLIC_USE_SSL !== 'false';
  const protocol = isSecure ? 'https' : 'http';
  const [videoUrl] = useState(`${protocol}://${DEFAULT_GATEWAY_IP}:48889/robot/cam1`);


  return (
    <View style={styles.container}>
      
      {/* Raw Video Feed */}
      <View style={StyleSheet.absoluteFillObject}>
        {Platform.OS === 'web' ? (
          <iframe 
            src={videoUrl} 
            style={{ width: '100%', height: '100%', border: 'none' } as any} 
          />
        ) : (
          <WebView 
            source={{ uri: videoUrl }} 
            style={styles.webview}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <SafeAreaView style={styles.hudOverlay} pointerEvents="box-none">
        <View style={styles.topHud} pointerEvents="none">
          <Text style={styles.hudText}>REC •</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  hudOverlay: {
    flex: 1,
    padding: theme.spacing.m,
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.m,
  },
  hudText: {
    ...theme.typography.small,
    color: theme.colors.danger,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
