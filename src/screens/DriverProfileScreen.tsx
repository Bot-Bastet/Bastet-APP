import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Network, ScanFace, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInLeft, FadeInDown } from 'react-native-reanimated';
import { setIntranetCredentials, getIntranetCredentials } from '../api/intranet';
import { uploadFaces } from '../api/faces';
import { theme } from '../theme';

export default function DriverProfileScreen({ navigation }: any) {
  // Intranet
  const [mygesUser, setMygesUser] = useState('');
  const [mygesPass, setMygesPass] = useState('');
  const [loadingIntranet, setLoadingIntranet] = useState(false);
  const [mygesRegistered, setMygesRegistered] = useState(false);

  // User Info
  const [userName, setUserName] = useState('Conducteur');
  const [userRole, setUserRole] = useState('Utilisateur');

  useEffect(() => {
    const loadUser = async () => {
      try {
        let userStr = null;
        if (Platform.OS !== 'web') {
          userStr = await SecureStore.getItemAsync('user_info');
        } else {
          userStr = localStorage.getItem('user_info');
        }
        if (userStr) {
          const user = JSON.parse(userStr);
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.pseudo || user.email || 'Conducteur';
          setUserName(fullName);
          if (user.is_admin) setUserRole('Administrateur / Conducteur Principal');
          else setUserRole('Conducteur');
        }
      } catch (e) {
        console.error("Erreur chargement profil", e);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadMyGES = async () => {
      try {
        const data = await getIntranetCredentials();
        if (data && Object.keys(data).length > 0) {
          const firstUser = Object.keys(data)[0];
          const creds = data[firstUser];
          setMygesUser(creds.username || '');
          setMygesRegistered(true);
        }
      } catch (e) {
        // No credentials stored yet — that's fine
      }
    };
    loadMyGES();
  }, []);

  // Faces
  const [loadingFaces, setLoadingFaces] = useState(false);

  const handleSaveIntranet = async () => {
    if (!mygesUser || !mygesPass) {
      Alert.alert('Erreur', 'Veuillez remplir les identifiants.');
      return;
    }
    setLoadingIntranet(true);
    try {
      await setIntranetCredentials(userName, mygesUser, mygesPass);
      Alert.alert('Succès', 'Identifiants MyGES enregistrés et chiffrés sur la Gateway.');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les identifiants.');
    } finally {
      setLoadingIntranet(false);
    }
  };

  const handleUploadFaces = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setLoadingFaces(true);
      try {
        const uris = result.assets.map(a => a.uri);
        await uploadFaces(userName, uris);
        Alert.alert('Succès', `${uris.length} visage(s) synchronisé(s) avec la Gateway.`);
      } catch (e) {
        Alert.alert('Erreur', "Échec de l'envoi des images.");
      } finally {
        setLoadingFaces(false);
      }
    }
  };

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
        <Text style={styles.title}>PROFIL CONDUCTEUR</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.profileCard}>
          <User color={theme.colors.primary} size={64} />
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileRole}>{userRole}</Text>
        </Animated.View>

        <Section title="IDENTIFIANTS INTRANET (MyGES)" icon={Network} delay={100}>
          <View style={styles.formContainer}>
            {mygesRegistered && (
              <View style={styles.registeredBadge}>
                <Text style={styles.registeredText}>ENREGISTRÉ SUR LA GATEWAY</Text>
              </View>
            )}
            <Text style={styles.formNote}>Ces données sont chiffrées par la Gateway.</Text>
            <TextInput
              style={styles.input}
              placeholder="Identifiant MyGES"
              placeholderTextColor={theme.colors.textMuted}
              value={mygesUser}
              onChangeText={setMygesUser}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={theme.colors.textMuted}
              value={mygesPass}
              onChangeText={setMygesPass}
              secureTextEntry
            />
            <TouchableOpacity style={styles.actionBtn} onPress={handleSaveIntranet} disabled={loadingIntranet}>
              {loadingIntranet ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.actionBtnText}>ENREGISTRER</Text>}
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="BASE DE VISAGES (Reconnaissance)" icon={ScanFace} delay={200}>
          <View style={styles.formContainer}>
            <Text style={styles.formNote}>Ajoutez des photos pour que le robot vous reconnaisse.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleUploadFaces} disabled={loadingFaces}>
              {loadingFaces ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.actionBtnText}>AJOUTER DES PHOTOS</Text>}
            </TouchableOpacity>
          </View>
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
  profileCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
  },
  profileName: {
    ...theme.typography.h2,
    marginTop: theme.spacing.m,
  },
  profileRole: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 4,
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
  formContainer: {
    padding: theme.spacing.l,
  },
  formNote: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.m,
  },
  registeredBadge: {
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
    marginBottom: theme.spacing.m,
    alignSelf: 'flex-start',
  },
  registeredText: {
    ...theme.typography.small,
    color: theme.colors.success,
    fontWeight: '700',
    fontSize: 10,
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
