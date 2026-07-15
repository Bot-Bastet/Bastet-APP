import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Asset } from 'expo-asset';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { theme } from '../theme';
import { IMUData } from '../types';
import { isValidJointTelemetry } from '../utils/jointMapping';

export type SpotMicro3DMode = 'mini' | 'showcase' | 'interactive';

export interface SpotMicro3DViewerProps {
  mode: SpotMicro3DMode;
  joints?: number[];
  imu?: IMUData;
  connected?: boolean;
  onJoystick?: (x: number, y: number) => void;
  style?: ViewStyle;
  showModeBadge?: boolean;
  transparent?: boolean;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

const viewerAsset = require('../../assets/spotmicro3d/viewer.html');
const LOAD_TIMEOUT_MS = 45000;
const TELEMETRY_INTERVAL_MS = 33;

async function resolveViewerUri(mode: SpotMicro3DMode, transparent: boolean): Promise<string> {
  const asset = Asset.fromModule(viewerAsset);
  await asset.downloadAsync();
  const base = asset.localUri ?? asset.uri;
  if (!base) return '';
  const params = new URLSearchParams({ mode });
  if (transparent) params.set('transparent', '1');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}${params.toString()}`;
}

export default function SpotMicro3DViewer({
  mode,
  joints,
  imu,
  connected = false,
  onJoystick,
  style,
  showModeBadge = false,
  transparent = false,
  pointerEvents = 'auto',
}: SpotMicro3DViewerProps) {
  const isLive = connected && isValidJointTelemetry(joints);
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const jointsRef = useRef(joints);
  const imuRef = useRef(imu);
  const isLiveRef = useRef(isLive);

  jointsRef.current = joints;
  imuRef.current = imu;
  isLiveRef.current = isLive;

  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;
    setReady(false);
    setViewerUri(null);
    setError(null);

    resolveViewerUri(mode, transparent)
      .then(uri => {
        if (!cancelled) setViewerUri(uri);
      })
      .catch(() => {
        if (!cancelled) setViewerUri('');
      });

    return () => {
      cancelled = true;
    };
  }, [mode, transparent]);

  const postToViewer = useCallback((payload: object) => {
    const message = JSON.stringify(payload);
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(message, '*');
      return;
    }
    webViewRef.current?.postMessage(message);
  }, []);

  const handleViewerMessage = useCallback(
    (data: string) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'ready') {
          readyRef.current = true;
          setReady(true);
          setError(null);
          return;
        }
        if (msg.type === 'joystick' && onJoystick) {
          onJoystick(Number(msg.x) || 0, Number(msg.y) || 0);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onJoystick],
  );

  const onWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleViewerMessage(event.nativeEvent.data);
    },
    [handleViewerMessage],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      handleViewerMessage(event.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleViewerMessage]);

  useEffect(() => {
    if (!viewerUri) return;
    readyRef.current = false;
    setReady(false);
    setError(null);
    const timer = setTimeout(() => {
      if (!readyRef.current) {
        setError('Impossible de charger le modèle 3D. Vérifiez votre connexion réseau.');
      }
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [viewerUri]);

  useEffect(() => {
    if (!ready) return;

    const sendTelemetry = () => {
      postToViewer({
        type: 'telemetry',
        connected: isLiveRef.current,
        joints: jointsRef.current ?? [],
        imu: imuRef.current ?? null,
      });
    };

    sendTelemetry();
    const interval = setInterval(sendTelemetry, TELEMETRY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ready, postToViewer]);

  const containerStyle = [
    styles.container,
    transparent && styles.containerTransparent,
    style,
  ];

  const overlayStyle = transparent ? styles.overlayTransparent : styles.overlay;

  if (viewerUri === null) {
    return (
      <View style={containerStyle} pointerEvents={pointerEvents}>
        <View style={overlayStyle}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {!transparent && <Text style={styles.loadingText}>Chargement 3D…</Text>}
        </View>
      </View>
    );
  }

  if (!viewerUri) {
    return (
      <View style={containerStyle} pointerEvents={pointerEvents}>
        <Text style={styles.errorText}>Viewer 3D introuvable</Text>
      </View>
    );
  }

  const iframeBg = transparent ? 'transparent' : '#050505';

  return (
    <View style={containerStyle} pointerEvents={pointerEvents}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          src={viewerUri}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: iframeBg }}
          title="SpotMicro 3D"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: viewerUri }}
          style={[styles.webview, transparent && styles.webviewTransparent]}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
          onMessage={onWebViewMessage}
          onError={() => setError('Erreur de chargement du viewer 3D')}
          onHttpError={() => setError('Erreur réseau lors du chargement 3D')}
          androidLayerType="hardware"
        />
      )}

      {!ready && !error && (
        <View style={overlayStyle} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          {!transparent && <Text style={styles.loadingText}>Chargement 3D…</Text>}
        </View>
      )}

      {error && (
        <View style={overlayStyle} pointerEvents="none">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {showModeBadge && ready && (
        <View style={[styles.modeBadge, isLive ? styles.liveBadge : styles.simBadge]}>
          <View style={[styles.modeDot, { backgroundColor: isLive ? theme.colors.success : theme.colors.textMuted }]} />
          <Text style={styles.modeBadgeText}>{isLive ? 'LIVE' : 'SIMULATION'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#050505',
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: '#050505',
  },
  webviewTransparent: {
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5,5,5,0.85)',
    gap: 12,
  },
  overlayTransparent: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  errorText: {
    ...theme.typography.small,
    color: theme.colors.danger,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  modeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  liveBadge: {
    backgroundColor: 'rgba(0,255,157,0.12)',
    borderColor: 'rgba(0,255,157,0.35)',
  },
  simBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  modeBadgeText: {
    ...theme.typography.small,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.text,
  },
});
