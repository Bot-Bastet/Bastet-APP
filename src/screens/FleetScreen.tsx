import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Battery, Activity, Thermometer, Wifi, WifiOff, Cpu, Camera } from 'lucide-react-native';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import SpotMicro3DViewer from '../components/SpotMicro3DViewer';

const { width } = Dimensions.get('window');

export default function FleetScreen({ navigation }: any) {
  const { robotState: bot, telemetry, connected, sendJoystick, sendArduinoCmd } = useWebSocket();
  const sensors = telemetry?.sensors;
  const imu = telemetry?.imu;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>B A S T E T</Text>
          <View style={[styles.connectionBadge, connected ? styles.connectedBadge : styles.disconnectedBadge]}>
            {connected ? <Wifi color={theme.colors.success} size={12} /> : <WifiOff color={theme.colors.danger} size={12} />}
            <Text style={[styles.connectionText, { color: connected ? theme.colors.success : theme.colors.danger }]}>
              {connected ? 'EN LIGNE' : 'HORS LIGNE'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.viewerContainer}>
        <SpotMicro3DViewer
          mode="showcase"
          joints={telemetry?.joints}
          imu={telemetry?.imu}
          connected={connected}
          onJoystick={sendJoystick}
          showModeBadge
          style={styles.viewer}
        />

        <TouchableOpacity
          style={styles.controlFab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('BotDetail')}
        >
          <Text style={styles.controlFabText}>TABLEAU DE BORD</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Battery color={theme.colors.success} size={20} />
          <Text style={styles.statValue}>{Math.floor(bot?.battery ?? 0)}%</Text>
          <Text style={styles.statLabel}>BATTERIE</Text>
        </View>
        <View style={styles.statCard}>
          <Thermometer color={theme.colors.warning} size={20} />
          <Text style={styles.statValue}>{sensors?.temp_c?.toFixed(0) ?? '--'}°</Text>
          <Text style={styles.statLabel}>TEMP</Text>
        </View>
        <View style={styles.statCard}>
          <Cpu color={theme.colors.secondary} size={20} />
          <Text style={styles.statValue}>{sensors?.cpu_percent ?? '--'}%</Text>
          <Text style={styles.statLabel}>CPU</Text>
        </View>
        <View style={styles.statCard}>
          <Camera color={sensors?.cam1_connected ? theme.colors.success : theme.colors.textMuted} size={20} />
          <Text style={[styles.statValue, { color: sensors?.cam1_connected ? theme.colors.success : theme.colors.textMuted }]}>
            {sensors?.cam1_connected ? 'OK' : 'NON'}
          </Text>
          <Text style={styles.statLabel}>CAM 1</Text>
        </View>
      </View>

      {imu && (
        <View style={styles.imuBar}>
          <View style={styles.imuItem}>
            <Text style={styles.imuLabel}>ROLL</Text>
            <Text style={styles.imuValue}>{imu.roll?.toFixed(1)}°</Text>
          </View>
          <View style={styles.imuDivider} />
          <View style={styles.imuItem}>
            <Text style={styles.imuLabel}>PITCH</Text>
            <Text style={styles.imuValue}>{imu.pitch?.toFixed(1)}°</Text>
          </View>
          <View style={styles.imuDivider} />
          <View style={styles.imuItem}>
            <Text style={styles.imuLabel}>YAW</Text>
            <Text style={styles.imuValue}>{imu.yaw?.toFixed(1)}°</Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => sendArduinoCmd('stand')}>
          <Text style={styles.actionText}>DEBOUT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => sendArduinoCmd('sit')}>
          <Text style={[styles.actionText, { color: theme.colors.secondary }]}>ASSIS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  connectedBadge: {
    backgroundColor: 'rgba(0,255,157,0.1)',
    borderColor: 'rgba(0,255,157,0.3)',
  },
  disconnectedBadge: {
    backgroundColor: 'rgba(213,0,28,0.1)',
    borderColor: 'rgba(213,0,28,0.3)',
  },
  connectionText: {
    ...theme.typography.small,
    fontSize: 9,
    fontWeight: '700',
  },
  viewerContainer: {
    width: width,
    height: width * 0.7,
    backgroundColor: '#050505',
    position: 'relative',
  },
  viewer: {
    ...StyleSheet.absoluteFill,
  },
  controlFab: {
    position: 'absolute',
    bottom: 12,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.s,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  controlFabText: {
    ...theme.typography.small,
    fontWeight: '800',
    color: theme.colors.background,
    letterSpacing: 1.5,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.m,
    marginHorizontal: 3,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    ...theme.typography.h3,
    marginTop: 4,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  imuBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surfaceLight,
    marginHorizontal: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imuItem: {
    alignItems: 'center',
  },
  imuLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontSize: 9,
  },
  imuValue: {
    ...theme.typography.body,
    fontWeight: '700',
    marginTop: 2,
  },
  imuDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    gap: theme.spacing.s,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  actionDanger: {
    borderColor: theme.colors.secondary,
  },
  actionText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.success,
    letterSpacing: 1,
  },
});
