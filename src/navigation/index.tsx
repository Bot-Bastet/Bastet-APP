import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home, Map as MapIcon, Cpu, Settings, MessageSquare, Camera } from 'lucide-react-native';
import { theme } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import FleetScreen from '../screens/FleetScreen';
import BotDetailScreen from '../screens/BotDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import MapScreen from '../screens/MapScreen';
import VisionScreen from '../screens/VisionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GlobalPreferencesScreen from '../screens/GlobalPreferencesScreen';
import DriverProfileScreen from '../screens/DriverProfileScreen';
import SystemUpdateScreen from '../screens/SystemUpdateScreen';
import WifiScreen from '../screens/WifiScreen';
import FacesManagementScreen from '../screens/FacesManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBarBackground() {
  if (Platform.OS === 'web') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 10, 0.85)' }]} />;
  }
  return (
    <BlurView 
      tint="dark" 
      intensity={80} 
      style={StyleSheet.absoluteFill} 
    />
  );
}

function HomeTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <CustomTabBarBackground />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} strokeWidth={2} />
        }}
      />
      <Tab.Screen 
        name="AI" 
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} strokeWidth={2} />
        }}
      />
      
      {/* Central Home Button (Action) */}
      <Tab.Screen 
        name="HomeCenter" 
        component={FleetScreen} // Returns to garage
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.centralButtonContainer}>
              <View style={[styles.centralButton, focused && styles.centralButtonActive]}>
                <Home color={focused ? theme.colors.background : theme.colors.text} size={28} strokeWidth={2.5} />
              </View>
            </View>
          )
        }}
      />

      <Tab.Screen 
        name="Vision" 
        component={VisionScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} strokeWidth={2} />
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} strokeWidth={2} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomeStack" component={HomeTabNavigator} />
        <Stack.Screen name="BotDetail" component={BotDetailScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="GlobalPreferences" component={GlobalPreferencesScreen} />
        <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
        <Stack.Screen name="SystemUpdate" component={SystemUpdateScreen} />
        <Stack.Screen name="WifiScan" component={WifiScreen} />
        <Stack.Screen name="FacesManagement" component={FacesManagementScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    height: 90, // Taller to accommodate central button
  },
  centralButtonContainer: {
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centralButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  centralButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  }
});
