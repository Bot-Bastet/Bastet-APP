import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { login, register } from '../api/auth';
import * as SecureStore from 'expo-secure-store';
import { useWebSocket } from '../context/WebSocketContext';
import { Mail, Lock, User, ChevronRight, Phone } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

export default function LoginScreen({ navigation }: any) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [step, setStep] = useState(1);
  const { connect } = useWebSocket();



  const handleNextStep = () => {
    setErrorMsg('');
    if (!email || !username || !password) {
      setErrorMsg('Veuillez indiquer email, pseudo et mot de passe.');
      return;
    }
    setStep(2);
  };

  const handleAuth = async () => {
    setErrorMsg('');
    if (!isRegister) {
      if (!email || !password) {
        setErrorMsg('Veuillez indiquer email et mot de passe.');
        return;
      }
    } else {
      if (!firstName || !lastName || !phone) {
        setErrorMsg('Veuillez compléter vos informations.');
        return;
      }
    }
    
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, username, firstName, lastName, phone, password);
        setErrorMsg('');
        Alert.alert('Succès', 'Profil initialisé avec succès ! Vous pouvez maintenant accéder au système.');
        setIsRegister(false);
        setStep(1);
      } else {
        const data = await login(email, password);
        if (data && data.token) {
          const tokenStr = String(data.token);
          const userStr = JSON.stringify(data.user);
          if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync('jwt_token', tokenStr);
            await SecureStore.setItemAsync('user_info', userStr);
          } else {
            localStorage.setItem('jwt_token', tokenStr);
            localStorage.setItem('user_info', userStr);
          }
          connect(); // Initialize WebSocket
          navigation.replace('HomeStack');
        } else {
          throw new Error('Identifiant non reconnu');
        }
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.detail || e.response?.data?.message || e.message || 'Identifiants invalides ou erreur réseau.';
      setErrorMsg(msg);
      if (isRegister) setStep(1); // Retour à l'étape 1 si erreur
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a0c', '#141418', '#000000']} style={styles.container}>
      
      {/* Decorative background elements */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/bastet_logo.png')} 
              style={styles.logoImage} 
              resizeMode="cover" 
            />
          </View>
          <Text style={styles.title}>B A S T E T</Text>
          <Text style={styles.subtitle}>C O R E   I N T E R F A C E</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(300).duration(800)} layout={Layout.springify()} style={styles.formCard}>
          
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity style={[styles.tab, !isRegister && styles.activeTab]} onPress={() => { setIsRegister(false); setStep(1); setErrorMsg(''); }}>
                <Text style={[styles.tabText, !isRegister && styles.activeTabText]}>CONNEXION</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, isRegister && styles.activeTab]} onPress={() => { setIsRegister(true); setStep(1); setErrorMsg(''); }}>
                <Text style={[styles.tabText, isRegister && styles.activeTabText]}>INSCRIPTION</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputsContainer}>
              {/* === ETAPE 1 (OU CONNEXION) === */}
              {(!isRegister || step === 1) && (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
                  <View style={styles.inputWrapper}>
                    <Mail color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Adresse email" 
                      placeholderTextColor={theme.colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {isRegister && (
                    <View style={styles.inputWrapper}>
                      <User color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Identifiant / Pseudo" 
                        placeholderTextColor={theme.colors.textMuted}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  <View style={styles.inputWrapper}>
                    <Lock color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Mot de passe" 
                      placeholderTextColor={theme.colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </Animated.View>
              )}

              {/* === ETAPE 2 (INSCRIPTION INFO PERSO) === */}
              {(isRegister && step === 2) && (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
                  <View style={styles.row}>
                    <View style={[styles.inputWrapper, { flex: 1, marginRight: theme.spacing.s }]}>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Prénom" 
                        placeholderTextColor={theme.colors.textMuted}
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                    <View style={[styles.inputWrapper, { flex: 1, marginLeft: theme.spacing.s }]}>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Nom" 
                        placeholderTextColor={theme.colors.textMuted}
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Phone color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Numéro de téléphone" 
                      placeholderTextColor={theme.colors.textMuted}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <TouchableOpacity onPress={() => setStep(1)}>
                    <Text style={styles.backText}>← Retour aux identifiants</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            {errorMsg ? (
              <Animated.Text entering={FadeInDown} style={styles.errorText}>
                {errorMsg}
              </Animated.Text>
            ) : null}

            <Pressable 
              onPress={isRegister && step === 1 ? handleNextStep : handleAuth} 
              disabled={loading} 
              style={({ pressed }) => [
                styles.button,
                { transform: [{ scale: pressed ? 0.96 : 1 }] }
              ]}
            >
              <LinearGradient 
                colors={['rgba(213, 0, 28, 0.8)', 'rgba(150, 0, 20, 0.9)']} 
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text} />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>
                      {isRegister 
                        ? (step === 1 ? "SUIVANT" : "INITIALISER LE PROFIL") 
                        : "ACCÉDER AU SYSTÈME"}
                    </Text>
                    <ChevronRight color={theme.colors.text} size={20} />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>

        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowTop: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(213, 0, 28, 0.15)',
    filter: 'blur(100px)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -200,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(213, 0, 28, 0.1)',
    filter: 'blur(120px)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.6 }, { translateY: 9 }, { translateX: -4 }],
  },
  title: {
    ...theme.typography.h1,
    fontSize: 42,
    letterSpacing: 12,
    color: theme.colors.text,
    textShadowColor: 'rgba(213, 0, 28, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginLeft: 12, // Offset for letterSpacing
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    letterSpacing: 6,
    marginTop: theme.spacing.m,
  },
  formCard: {
    backgroundColor: 'rgba(20, 20, 25, 0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    maxHeight: '75%',
    overflow: 'hidden',
  },
  scrollContainer: {
    width: '100%',
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  activeTabText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  inputsContainer: {
    marginBottom: theme.spacing.xl,
    minHeight: 140, // Evite que la box saute en changeant d'étape
  },
  stepContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
  },
  inputIcon: {
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingVertical: theme.spacing.l,
    fontSize: theme.typography.body.fontSize,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...theme.typography.body,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 2,
    marginRight: 8,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    fontWeight: 'bold',
  },
  backText: {
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    textDecorationLine: 'underline',
  }
});
