import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Power, Settings, Shield, User, Bell, ChevronRight, HardDrive, Wifi, ScanFace, Download } from 'lucide-react-native';
import { theme } from '../theme';
import { clearAuthSession } from '../api/auth';
import { useWebSocket } from '../context/WebSocketContext';

const SettingRow = ({ icon: Icon, title, subtitle, hasSwitch, value, onValueChange, onPress, iconColor }: any) => (
  <TouchableOpacity 
    style={styles.settingRow} 
    activeOpacity={0.8}
    onPress={onPress}
    disabled={hasSwitch}
  >
    <View style={styles.settingLeft}>
      <Icon color={iconColor || theme.colors.text} size={24} strokeWidth={1.5} />
      <View style={{ marginLeft: 16 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSub}>{subtitle}</Text>}
      </View>
    </View>
    {hasSwitch ? (
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.text}
      />
    ) : (
      <ChevronRight color={theme.colors.textMuted} size={20} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }: any) {
  const [bioAuth, setBioAuth] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const { disconnect } = useWebSocket();

  const handleLogout = async () => {
    disconnect();
    await clearAuthSession();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>S Y S T È M E</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>C O M P T E</Text>
          <SettingRow 
            icon={User} 
            title="Profil Conducteur" 
            subtitle="Paul - Admin" 
            onPress={() => navigation.navigate('DriverProfile')}
          />
          <SettingRow 
            icon={Shield} 
            title="Sécurité Biométrique" 
            subtitle="FaceID / TouchID pour l'app"
            hasSwitch
            value={bioAuth}
            onValueChange={setBioAuth}
          />
          <SettingRow 
            icon={ScanFace} 
            title="Gestion des Visages" 
            subtitle="Consultation et suppression des visages enregistrés"
            iconColor={theme.colors.secondary}
            onPress={() => navigation.navigate('FacesManagement')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>R O B O T</Text>
          <SettingRow 
            icon={Wifi} 
            title="WiFi Robot" 
            subtitle="Scanner les réseaux à proximité du robot"
            iconColor={theme.colors.success}
            onPress={() => navigation.navigate('WifiScan')}
          />
          <SettingRow 
            icon={Download} 
            title="Mises à jour système" 
            subtitle="Gateway, Robot, Arduino"
            iconColor={theme.colors.primary}
            onPress={() => navigation.navigate('SystemUpdate')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>F L O T T E</Text>
          <SettingRow 
            icon={Settings} 
            title="Préférences globales" 
            subtitle="Langue, Unités, Thème" 
            onPress={() => navigation.navigate('GlobalPreferences')}
          />
          <SettingRow 
            icon={Bell} 
            title="Notifications d'Alerte" 
            subtitle="Intrusions, batterie faible"
            hasSwitch
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingRow 
            icon={HardDrive} 
            title="Mises à jour automatiques" 
            subtitle="Firmware v5.2.0 (À jour)"
            hasSwitch
            value={autoUpdate}
            onValueChange={setAutoUpdate}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
          <Power color={theme.colors.danger} size={24} />
          <Text style={styles.logoutText}>D É C O N N E X I O N</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.l,
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
  },
  scrollContent: {
    paddingBottom: 120, // space for tab bar
    paddingHorizontal: theme.spacing.m,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.m,
    marginLeft: theme.spacing.s,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.s,
    marginBottom: 4,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  settingSub: {
    ...theme.typography.caption,
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(213, 0, 28, 0.1)', // Subtle danger tint
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    marginTop: theme.spacing.l,
  },
  logoutText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 2,
  }
});
