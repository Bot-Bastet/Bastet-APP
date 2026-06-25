import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Camera, Crosshair, Thermometer, Moon, Zap } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_GATEWAY_IP } from '../api/client';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

type VisionMode = 'NORMAL' | 'THERMAL' | 'NIGHT' | 'LIDAR';

export default function VisionScreen() {
  const [mode, setMode] = useState<VisionMode>('NORMAL');
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(height, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedScanLine = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: mode === 'LIDAR' ? 0.8 : 0,
  }));

  const isSecure = process.env.EXPO_PUBLIC_USE_SSL === 'true';
  const protocol = isSecure ? 'https' : 'http';
  const [videoUrl, setVideoUrl] = useState(`${protocol}://${DEFAULT_GATEWAY_IP}:48889/robot/cam1`);

  useEffect(() => {
    const fetchIp = async () => {
      if (Platform.OS !== 'web') {
        const ip = await SecureStore.getItemAsync('gateway_ip');
        if (ip) {
          setVideoUrl(`${protocol}://${ip}:48889/robot/cam1`);
        }
      }
    };
    fetchIp();
  }, []);

  const getBackgroundColor = () => {
    switch(mode) {
      case 'THERMAL': return '#2A0800'; // Dark red
      case 'NIGHT': return '#002200'; // Dark green
      case 'LIDAR': return '#001A22'; // Dark cyan
      default: return theme.colors.background;
    }
  };

  const getAccentColor = () => {
    switch(mode) {
      case 'THERMAL': return '#FF3300';
      case 'NIGHT': return '#00FF44';
      case 'LIDAR': return '#00E5FF';
      default: return theme.colors.primary;
    }
  };

  const ModeButton = ({ title, icon: Icon, targetMode }: { title: string, icon: any, targetMode: VisionMode }) => {
    const isActive = mode === targetMode;
    return (
      <TouchableOpacity 
        style={[styles.modeBtn, isActive && { backgroundColor: getAccentColor() + '20', borderColor: getAccentColor() }]}
        onPress={() => setMode(targetMode)}
      >
        <Icon color={isActive ? getAccentColor() : theme.colors.textMuted} size={24} />
        <Text style={[styles.modeBtnText, isActive && { color: getAccentColor() }]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      
      {/* Background Video Feed */}
      <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' as const }]}>
        {Platform.OS === 'web' ? (
          <iframe 
            src={videoUrl} 
            style={{ width: '100%', height: '100%', border: 'none', opacity: 0.8 } as any} 
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

      {/* Glitch / Grid overlay */}
      <View style={[styles.gridOverlay, { borderColor: getAccentColor() + '30' }]} />
      
      {/* HUD Scanline */}
      <Animated.View style={[styles.scanLine, { backgroundColor: getAccentColor() }, animatedScanLine]} />

      {/* Crosshair Center */}
      <View style={[styles.crosshairContainer, { pointerEvents: 'none' as const }]}>
        <Crosshair color={getAccentColor()} size={120} strokeWidth={1} opacity={0.5} />
        <View style={[styles.crosshairDot, { backgroundColor: getAccentColor() }]} />
      </View>

      <SafeAreaView style={styles.hudOverlay}>
        <View style={styles.topHud}>
          <Text style={[styles.hudText, { color: getAccentColor() }]}>REC •</Text>
          <Text style={[styles.hudText, { color: getAccentColor() }]}>ALT: 14M</Text>
          <Text style={[styles.hudText, { color: getAccentColor() }]}>YAW: +4.2°</Text>
        </View>

        {/* Dynamic Telemetry lines */}
        <View style={styles.sideTelemetryLeft}>
           <View style={[styles.telemetryBar, { backgroundColor: getAccentColor() }]} />
           <View style={[styles.telemetryBar, { height: 120, backgroundColor: getAccentColor(), opacity: 0.5 }]} />
        </View>

        <View style={styles.sideTelemetryRight}>
           <Text style={[styles.hudData, { color: getAccentColor() }]}>ZOOM</Text>
           <Text style={[styles.hudData, { color: getAccentColor(), fontSize: 24 }]}>2.4X</Text>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.modeSelector}>
            <ModeButton title="OPTIC" icon={Camera} targetMode="NORMAL" />
            <ModeButton title="THERM" icon={Thermometer} targetMode="THERMAL" />
            <ModeButton title="NIGHT" icon={Moon} targetMode="NIGHT" />
            <ModeButton title="LIDAR" icon={Zap} targetMode="LIDAR" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    opacity: 0.8, // Allow the background color tint (night mode, thermal) to show through slightly
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    margin: 20,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    boxShadow: '0px 0px 10px #fff',
    elevation: 5,
  },
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  hudOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: theme.spacing.m,
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.m,
  },
  hudText: {
    ...theme.typography.small,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sideTelemetryLeft: {
    position: 'absolute',
    left: 30,
    top: '40%',
    alignItems: 'center',
  },
  sideTelemetryRight: {
    position: 'absolute',
    right: 30,
    top: '45%',
    alignItems: 'flex-end',
  },
  telemetryBar: {
    width: 4,
    height: 60,
    marginBottom: 4,
  },
  hudData: {
    ...theme.typography.body,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  controlsContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 110, // Avoid tab bar
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeBtnText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 8,
  }
});
