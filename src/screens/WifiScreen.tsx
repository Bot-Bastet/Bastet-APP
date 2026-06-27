import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { ChevronLeft, Wifi, WifiOff, Shield, Signal, RefreshCw, Trash2, Check } from 'lucide-react-native';
import { theme } from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import { WifiNetwork } from '../types';

// ═══════════════════════════════════════════════════════════════
// WifiScreen — Section 1 DocsGateway (scan_wifi / wifi_list)
// Scan et gestion des connexions WiFi à proximité du robot
// ═══════════════════════════════════════════════════════════════

const SignalBar = ({ strength }: { strength: number }) => {
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
  if (bars >= 3) return '#38bdf8'; // Sky light blue
  if (bars >= 2) return theme.colors.warning;
  return theme.colors.danger;
};

const WifiNetworkRow = ({ 
  network, 
  index, 
  isKnown, 
  onPress 
}: { 
  network: WifiNetwork, 
  index: number, 
  isKnown: boolean, 
  onPress: () => void 
}) => {
  const normalized = network.signal < 0 ? Math.min(100, Math.max(0, 100 + network.signal)) : network.signal;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.networkRow}>
        <View style={styles.networkLeft}>
          <Wifi color={isKnown ? '#38bdf8' : theme.colors.text} size={22} strokeWidth={isKnown ? 2 : 1.5} />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={[styles.ssid, isKnown && styles.ssidKnown]}>
              {network.ssid || 'Réseau masqué'}
            </Text>
            <View style={styles.networkMeta}>
              {isKnown ? (
                <View style={[styles.securityBadge, styles.knownBadge]}>
                  <Check color="#38bdf8" size={10} strokeWidth={3} />
                  <Text style={[styles.securityText, { color: '#38bdf8' }]}>Enregistré</Text>
                </View>
              ) : network.security && network.security !== 'Open' && (
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
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function WifiScreen({ navigation }: any) {
  const { 
    wifiNetworks, 
    wifiScanning, 
    sendWifiScan, 
    connected,
    knownSsids,
    wifiConnecting,
    wifiConnectionResult,
    wifiForgetting,
    connectWifi,
    forgetWifi,
    clearWifiConnectionResult
  } = useWebSocket();

  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetwork | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (connected) {
      sendWifiScan();
    }
  }, [connected]);

  // Surveillance des résultats de connexion
  useEffect(() => {
    if (wifiConnectionResult) {
      if (wifiConnectionResult.status === 'success') {
        Alert.alert(
          "Connexion réussie", 
          wifiConnectionResult.message || "Le robot s'est connecté au réseau avec succès."
        );
      } else {
        Alert.alert(
          "Échec de connexion", 
          wifiConnectionResult.message || "Une erreur est survenue lors de la connexion."
        );
      }
      clearWifiConnectionResult();
      sendWifiScan(); // Rafraîchir les réseaux
    }
  }, [wifiConnectionResult]);

  const handleNetworkPress = (network: WifiNetwork) => {
    const isKnown = knownSsids.includes(network.ssid);
    if (isKnown) {
      Alert.alert(
        network.ssid,
        "Ce réseau est enregistré sur le robot. Que voulez-vous faire ?",
        [
          { 
            text: "Se connecter", 
            onPress: () => connectWifi(network.ssid) 
          },
          { 
            text: "Oublier le réseau", 
            style: "destructive", 
            onPress: () => {
              Alert.alert(
                "Oublier",
                `Voulez-vous supprimer les informations de '${network.ssid}' ?`,
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Oublier", style: "destructive", onPress: () => forgetWifi(network.ssid) }
                ]
              );
            } 
          },
          { text: "Annuler", style: "cancel" }
        ]
      );
    } else {
      if (network.security === 'Open' || !network.security) {
        connectWifi(network.ssid);
      } else {
        setSelectedNetwork(network);
        setPassword('');
      }
    }
  };

  const handleConnectSubmit = () => {
    if (selectedNetwork) {
      connectWifi(selectedNetwork.ssid, password);
      setSelectedNetwork(null);
      setPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
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
            style={[styles.scanBtn, (wifiScanning || wifiConnecting || wifiForgetting) && styles.scanBtnActive]}
            onPress={sendWifiScan}
            disabled={wifiScanning || wifiConnecting || wifiForgetting || !connected}
            activeOpacity={0.7}
          >
            {wifiScanning ? (
              <>
                <ActivityIndicator color={theme.colors.text} size="small" style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>RECHERCHE EN COURS...</Text>
              </>
            ) : wifiConnecting ? (
              <>
                <ActivityIndicator color={theme.colors.text} size="small" style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>CONNEXION EN COURS...</Text>
              </>
            ) : wifiForgetting ? (
              <>
                <ActivityIndicator color={theme.colors.text} size="small" style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>SUPPRESSION...</Text>
              </>
            ) : (
              <>
                <RefreshCw color={theme.colors.text} size={18} style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>ACTUALISER LA RECHERCHE</Text>
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
                <WifiNetworkRow 
                  key={`${network.ssid}-${index}`} 
                  network={network} 
                  index={index}
                  isKnown={knownSsids.includes(network.ssid)}
                  onPress={() => handleNetworkPress(network)}
                />
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

        {/* Action modal for password entry */}
        {selectedNetwork && (
          <Animated.View entering={FadeInUp} exiting={FadeOut} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Connexion à {selectedNetwork.ssid}</Text>
              <Text style={styles.modalSubtitle}>Saisissez le mot de passe de sécurité du réseau</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel]} 
                  onPress={() => setSelectedNetwork(null)}
                >
                  <Text style={styles.modalBtnTextCancel}>ANNULER</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnSubmit]} 
                  onPress={handleConnectSubmit}
                >
                  <Text style={styles.modalBtnTextSubmit}>CONNEXION</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Global Loading overlay during connection */}
        {wifiConnecting && (
          <Animated.View entering={FadeInUp} exiting={FadeOut} style={styles.globalLoaderOverlay}>
            <View style={styles.loaderContent}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.loaderText}>Le robot se connecte à ce réseau...</Text>
              <Text style={styles.loaderSubtext}>Veuillez patienter (max 12s)</Text>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
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
    letterSpacing: 1.5,
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
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
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
  ssidKnown: {
    color: '#38bdf8',
    fontWeight: '700',
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
  knownBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  securityText: {
    ...theme.typography.small,
    color: theme.colors.success,
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '600',
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
    zIndex: 999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  modalSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.l,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.s,
    padding: theme.spacing.m,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.s,
    marginLeft: theme.spacing.m,
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
  },
  modalBtnSubmit: {
    backgroundColor: '#38bdf8',
  },
  modalBtnTextCancel: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  modalBtnTextSubmit: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  globalLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loaderText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: theme.spacing.xl,
  },
  loaderSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
});
