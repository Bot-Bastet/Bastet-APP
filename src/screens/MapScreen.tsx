import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { theme } from '../theme';
import { Target, ChevronRight } from 'lucide-react-native';
import { useBots } from '../context/BotContext';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function MapScreen({ navigation }: any) {
  const { bots } = useBots();
  const [activeBot, setActiveBot] = useState(bots[0]);
  const [currentCoord, setCurrentCoord] = useState({
    latitude: activeBot.latitude,
    longitude: activeBot.longitude,
  });

  // Note: we remove the static simulation effect because the context handles bot movement globally!
  
  // When bots array updates (movement), ensure activeBot references the updated object
  useEffect(() => {
    const updatedActiveBot = bots.find(b => b.id === activeBot.id);
    if (updatedActiveBot) {
      setActiveBot(updatedActiveBot);
    }
  }, [bots]);

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: activeBot.latitude,
          longitude: activeBot.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        userInterfaceStyle="dark"
      >
        {bots.map((bot) => (
          <Marker 
            key={bot.id} 
            coordinate={{ latitude: bot.latitude, longitude: bot.longitude }}
            onPress={() => setActiveBot(bot)}
          >
            <View style={[styles.markerContainer, activeBot.id === bot.id && { backgroundColor: theme.colors.primary + '40', borderColor: theme.colors.primary }]}>
              <Target color={activeBot.id === bot.id ? theme.colors.primary : bot.colorTheme} size={24} />
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.overlaySafeArea}>
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <TouchableOpacity 
            style={styles.overlayCard}
            activeOpacity={0.9}
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
  }
});
