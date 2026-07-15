import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import SpotMicro3DViewer from '../components/SpotMicro3DViewer';
import { isValidJointTelemetry } from '../utils/jointMapping';

export default function RobotManualControlScreen({ navigation }: any) {
  const { telemetry, connected, sendJoystick } = useWebSocket();
  const isLive = connected && isValidJointTelemetry(telemetry?.joints);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>CONTRÔLE MANUEL</Text>
        <View style={[styles.modeBadge, isLive ? styles.liveBadge : styles.simBadge]}>
          <View style={[styles.modeDot, { backgroundColor: isLive ? theme.colors.success : theme.colors.textMuted }]} />
          <Text style={styles.modeBadgeText}>{isLive ? 'LIVE' : 'SIM'}</Text>
        </View>
      </SafeAreaView>

      <SpotMicro3DViewer
        mode="interactive"
        joints={telemetry?.joints}
        imu={telemetry?.imu}
        connected={connected}
        onJoystick={sendJoystick}
        style={styles.viewer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.s,
    gap: theme.spacing.s,
    zIndex: 10,
  },
  backButton: {
    padding: theme.spacing.s,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.borderRadius.round,
  },
  title: {
    ...theme.typography.h3,
    flex: 1,
    letterSpacing: 2,
  },
  modeBadge: {
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
  viewer: {
    flex: 1,
  },
});
