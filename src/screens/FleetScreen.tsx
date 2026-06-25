import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Cpu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { QuadrupedBot } from '../data/mockData';
import { useBots } from '../context/BotContext';

const { width } = Dimensions.get('window');

export default function FleetScreen({ navigation }: any) {
  const { bots, addBot } = useBots();

  const renderItem = ({ item }: { item: QuadrupedBot }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('BotDetail', { botId: item.id })}
    >
      <LinearGradient
        colors={['rgba(20,20,20,1)', 'rgba(0,0,0,1)']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Background glow representing the bot's theme */}
      <View style={[styles.glowEffect, { backgroundColor: item.colorTheme }]} />
      
      <View style={styles.cardHeader}>
         <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: item.colorTheme }]} />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
         </View>
         <Text style={styles.batteryText}>{item.battery}%</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Massive 3D placeholder */}
        <View style={styles.mockRenderContainer}>
           <Text style={[styles.renderText, { color: item.colorTheme }]}>[ 3D RENDER ]</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.botId}>{item.id}</Text>
        <Text style={styles.botName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

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
        pagingEnabled // creates a snap scrolling effect like a showroom
        snapToAlignment="center"
        decelerationRate="fast"
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
    paddingBottom: 120, // space for tab bar
  },
  card: {
    width: width,
    height: 550, // Very tall card for edge-to-edge feel
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    opacity: 0.08, // Very subtle
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
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
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockRenderContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderText: {
    ...theme.typography.h2,
    opacity: 0.3,
    letterSpacing: 4,
  },
  cardFooter: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  botId: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  botName: {
    ...theme.typography.h1,
    fontSize: 40,
  }
});
