import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Globe, Ruler, Clock, Palette, Check } from 'lucide-react-native';
import { theme } from '../theme';
import * as SecureStore from 'expo-secure-store';
import { updatePreferences } from '../api/auth';
import Animated, { FadeInLeft } from 'react-native-reanimated';

export default function GlobalPreferencesScreen({ navigation }: any) {
  const [userName, setUserName] = useState('');
  const [language, setLanguage] = useState('fr');
  const [unit, setUnit] = useState('metric');
  const [timezone, setTimezone] = useState('auto');
  const [colorTheme, setColorTheme] = useState('oled');

  useEffect(() => {
    const loadUser = async () => {
      try {
        let userStr = Platform.OS !== 'web' ? await SecureStore.getItemAsync('user_info') : localStorage.getItem('user_info');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(`${user.first_name} ${user.last_name}`);
          if (user.preferences) {
            if (user.preferences.language) setLanguage(user.preferences.language);
            if (user.preferences.unit) setUnit(user.preferences.unit);
            if (user.preferences.timezone) setTimezone(user.preferences.timezone);
            if (user.preferences.color_theme) setColorTheme(user.preferences.color_theme);
          }
        }
      } catch (e) {
        console.error("Erreur chargement préférences", e);
      }
    };
    loadUser();
  }, []);

  const savePref = async (key: string, value: string) => {
    if (!userName) return;
    try {
      await updatePreferences(userName, { [key]: value });
      
      let userStr = Platform.OS !== 'web' ? await SecureStore.getItemAsync('user_info') : localStorage.getItem('user_info');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (!user.preferences) user.preferences = {};
        user.preferences[key] = value;
        const newStr = JSON.stringify(user);
        if (Platform.OS !== 'web') await SecureStore.setItemAsync('user_info', newStr);
        else localStorage.setItem('user_info', newStr);
      }
    } catch (e) {
      console.error("Erreur de sauvegarde des prefs", e);
    }
  };

  const handleLanguage = (val: string) => { setLanguage(val); savePref('language', val); };
  const handleUnit = (val: string) => { setUnit(val); savePref('unit', val); };
  const handleTimezone = (val: string) => { setTimezone(val); savePref('timezone', val); };
  const handleColorTheme = (val: string) => { setColorTheme(val); savePref('color_theme', val); };



  const OptionRow = ({ label, isSelected, onPress }: any) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.optionLabel, isSelected && { color: theme.colors.primary, fontWeight: '700' }]}>{label}</Text>
      {isSelected && <Check color={theme.colors.primary} size={20} />}
    </TouchableOpacity>
  );

  const Section = ({ title, icon: Icon, children, delay = 0 }: any) => (
    <Animated.View entering={FadeInLeft.delay(delay).duration(500).springify()} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon color={theme.colors.textMuted} size={20} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>PRÉFÉRENCES GLOBALES</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Section title="LANGUE DU SYSTÈME" icon={Globe} delay={100}>
          <OptionRow label="Français (France)" isSelected={language === 'fr'} onPress={() => handleLanguage('fr')} />
          <OptionRow label="English (US)" isSelected={language === 'en'} onPress={() => handleLanguage('en')} />
          <OptionRow label="Deutsch" isSelected={language === 'de'} onPress={() => handleLanguage('de')} />
        </Section>

        <Section title="UNITÉS DE MESURE" icon={Ruler} delay={200}>
          <OptionRow label="Métrique (km/h, °C)" isSelected={unit === 'metric'} onPress={() => handleUnit('metric')} />
          <OptionRow label="Impérial (mph, °F)" isSelected={unit === 'imperial'} onPress={() => handleUnit('imperial')} />
        </Section>

        <Section title="FUSEAU HORAIRE" icon={Clock} delay={300}>
          <OptionRow label="Automatique (Heure locale)" isSelected={timezone === 'auto'} onPress={() => handleTimezone('auto')} />
          <OptionRow label="UTC (Temps universel coordonné)" isSelected={timezone === 'utc'} onPress={() => handleTimezone('utc')} />
        </Section>

        <Section title="THÈME GRAPHIQUE" icon={Palette} delay={400}>
          <OptionRow label="Noir OLED (Contraste Maximum)" isSelected={colorTheme === 'oled'} onPress={() => handleColorTheme('oled')} />
          <OptionRow label="Gris Anthracite (Standard)" isSelected={colorTheme === 'standard'} onPress={() => handleColorTheme('standard')} />
        </Section>

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
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h3,
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.s,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionLabel: {
    ...theme.typography.body,
  },
  formContainer: {
    padding: theme.spacing.l,
  },
  formNote: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.m,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    marginBottom: theme.spacing.m,
    color: theme.colors.text,
  },
  actionBtn: {
    backgroundColor: theme.colors.text,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  actionBtnText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.background,
  }
});
