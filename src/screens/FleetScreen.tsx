import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { QuadrupedBot } from '../data/mockData';
import { useBots } from '../context/BotContext';
import SpotMicro3DViewer from '../components/SpotMicro3DViewer';

const { width } = Dimensions.get('window');

export default function FleetScreen({ navigation }: any) {
  const { bots, addBot } = useBots();
  const [visibleId, setVisibleId] = useState<string | null>(bots[0]?.id ?? null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find(item => item.isViewable);
    if (first?.item) {
      setVisibleId((first.item as QuadrupedBot).id);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  const renderItem = ({ item }: { item: QuadrupedBot }) => {
    const isVisible = item.id === visibleId;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => navigation.navigate('BotDetail', { botId: item.id })}
      >
        <LinearGradient
          colors={['rgba(20,20,20,1)', 'rgba(0,0,0,1)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.glowEffect, { backgroundColor: item.colorTheme }]} />

        {isVisible && (
          <SpotMicro3DViewer
            mode="mini"
            transparent
            pointerEvents="none"
            style={styles.robotOverlay}
          />
        )}

        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: item.colorTheme }]} />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.batteryText}>{item.battery}%</Text>
        </View>

        <View style={styles.cardSpacer} />

        <View style={styles.cardFooter}>
          <Text style={styles.botId}>{item.id}</Text>
          <Text style={styles.botName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>G A R A G E</Text>
        <TouchableOpacity style={styles.addButton} onPress={addBot}>
          <Plus color={theme.colors.background} size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={bots}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToAlignment="center"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
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
    paddingTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    width: width,
    height: 550,
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: '18%',
    left: '15%',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    opacity: 0.18,
    zIndex: 1,
  },
  robotOverlay: {
    position: 'absolute',
    top: '14%',
    left: 0,
    right: 0,
    height: width * 0.72,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    zIndex: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { ...theme.typography.small, color: theme.colors.text },
  batteryText: { ...theme.typography.body, fontWeight: '700' },
  cardSpacer: {
    flex: 1,
  },
  cardFooter: {
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 3,
  },
  botId: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  botName: {
    ...theme.typography.h1,
    fontSize: 40,
  },
});
