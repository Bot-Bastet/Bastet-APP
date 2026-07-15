import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, FadeInLeft } from 'react-native-reanimated';
import { ChevronLeft, Download, Server, Cpu, CircuitBoard, RefreshCw, CheckCircle, XCircle, Clock, Loader } from 'lucide-react-native';
import { theme } from '../theme';
import { UpdateProgress, UpdateStatus } from '../types';
import {
  triggerGatewayUpdate, getGatewayUpdateProgress,
  triggerRobotUpdate, getRobotUpdateProgress,
  triggerArduinoUpdate, getArduinoUpdateProgress,
  rollbackGateway, rollbackRobot,
} from '../api/systemUpdate';
import { getCoreState } from '../api/coreState';

// ═══════════════════════════════════════════════════════════════
// SystemUpdateScreen — Section 7 DocsGateway
// Mises à jour Gateway, Robot, Arduino avec progression live
// ═══════════════════════════════════════════════════════════════

const STATUS_LABELS: Record<UpdateStatus, string> = {
  idle: 'Prêt',
  downloading: 'Téléchargement...',
  extracting: 'Extraction...',
  done: 'Terminé',
  failed: 'Échec',
};

const STATUS_COLORS: Record<UpdateStatus, string> = {
  idle: theme.colors.textMuted,
  downloading: theme.colors.secondary,
  extracting: theme.colors.warning,
  done: theme.colors.success,
  failed: theme.colors.danger,
};

interface UpdateCardProps {
  title: string;
  icon: any;
  progress: UpdateProgress | null;
  loading: boolean;
  onTrigger: () => void;
  onRefresh: () => void;
  onRollback?: () => void;
  delay?: number;
  version?: string;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ title, icon: Icon, progress, loading, onTrigger, onRefresh, onRollback, delay = 0, version }) => {
  const status = progress?.status || 'idle';
  const percent = progress?.percent || 0;
  const isUpdating = status === 'downloading' || status === 'extracting';
  const statusColor = STATUS_COLORS[status];

  // Pulsing animation when updating
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (isUpdating) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isUpdating]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const StatusIcon = () => {
    switch (status) {
      case 'done': return <CheckCircle color={theme.colors.success} size={20} />;
      case 'failed': return <XCircle color={theme.colors.danger} size={20} />;
      case 'downloading':
      case 'extracting': return <Loader color={statusColor} size={20} />;
      default: return <Clock color={theme.colors.textMuted} size={20} />;
    }
  };

  return (
    <Animated.View entering={FadeInLeft.delay(delay).duration(500).springify()} style={styles.updateCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Icon color={statusColor} size={28} strokeWidth={1.5} />
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            {version && <Text style={styles.versionText}>v{version}</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={() => onRefresh()} style={styles.refreshBtn}>
          <RefreshCw color={theme.colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: `${percent}%`, backgroundColor: statusColor },
              pulseStyle
            ]} 
          />
        </View>
        <Text style={[styles.percentText, { color: statusColor }]}>{percent}%</Text>
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <StatusIcon />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>

        <TouchableOpacity 
          style={[
            styles.triggerBtn, 
            (isUpdating || loading) && styles.triggerBtnDisabled,
            status === 'done' && styles.triggerBtnDone
          ]} 
          onPress={onTrigger} 
          disabled={isUpdating || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.background} size="small" />
          ) : (
            <>
              <Download color={isUpdating ? theme.colors.textMuted : theme.colors.background} size={18} />
              <Text style={[styles.triggerBtnText, isUpdating && { color: theme.colors.textMuted }]}>
                {status === 'done' ? 'À JOUR' : 'METTRE À JOUR'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {status === 'failed' && onRollback && (
        <TouchableOpacity style={styles.rollbackBtn} onPress={onRollback} activeOpacity={0.7}>
          <Text style={styles.rollbackBtnText}>ROLLBACK</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default function SystemUpdateScreen({ navigation }: any) {
  const [gatewayProgress, setGatewayProgress] = useState<UpdateProgress | null>(null);
  const [robotProgress, setRobotProgress] = useState<UpdateProgress | null>(null);
  const [arduinoProgress, setArduinoProgress] = useState<UpdateProgress | null>(null);
  const [robotVersion, setRobotVersion] = useState<string>('');
  const [arduinoVersion, setArduinoVersion] = useState<string>('');
  const [loadingGateway, setLoadingGateway] = useState(false);
  const [loadingRobot, setLoadingRobot] = useState(false);
  const [loadingArduino, setLoadingArduino] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load of all progress
  const fetchAll = async (force = false) => {
    try {
      const [gw, rb, ar] = await Promise.all([
        getGatewayUpdateProgress(force).catch(() => null),
        getRobotUpdateProgress(force).catch(() => null),
        getArduinoUpdateProgress(force).catch(() => null),
      ]);
      if (gw) setGatewayProgress(gw);
      if (rb) setRobotProgress(rb);
      if (ar) setArduinoProgress(ar);
    } catch (e) {
      console.error('Error fetching update progress', e);
    }
  };

  // Load versions from CORE State
  const fetchVersions = async () => {
    try {
      const state = await getCoreState();
      if (state.robot_version) setRobotVersion(state.robot_version);
      if (state.arduino_version) setArduinoVersion(state.arduino_version);
    } catch (e) {
      console.warn('Could not fetch CORE state for versions', e);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchVersions();
  }, []);

  // Auto-poll every 3s when any update is active
  useEffect(() => {
    const isAnyUpdating = (
      gatewayProgress?.status === 'downloading' || gatewayProgress?.status === 'extracting' ||
      robotProgress?.status === 'downloading' || robotProgress?.status === 'extracting' ||
      arduinoProgress?.status === 'downloading' || arduinoProgress?.status === 'extracting'
    );

    if (isAnyUpdating) {
      pollRef.current = setInterval(() => fetchAll(), 3000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gatewayProgress?.status, robotProgress?.status, arduinoProgress?.status]);

  const handleTriggerGateway = async () => {
    setLoadingGateway(true);
    try {
      await triggerGatewayUpdate();
      setTimeout(() => fetchAll(), 1000);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de lancer la mise à jour Gateway.');
    } finally {
      setLoadingGateway(false);
    }
  };

  const handleTriggerRobot = async () => {
    setLoadingRobot(true);
    try {
      await triggerRobotUpdate();
      setTimeout(() => fetchAll(), 1000);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de lancer la mise à jour Robot.');
    } finally {
      setLoadingRobot(false);
    }
  };

  const handleTriggerArduino = async () => {
    setLoadingArduino(true);
    try {
      await triggerArduinoUpdate();
      setTimeout(() => fetchAll(), 1000);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de lancer le flash Arduino.');
    } finally {
      setLoadingArduino(false);
    }
  };

  const handleRollbackGateway = async () => {
    const version = gatewayProgress?.version || gatewayProgress?.latest_version;
    if (!version) {
      Alert.alert('Rollback', 'Aucune version cible disponible.');
      return;
    }
    try {
      await rollbackGateway(version);
      setTimeout(() => fetchAll(true), 1000);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Rollback Gateway impossible.');
    }
  };

  const handleRollbackRobot = async () => {
    const version = robotProgress?.version || robotVersion;
    if (!version) {
      Alert.alert('Rollback', 'Aucune version cible disponible.');
      return;
    }
    try {
      await rollbackRobot(version);
      setTimeout(() => fetchAll(true), 1000);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Rollback Robot impossible.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>M I S E S   À   J O U R</Text>
        <TouchableOpacity style={styles.forceRefreshBtn} onPress={() => fetchAll(true)}>
          <RefreshCw color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionNote}>
          Sécurité anti-blocage : le statut est réinitialisé à «failed» après 10 min sans progression.
        </Text>

        <UpdateCard
          title="GATEWAY"
          icon={Server}
          progress={gatewayProgress}
          loading={loadingGateway}
          onTrigger={handleTriggerGateway}
          onRefresh={() => getGatewayUpdateProgress(true).then(setGatewayProgress).catch(() => {})}
          onRollback={handleRollbackGateway}
          delay={100}
        />

        <UpdateCard
          title="ROBOT (CORE)"
          icon={Cpu}
          progress={robotProgress}
          loading={loadingRobot}
          onTrigger={handleTriggerRobot}
          onRefresh={() => getRobotUpdateProgress(true).then(setRobotProgress).catch(() => {})}
          onRollback={handleRollbackRobot}
          delay={200}
          version={robotVersion}
        />

        <UpdateCard
          title="ARDUINO MEGA"
          icon={CircuitBoard}
          progress={arduinoProgress}
          loading={loadingArduino}
          onTrigger={handleTriggerArduino}
          onRefresh={() => getArduinoUpdateProgress(true).then(setArduinoProgress).catch(() => {})}
          delay={300}
          version={arduinoVersion}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  backButton: { padding: theme.spacing.xs },
  title: {
    ...theme.typography.h3,
    letterSpacing: 2,
  },
  forceRefreshBtn: {
    padding: theme.spacing.s,
    backgroundColor: 'rgba(213, 0, 28, 0.1)',
    borderRadius: theme.borderRadius.round,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  sectionNote: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontStyle: 'italic',
  },
  updateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...theme.typography.h3,
    fontSize: 16,
  },
  versionText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    padding: theme.spacing.s,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.round,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: theme.spacing.m,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    ...theme.typography.body,
    fontWeight: '700',
    width: 45,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    marginLeft: theme.spacing.s,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.s,
  },
  triggerBtnDisabled: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  triggerBtnDone: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  triggerBtnText: {
    ...theme.typography.small,
    color: theme.colors.background,
    fontWeight: '700',
    marginLeft: theme.spacing.s,
  },
  rollbackBtn: {
    marginTop: theme.spacing.m,
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(213, 0, 28, 0.1)',
  },
  rollbackBtnText: {
    ...theme.typography.small,
    color: theme.colors.danger,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
