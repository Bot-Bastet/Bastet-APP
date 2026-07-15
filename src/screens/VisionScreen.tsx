import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getStreamUrl } from '../api/client';
import { joinStream, leaveStream } from '../api/cameras';
import { useWebSocket } from '../context/WebSocketContext';
import { theme } from '../theme';

export default function VisionScreen() {
  const { requestCamera, releaseCamera } = useWebSocket();
  const videoUrl = getStreamUrl(1, 'hls');

  useEffect(() => {
    requestCamera(1);
    joinStream(1).catch(() => {});
    return () => {
      releaseCamera(1);
      leaveStream(1).catch(() => {});
    };
  }, [requestCamera, releaseCamera]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
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
          <Text style={styles.hudText}>REC • HLS</Text>
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
