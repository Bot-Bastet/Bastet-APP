import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ChevronLeft, Wifi, WifiOff, Shield, Signal, RefreshCw } from 'lucide-react-native';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import { WifiNetwork } from '../types';

// ═══════════════════════════════════════════════════════════════
// WifiScreen — Section 1 DocsGateway (scan_wifi / wifi_list)
// Scan des réseaux WiFi à proximité du robot
// ═══════════════════════════════════════════════════════════════

const SignalBar = ({ strength }: { strength: number }) => {
  // Normalize signal: if negative (dBm), convert to 0-100
  const normalized = strength < 0 ? Math.min(100, Math.max(0, 100 + strength)) : strength;
  const bars = normalized > 75 ? 4 : normalized > 50 ? 3 : normalized > 25 ? 2 : 1;

  return (
    <View style={styles.signalBars}>
      {[1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[
            styles.signalBar,
            { height: 6 + i * 5 },
            i <= bars ? { backgroundColor: getSignalColor(bars) } : { backgroundColor: 'rgba(255,255,255,0.1)' }
          ]}
        />
      ))}
    </View>
  );
};

const getSignalColor = (bars: number): string => {
  if (bars >= 4) return theme.colors.success;
  if (bars >= 3) return theme.colors.secondary;
  if (bars >= 2) return theme.colors.warning;
  return theme.colors.danger;
};

const WifiNetworkRow = ({ network, index }: { network: WifiNetwork, index: number }) => {
  const normalized = network.signal < 0 ? Math.min(100, Math.max(0, 100 + network.signal)) : network.signal;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)} style={styles.networkRow}>
      <View style={styles.networkLeft}>
        <Wifi color={theme.colors.text} size={22} strokeWidth={1.5} />
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.ssid}>{network.ssid || 'Réseau masqué'}</Text>
          <View style={styles.networkMeta}>
            {network.security && network.security !== 'Open' && (
              <View style={styles.securityBadge}>
                <Shield color={theme.colors.success} size={12} />
                <Text style={styles.securityText}>{network.security}</Text>
              </View>
            )}
            <Text style={styles.signalText}>{normalized}%</Text>
          </View>
        </View>
      </View>
      <SignalBar strength={network.signal} />
    </Animated.View>
  );
};

export default function WifiScreen({ navigation }: any) {
  const { wifiNetworks, wifiScanning, sendWifiScan, connected } = useWebSocket();

  useEffect(() => {
    // Lancer un scan automatique à l'ouverture
    if (connected) {
      sendWifiScan();
    }
  }, [connected]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>W I F I   R O B O T</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Connection Status */}
      <View style={styles.connectionBar}>
        {connected ? (
          <>
            <Wifi color={theme.colors.success} size={16} />
            <Text style={[styles.connectionText, { color: theme.colors.success }]}>Robot connecté</Text>
          </>
        ) : (
          <>
            <WifiOff color={theme.colors.danger} size={16} />
            <Text style={[styles.connectionText, { color: theme.colors.danger }]}>Robot hors ligne</Text>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Scan Button */}
        <TouchableOpacity 
          style={[styles.scanBtn, wifiScanning && styles.scanBtnActive]}
          onPress={sendWifiScan}
          disabled={wifiScanning || !connected}
          activeOpacity={0.7}
        >
          {wifiScanning ? (
            <>
              <ActivityIndicator color={theme.colors.text} size="small" />
              <Text style={styles.scanBtnText}>SCAN EN COURS...</Text>
            </>
          ) : (
            <>
              <RefreshCw color={theme.colors.text} size={20} />
              <Text style={styles.scanBtnText}>SCANNER LES RÉSEAUX</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Networks List */}
        {wifiNetworks.length > 0 ? (
          <View style={styles.networksList}>
            <Text style={styles.sectionTitle}>
              {wifiNetworks.length} RÉSEAU{wifiNetworks.length > 1 ? 'X' : ''} DÉTECTÉ{wifiNetworks.length > 1 ? 'S' : ''}
            </Text>
            {wifiNetworks.map((network, index) => (
              <WifiNetworkRow key={`${network.ssid}-${index}`} network={network} index={index} />
            ))}
          </View>
        ) : !wifiScanning ? (
          <View style={styles.emptyState}>
            <Signal color={theme.colors.textMuted} size={64} strokeWidth={1} />
            <Text style={styles.emptyTitle}>Aucun réseau</Text>
            <Text style={styles.emptySubtitle}>
              Appuyez sur le bouton ci-dessus pour scanner les réseaux WiFi à proximité du robot.
            </Text>
          </View>
        ) : null}

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
    marginBottom: theme.spacing.m,
  },
  backButton: { padding: theme.spacing.xs },
  title: {
    ...theme.typography.h3,
    letterSpacing: 2,
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s,
    marginHorizontal: theme.spacing.m,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.borderRadius.s,
    marginBottom: theme.spacing.m,
  },
  connectionText: {
    ...theme.typography.small,
    fontWeight: '700',
    marginLeft: theme.spacing.s,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
  },
  scanBtnActive: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scanBtnText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 2,
    marginLeft: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.m,
    letterSpacing: 2,
  },
  networksList: {
    marginTop: theme.spacing.s,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.s,
    marginBottom: 3,
  },
  networkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ssid: {
    ...theme.typography.body,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  networkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: theme.spacing.s,
  },
  securityText: {
    ...theme.typography.small,
    color: theme.colors.success,
    fontSize: 10,
    marginLeft: 4,
  },
  signalText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: theme.spacing.m,
  },
  signalBar: {
    width: 5,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    ...theme.typography.h3,
    marginTop: theme.spacing.l,
    color: theme.colors.textMuted,
  },
  emptySubtitle: {
    ...theme.typography.caption,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 22,
  },
});
