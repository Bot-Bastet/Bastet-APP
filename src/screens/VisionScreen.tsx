import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getStreamUrl } from '../api/client';
import { joinStream, leaveStream } from '../api/cameras';
import { useWebSocket } from '../context/WebSocketContext';
import { theme } from '../theme';

type CamId = 1 | 2;

export default function VisionScreen() {
  const { requestCamera, releaseCamera } = useWebSocket();
  const [activeCam, setActiveCam] = React.useState<CamId>(1);
  const videoUrl = getStreamUrl(activeCam, 'hls');

  // Cycle de vie on-demand : on démarre le flux de la caméra sélectionnée et on
  // le libère (WS + heartbeat REST) au changement de caméra ou au démontage.
  useEffect(() => {
    requestCamera(activeCam);
    joinStream(activeCam).catch(() => {});
    return () => {
      releaseCamera(activeCam);
      leaveStream(activeCam).catch(() => {});
    };
  }, [activeCam, requestCamera, releaseCamera]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <iframe
            key={activeCam}
            src={videoUrl}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
          />
        ) : (
          <WebView
            key={activeCam}
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

        <View style={styles.camToggleRow}>
          <TouchableOpacity
            style={[styles.camBtn, activeCam === 1 && styles.camBtnActive]}
            onPress={() => setActiveCam(1)}
          >
            <Text style={[styles.camBtnText, activeCam === 1 && styles.camBtnTextActive]}>
              Caméra Gauche
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.camBtn, activeCam === 2 && styles.camBtnActive]}
            onPress={() => setActiveCam(2)}
          >
            <Text style={[styles.camBtnText, activeCam === 2 && styles.camBtnTextActive]}>
              Caméra Droite
            </Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
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
  camToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    padding: theme.spacing.s,
  },
  camBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  camBtnActive: {
    backgroundColor: theme.colors.primary + 'CC',
    borderColor: theme.colors.primary,
  },
  camBtnText: {
    ...theme.typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  camBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
