import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Switch, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { Battery, BatteryCharging, SignalHigh, Lock, Shield, Power, Footprints, Settings as SettingsIcon, Camera, MapPin, Wifi, Activity, RefreshCw, ChevronLeft, Cpu, Thermometer, Video, VideoOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import { sendRobotCommand } from '../api/robot';
import { getCoreState } from '../api/coreState';
import { CoreState, AIState } from '../types';

const { width, height } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width > 768;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Aggressive "Physical" looking button
const DashboardButton = ({ icon: Icon, label, isActive = false, activeColor = theme.colors.primary, onToggle }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isActive ? activeColor + '20' : theme.colors.surfaceLight,
    borderColor: isActive ? activeColor : theme.colors.border,
  }));

  const onPressIn = () => { scale.value = withSpring(0.95); };
  const onPressOut = () => { scale.value = withSpring(1); };
  const onPress = () => {
    if (onToggle) onToggle(!isActive);
  };

  return (
    <AnimatedTouchableOpacity 
      style={[styles.dashBtn, animatedStyle]}
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <Icon color={isActive ? activeColor : theme.colors.textMuted} size={28} strokeWidth={isActive ? 2.5 : 1.5} />
      <Text style={[styles.dashBtnLabel, isActive && { color: activeColor }]}>{label}</Text>
    </AnimatedTouchableOpacity>
  );
};

// AI State indicator chip
const AIChip = ({ label, value }: { label: string; value: string }) => {
  const isEnabled = value === 'enabled' || value === 'robot' || value === 'node';
  const chipColor = value === 'robot' ? theme.colors.primary : 
                    value === 'node' ? theme.colors.secondary : 
                    value === 'enabled' ? theme.colors.success : theme.colors.textMuted;
  return (
    <View style={[styles.aiChip, isEnabled && { borderColor: chipColor + '60', backgroundColor: chipColor + '10' }]}>
      <View style={[styles.aiChipDot, { backgroundColor: isEnabled ? chipColor : theme.colors.textMuted }]} />
      <Text style={[styles.aiChipLabel, isEnabled && { color: chipColor }]}>{label}</Text>
      <Text style={[styles.aiChipValue, isEnabled && { color: chipColor }]}>{value.toUpperCase()}</Text>
    </View>
  );
};

export default function BotDetailScreen({ route, navigation }: any) {
  const { robotState: bot, telemetry, sendCameraSetup } = useWebSocket();
  const [localStatus, setLocalStatus] = useState(bot?.status || 'Hors ligne');
  const [coreState, setCoreState] = useState<CoreState | null>(null);
  const [loadingState, setLoadingState] = useState(true);

  // Fetch CORE State from API (Section 6 — DocsGateway)
  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await getCoreState();
        setCoreState(state);
      } catch (e) {
        console.warn('Could not fetch CORE state', e);
      } finally {
        setLoadingState(false);
      }
    };
    fetchState();
    // Refresh every 10 seconds
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bot?.status) {
      setLocalStatus(bot.status);
    }
  }, [bot?.status]);

  // Override with CORE state status when available
  useEffect(() => {
    if (coreState?.robot_status) {
      const statusMap: Record<string, string> = {
        'online': 'En ligne',
        'hibernating': 'En veille',
        'offline': 'Hors ligne',
      };
      setLocalStatus(statusMap[coreState.robot_status] || coreState.robot_status);
    }
  }, [coreState?.robot_status]);

  const pulseOpacity = useSharedValue(0.2);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.2, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const handleSetStatus = async (status: string, command: string) => {
    setLocalStatus(status); // Optimistic / Fallback update
    try {
      await sendRobotCommand('set_status', command);
    } catch(e) {
      console.warn("Failed to send command", e);
    }
  };

  // Sensors from CORE State
  const sensors = coreState?.sensors;
  const aiState = coreState?.ai_state || telemetry?.ai_state;

  // IMU from WebSocket telemetry
  const imu = telemetry?.imu;

  return (
    <View style={styles.container}>
      {/* Floating Top Bar (always clickable) */}
      <View style={styles.floatingTopBar} pointerEvents="box-none">
         <SafeAreaView style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }} pointerEvents="box-none">
           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.6}>
             <ChevronLeft color={theme.colors.text} size={32} />
           </TouchableOpacity>

           <View style={styles.statusBadge}>
              <Animated.View style={[styles.statusDot, { backgroundColor: bot.colorTheme }, dotStyle]} />
              <Text style={styles.statusText}>{localStatus.toUpperCase()}</Text>
           </View>
         </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Edge-to-Edge Showcase Header */}
        <View style={styles.showcaseHeader}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', theme.colors.background]}
            style={styles.showcaseGradient}
          />

          <View style={styles.renderMockContainer}>
             <Text style={[styles.renderMockText, { color: bot.colorTheme }]}>[ 3D SHOWROOM ]</Text>
          </View>
          
          <View style={styles.titlesContainer}>
            <Text style={styles.botId}>{bot.id}</Text>
            <Text style={styles.botName}>{bot.name}</Text>
            {coreState && (
              <View style={styles.versionRow}>
                <Text style={styles.versionTag}>CORE {coreState.robot_version}</Text>
                <Text style={styles.versionTag}>ARDUINO {coreState.arduino_version}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Control Panel Area */}
        <View style={styles.panelContainer}>
          
          {/* ═══ REAL SENSORS (Section 6 — DocsGateway) ═══ */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryColumn}>
              <BatteryCharging color={theme.colors.success} size={28} />
              <Text style={styles.telemetryLabel}>Battery</Text>
              <Text style={styles.telemetryValue}>{Math.floor(bot.battery)}%</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${bot.battery}%` }]} />
              </View>
            </View>
            
            <View style={styles.telemetryColumn}>
              <Thermometer color={sensors?.temp_c && sensors.temp_c > 70 ? theme.colors.danger : theme.colors.success} size={28} />
              <Text style={styles.telemetryLabel}>Temp</Text>
              <Text style={styles.telemetryValue}>{sensors?.temp_c?.toFixed(0) || '--'}°C</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { 
                  width: `${Math.min(100, (sensors?.temp_c || 0))}%`,
                  backgroundColor: sensors?.temp_c && sensors.temp_c > 70 ? theme.colors.danger : theme.colors.success 
                }]} />
              </View>
            </View>
          </View>

          {/* CPU & RAM from real sensors */}
          {sensors && (
            <View style={styles.sensorGrid}>
              <View style={styles.sensorItem}>
                <Cpu color={theme.colors.secondary} size={20} />
                <Text style={styles.sensorLabel}>CPU</Text>
                <Text style={styles.sensorValue}>{sensors.cpu_percent}%</Text>
              </View>
              <View style={styles.sensorItem}>
                <Activity color={theme.colors.warning} size={20} />
                <Text style={styles.sensorLabel}>RAM</Text>
                <Text style={styles.sensorValue}>{sensors.ram_percent?.toFixed(0)}%</Text>
              </View>
              <View style={styles.sensorItem}>
                <Activity color={theme.colors.primary} size={20} />
                <Text style={styles.sensorLabel}>Load</Text>
                <Text style={styles.sensorValue}>{sensors.system?.cpu_load_1m?.toFixed(1) || '--'}</Text>
              </View>
            </View>
          )}

          {/* ═══ IMU FROM TELEMETRY (Section 1 — WebSocket) ═══ */}
          {imu && (
            <>
              <Text style={styles.sectionTitle}>I M U   (GYROSCOPE)</Text>
              <View style={styles.imuCard}>
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
            </>
          )}

          {/* ═══ AI STATE (Section 6 — DocsGateway) ═══ */}
          {aiState && (
            <>
              <Text style={styles.sectionTitle}>M O D U L E S   I A</Text>
              <View style={styles.aiGrid}>
                <AIChip label="TTS" value={aiState.tts} />
                <AIChip label="STT" value={aiState.stt} />
                <AIChip label="CHAT" value={aiState.chat} />
                <AIChip label="YOLO" value={aiState.yolo} />
                <AIChip label="FACE" value={aiState.face_rec} />
              </View>
            </>
          )}

          {/* ═══ CAMERA CONTROLS (Section 1 — camera_setup) ═══ */}
          <Text style={styles.sectionTitle}>C A M É R A S</Text>
          <View style={styles.cameraCard}>
            <View style={styles.cameraRow}>
              <View style={styles.cameraRowLeft}>
                <Video color={coreState?.active_streams?.['1'] ? theme.colors.success : theme.colors.textMuted} size={22} />
                <Text style={styles.cameraLabel}>Caméra 1</Text>
              </View>
              <Switch
                value={coreState?.active_streams?.['1'] || false}
                onValueChange={(val) => sendCameraSetup(1, val)}
                trackColor={{ false: theme.colors.surface, true: theme.colors.success + '60' }}
                thumbColor={coreState?.active_streams?.['1'] ? theme.colors.success : '#888'}
              />
            </View>
            <View style={styles.cameraDivider} />
            <View style={styles.cameraRow}>
              <View style={styles.cameraRowLeft}>
                <Video color={coreState?.active_streams?.['2'] ? theme.colors.success : theme.colors.textMuted} size={22} />
                <Text style={styles.cameraLabel}>Caméra 2</Text>
              </View>
              <Switch
                value={coreState?.active_streams?.['2'] || false}
                onValueChange={(val) => sendCameraSetup(2, val)}
                trackColor={{ false: theme.colors.surface, true: theme.colors.success + '60' }}
                thumbColor={coreState?.active_streams?.['2'] ? theme.colors.success : '#888'}
              />
            </View>
          </View>

          {/* ═══ CONNECTIVITY STATUS ═══ */}
          {sensors && (
            <>
              <Text style={styles.sectionTitle}>C O N N E C T I V I T É</Text>
              <View style={styles.connectivityCard}>
                <View style={styles.connectRow}>
                  <Text style={styles.connectLabel}>Cam 1</Text>
                  <View style={[styles.connectDot, { backgroundColor: sensors.cam1_connected ? theme.colors.success : theme.colors.danger }]} />
                </View>
                <View style={styles.connectRow}>
                  <Text style={styles.connectLabel}>Cam 2</Text>
                  <View style={[styles.connectDot, { backgroundColor: sensors.cam2_connected ? theme.colors.success : theme.colors.danger }]} />
                </View>
                <View style={styles.connectRow}>
                  <Text style={styles.connectLabel}>Arduino</Text>
                  <View style={[styles.connectDot, { backgroundColor: sensors.arduino_connected ? theme.colors.success : theme.colors.danger }]} />
                </View>
                <View style={styles.connectRow}>
                  <Text style={styles.connectLabel}>SpotBot</Text>
                  <View style={[styles.connectDot, { backgroundColor: sensors.spotbot_service_active ? theme.colors.success : theme.colors.danger }]} />
                </View>
              </View>
            </>
          )}

          {/* ═══ SEEN BY ROBOT (CORE State) ═══ */}
          {coreState && (
            <>
              <Text style={styles.sectionTitle}>V I S I O N   E N   C O U R S</Text>
              <View style={styles.visionCard}>
                <View style={styles.visionRow}>
                  <Text style={styles.visionLabel}>Personne reconnue</Text>
                  <Text style={[styles.visionValue, { color: coreState.seen_person ? theme.colors.success : theme.colors.textMuted }]}>
                    {coreState.seen_person || 'Aucune'}
                  </Text>
                </View>
                {coreState.seen_objects && coreState.seen_objects.length > 0 && (
                  <View style={styles.objectsRow}>
                    <Text style={styles.visionLabel}>Objets détectés</Text>
                    <View style={styles.objectTags}>
                      {coreState.seen_objects.map((obj, i) => (
                        <View key={i} style={styles.objectTag}>
                          <Text style={styles.objectTagText}>{obj}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
          
          <Text style={styles.sectionTitle}>C O M M A N D E S</Text>
          
          <View style={styles.gridContainer}>
            <DashboardButton 
              icon={Lock} 
              label="VERROUILLER"
              isActive={localStatus === 'Hors ligne'} 
              onToggle={() => handleSetStatus('Hors ligne', 'lock')}
            />
            <DashboardButton 
              icon={Shield} 
              label="GARDE"
              activeColor={theme.colors.success} 
              isActive={localStatus === 'En garde'} 
              onToggle={() => handleSetStatus('En garde', 'guard')}
            />
            <DashboardButton 
              icon={Footprints} 
              label="PATROUILLE"
              activeColor={theme.colors.secondary} 
              isActive={localStatus === 'En patrouille'} 
              onToggle={() => handleSetStatus('En patrouille', 'patrol')}
            />
            <DashboardButton 
              icon={Power} 
              label="CHARGE"
              activeColor={theme.colors.danger} 
              isActive={localStatus === 'En charge'} 
              onToggle={() => handleSetStatus('En charge', 'charge')}
            />
          </View>

          <Text style={styles.sectionTitle}>Quick Controls</Text>
          <View style={styles.qcCard}>
            <View style={styles.qcRow}>
              <View style={styles.qcRowLeft}>
                <Power color={theme.colors.textMuted} size={22} />
                <Text style={styles.qcLabel}>Power</Text>
              </View>
              <Switch 
                value={localStatus === 'Hors ligne' ? false : true} 
                onValueChange={(val) => handleSetStatus(val ? 'En ligne' : 'Hors ligne', val ? 'unlock' : 'lock')} 
                trackColor={{ false: theme.colors.surface, true: '#fff' }}
                thumbColor={localStatus !== 'Hors ligne' ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.qcDivider} />

            <View style={styles.qcRow}>
              <View style={styles.qcRowLeft}>
                <Activity color="#4A90E2" size={22} />
                <Text style={styles.qcLabel}>Status</Text>
              </View>
              <View style={styles.qcBadge}>
                <View style={styles.qcBadgeDot} />
                <Text style={styles.qcBadgeText}>{localStatus.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.qcDivider} />

            <TouchableOpacity style={styles.qcOutlineBtn} activeOpacity={0.6} onPress={() => handleSetStatus(localStatus, 'restart')}>
              <RefreshCw color="#D4A373" size={20} />
              <Text style={styles.qcOutlineBtnText}>Restart Device</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qcOutlineBtn} activeOpacity={0.6} onPress={() => navigation.navigate('Settings')}>
              <SettingsIcon color="#D4A373" size={20} />
              <Text style={styles.qcOutlineBtnText}>Advanced Settings</Text>
            </TouchableOpacity>
          </View>

          {/* ═══ ROS TOPICS FROM TELEMETRY ═══ */}
          {telemetry?.topics && telemetry.topics.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>R O S   T O P I C S</Text>
              {telemetry.topics.slice(0, 8).map((topic, i) => (
                <View key={i} style={styles.topicRow}>
                  <View style={styles.topicLeft}>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <Text style={styles.topicType}>{topic.type}</Text>
                  </View>
                  <Text style={styles.topicHz}>{topic.hz} Hz</Text>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>S Y S T È M E S</Text>

          {/* Hard-edged tech rows */}
          <TouchableOpacity style={styles.techRow} activeOpacity={0.6} onPress={() => {}}>
             <View style={styles.techRowLeft}>
                <Camera color={theme.colors.text} size={24} strokeWidth={1.5} />
                <View style={{ marginLeft: 16 }}>
                   <Text style={styles.techRowTitle}>VISION LIDAR</Text>
                   <Text style={styles.techRowSub}>SCAN ACTIF</Text>
                </View>
             </View>
             <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.techRow} activeOpacity={0.6} onPress={() => {}}>
             <View style={styles.techRowLeft}>
                <MapPin color={theme.colors.text} size={24} strokeWidth={1.5} />
                <View style={{ marginLeft: 16 }}>
                   <Text style={styles.techRowTitle}>GPS TRACKING</Text>
                   <Text style={styles.techRowSub}>{bot.latitude?.toFixed(4) || 0}, {bot.longitude?.toFixed(4) || 0}</Text>
                </View>
             </View>
             <View style={[styles.activeIndicator, { backgroundColor: theme.colors.success }]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.techRow} activeOpacity={0.6} onPress={() => {}}>
             <View style={styles.techRowLeft}>
                <SettingsIcon color={theme.colors.text} size={24} strokeWidth={1.5} />
                <View style={{ marginLeft: 16 }}>
                   <Text style={styles.techRowTitle}>TÉLÉMÉTRIE</Text>
                   <Text style={styles.techRowSub}>{bot.speed} KM/H - TEMP {sensors?.temp_c?.toFixed(0) || '--'}°C</Text>
                </View>
             </View>
             <Wifi color={theme.colors.textMuted} size={20} />
          </TouchableOpacity>

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  showcaseHeader: {
    width: '100%',
    height: isDesktop ? '100%' : width * 1.1,
    backgroundColor: '#050505',
    position: isDesktop ? 'absolute' : 'relative',
    top: 0, left: 0, right: 0,
    zIndex: 0,
  },
  showcaseGradient: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: isDesktop ? '80%' : '50%', // Gradient goes higher on desktop to blend with panels
    zIndex: 1,
  },
  floatingTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.m,
    paddingTop: Platform.OS === 'web' ? theme.spacing.m : (Platform.OS === 'android' ? 40 : 0),
    zIndex: 100, // Very important to be above ScrollView
  },
  backButton: {
    padding: theme.spacing.s,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: theme.borderRadius.round,
    marginRight: 'auto', // Pushes the badge to the right if there's space, or we can use flex
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.s, // Sharp!
  },
  statusDot: {
    width: 6,
    height: 6,
    marginRight: 8,
  },
  statusText: {
    ...theme.typography.small,
  },
  renderMockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderMockText: {
    ...theme.typography.h1,
    fontSize: 48,
    opacity: 0.1,
  },
  titlesContainer: {
    position: 'absolute',
    bottom: isDesktop ? 'auto' : theme.spacing.l,
    top: isDesktop ? 100 : 'auto',
    left: theme.spacing.xl,
    zIndex: 2,
  },
  botId: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  botName: {
    ...theme.typography.h1,
    fontSize: 42,
  },
  versionRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.s,
  },
  versionTag: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: theme.spacing.s,
    fontSize: 10,
    overflow: 'hidden',
  },
  panelContainer: {
    padding: theme.spacing.xl,
    paddingTop: isDesktop ? 220 : theme.spacing.xl, // Make room for titles on desktop
    zIndex: 2,
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.l,
    marginTop: theme.spacing.m,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dashBtn: {
    width: '47%', // 2 columns
    backgroundColor: theme.colors.surfaceLight,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.s, // Sharp edges
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
    alignItems: 'flex-start',
  },
  dashBtnLabel: {
    ...theme.typography.small,
    marginTop: theme.spacing.m,
  },
  // ═══ SENSOR GRID ═══
  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  sensorItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.m,
    marginHorizontal: 3,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sensorLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 6,
    fontSize: 10,
  },
  sensorValue: {
    ...theme.typography.body,
    fontWeight: '800',
    marginTop: 2,
  },
  // ═══ IMU ═══
  imuCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.l,
  },
  imuItem: {
    flex: 1,
    alignItems: 'center',
  },
  imuLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  imuValue: {
    ...theme.typography.h2,
    fontSize: 22,
    marginTop: 4,
  },
  imuDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.m,
  },
  // ═══ AI STATE ═══
  aiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  aiChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  aiChipLabel: {
    ...theme.typography.small,
    fontWeight: '700',
    fontSize: 11,
    color: theme.colors.textMuted,
    marginRight: 6,
  },
  aiChipValue: {
    ...theme.typography.small,
    fontSize: 9,
    color: theme.colors.textMuted,
  },
  // ═══ CAMERA CONTROLS ═══
  cameraCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  cameraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    marginLeft: theme.spacing.m,
  },
  cameraDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.m,
  },
  // ═══ CONNECTIVITY ═══
  connectivityCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  connectRow: {
    alignItems: 'center',
  },
  connectLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 6,
  },
  connectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // ═══ VISION ═══
  visionCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  visionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  visionLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  visionValue: {
    ...theme.typography.body,
    fontWeight: '700',
  },
  objectsRow: {
    marginTop: theme.spacing.s,
  },
  objectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.s,
  },
  objectTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  objectTagText: {
    ...theme.typography.small,
    color: theme.colors.secondary,
    fontSize: 11,
  },
  // ═══ ROS TOPICS ═══
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    marginBottom: 2,
  },
  topicLeft: {
    flex: 1,
  },
  topicName: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  topicType: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  topicHz: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.secondary,
    fontSize: 14,
  },
  // ═══ EXISTING STYLES ═══
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.s, // Sharp
    marginBottom: 2, // Tiny gap for tech feel
  },
  techRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techRowTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    letterSpacing: 1,
  },
  techRowSub: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  activeIndicator: {
    width: 12,
    height: 4, // Rectangle indicator
    borderRadius: 2,
  },
  telemetryCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.m,
  },
  telemetryColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryLabel: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xs,
  },
  telemetryValue: {
    ...theme.typography.h1,
    fontSize: 32,
    marginBottom: theme.spacing.m,
  },
  progressBarTrack: {
    width: '85%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 5,
  },
  qcCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  qcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  qcRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qcLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    marginLeft: theme.spacing.m,
  },
  qcDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: theme.spacing.m,
  },
  qcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qcBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888',
    marginRight: 6,
  },
  qcBadgeText: {
    ...theme.typography.small,
    color: '#ccc',
    fontWeight: '700',
  },
  qcOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4A373',
    borderRadius: theme.borderRadius.s,
    paddingVertical: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  qcOutlineBtnText: {
    ...theme.typography.body,
    color: '#D4A373',
    fontWeight: '600',
    marginLeft: theme.spacing.m,
  }
});
