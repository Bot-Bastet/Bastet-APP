import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Switch, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import { Battery, BatteryCharging, SignalHigh, Lock, Shield, Power, Footprints, Settings as SettingsIcon, Camera, MapPin, Wifi, Activity, RefreshCw, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import { sendRobotCommand } from '../api/robot';

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

export default function BotDetailScreen({ route, navigation }: any) {
  const { robotState: bot } = useWebSocket();
  const [localStatus, setLocalStatus] = useState(bot?.status || 'Hors ligne');

  useEffect(() => {
    if (bot?.status) {
      setLocalStatus(bot.status);
    }
  }, [bot?.status]);

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
          </View>
        </View>

        {/* Control Panel Area */}
        <View style={styles.panelContainer}>
          
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
              <SignalHigh color={theme.colors.success} size={28} />
              <Text style={styles.telemetryLabel}>Signal</Text>
              <Text style={styles.telemetryValue}>95%</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '95%' }]} />
              </View>
            </View>
          </View>
          
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
                   <Text style={styles.techRowSub}>{bot.speed} KM/H - TEMP 32°C</Text>
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
