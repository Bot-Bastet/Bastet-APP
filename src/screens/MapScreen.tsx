import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../theme';
import { Target, ChevronRight, Navigation } from 'lucide-react-native';
import { useBots } from '../context/BotContext';
import { useWebSocket } from '../context/WebSocketContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function MapScreen({ navigation }: any) {
  const { bot } = useBots();
  const { telemetry, connected, sendNavGoal } = useWebSocket();
  const [currentCoord, setCurrentCoord] = useState({
    latitude: bot.latitude,
    longitude: bot.longitude,
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: bot.latitude,
          longitude: bot.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        userInterfaceStyle="dark"
        onPress={(e) => {
          if (!connected || !telemetry?.pose) return;
          const { latitude, longitude } = e.nativeEvent.coordinate;
          const dx = (latitude - bot.latitude) * 100;
          const dy = (longitude - bot.longitude) * 100;
          sendNavGoal(telemetry.pose.x + dx, telemetry.pose.y + dy);
        }}
      >
        <Marker
          coordinate={{ latitude: bot.latitude, longitude: bot.longitude }}
        >
          <View style={[styles.markerContainer, { backgroundColor: theme.colors.primary + '40', borderColor: theme.colors.primary }]}>
            <Target color={theme.colors.primary} size={24} />
          </View>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.overlaySafeArea}>
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <TouchableOpacity
            style={styles.overlayCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('HomeStack', { screen: 'HomeCenter' })}
          >
            <View style={styles.overlayHeader}>
              <Text style={styles.droneName}>{bot.name}</Text>
              <ChevronRight color={theme.colors.textMuted} size={20} />
            </View>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>VITESSE</Text>
                <Text style={styles.statValue}>{bot.speed} km/h</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>BATTERIE</Text>
                <Text style={styles.statValue}>{bot.battery}%</Text>
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
  map: {
    ...(StyleSheet.absoluteFill as any),
  },
  markerContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
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
