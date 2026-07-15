import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { ChevronRight, Navigation } from 'lucide-react-native';
import { useBots } from '../context/BotContext';
import { useWebSocket } from '../context/WebSocketContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function MapScreen({ navigation }: any) {
  const { bots } = useBots();
  const { telemetry, connected, sendNavGoal } = useWebSocket();
  const [activeBot, setActiveBot] = useState(bots[0]);
  const [mapCenter, setMapCenter] = useState({ lat: bots[0].latitude, lng: bots[0].longitude });
  
  useEffect(() => {
    const updatedActiveBot = bots.find(b => b.id === activeBot.id);
    if (updatedActiveBot) {
      setActiveBot(updatedActiveBot);
      
      // Mettre à jour le centre uniquement si mouvement significatif (evite le reload iframe)
      const diffLat = Math.abs(updatedActiveBot.latitude - mapCenter.lat);
      const diffLng = Math.abs(updatedActiveBot.longitude - mapCenter.lng);
      if (diffLat > 0.0005 || diffLng > 0.0005) {
        setMapCenter({ lat: updatedActiveBot.latitude, lng: updatedActiveBot.longitude });
      }
    }
  }, [bots]);

  useEffect(() => {
    setMapCenter({ lat: activeBot.latitude, lng: activeBot.longitude });
  }, [activeBot.id]);

  return (
    <View style={styles.container}>
      <iframe 
        src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=15&output=embed`}
        style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
      />

      <SafeAreaView style={styles.overlaySafeArea}>
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <TouchableOpacity 
            style={styles.overlayCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('HomeStack', { screen: 'BotDetail', params: { botId: activeBot.id } })}
          >
            <View style={styles.overlayHeader}>
              <Text style={styles.droneName}>{activeBot.name}</Text>
              <ChevronRight color={theme.colors.textMuted} size={20} />
            </View>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>VITESSE</Text>
                <Text style={styles.statValue}>{activeBot.speed} km/h</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>BATTERIE</Text>
                <Text style={styles.statValue}>{activeBot.battery}%</Text>
              </View>
            </View>
            {connected && telemetry?.pose && (
              <TouchableOpacity
                style={styles.navGoalBtn}
                activeOpacity={0.8}
                onPress={() => sendNavGoal(telemetry.pose.x, telemetry.pose.y)}
              >
                <Navigation color={theme.colors.primary} size={16} />
                <Text style={styles.navGoalText}>OBJECTIF SLAM</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overlaySafeArea: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
  },
  overlayCard: {
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  droneName: {
    ...theme.typography.h3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    ...theme.typography.small,
  },
  statValue: {
    ...theme.typography.body,
    marginTop: theme.spacing.xs,
    fontWeight: '700',
  },
  navGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.primary + '60',
    backgroundColor: theme.colors.primary + '15',
    gap: 8,
  },
  navGoalText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
