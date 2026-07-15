import apiClient from './client';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const DEV_USER = {
  email: 'dev@bastet.local',
  pseudo: 'DevUser',
  first_name: 'Dev',
  last_name: 'Mode',
};

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_info';

export async function persistAuthSession(token: string, user: object) {
  const tokenStr = String(token);
  const userStr = JSON.stringify(user);
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(TOKEN_KEY, tokenStr);
    await SecureStore.setItemAsync(USER_KEY, userStr);
  } else {
    localStorage.setItem(TOKEN_KEY, tokenStr);
    localStorage.setItem(USER_KEY, userStr);
  }
}

export async function clearAuthSession() {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export async function devBypassLogin() {
  const token = process.env.EXPO_PUBLIC_DEV_TOKEN || 'dev-bypass';
  await persistAuthSession(token, DEV_USER);
  return { token, user: DEV_USER };
}

function extractLoginToken(data: any, user: any): string {
  const token = data.token || data.api_token;
  if (token) return String(token);
  const fallback = process.env.EXPO_PUBLIC_DEV_TOKEN || user?.pseudo || user?.email;
  if (!data.token && !data.api_token) {
    console.warn('[auth] Login response missing token/api_token, using fallback');
  }
  return String(fallback);
}

export const login = async (email: string, password?: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const data = response.data;
  const user = data.user;
  const token = extractLoginToken(data, user);
  return { token, user };
};

export const register = async (
  email: string,
  pseudo: string,
  firstName: string,
  lastName: string,
  phone: string,
  password?: string
) => {
  const payload = {
    email,
    pseudo,
    last_name: lastName,
    first_name: firstName,
    phone,
    password,
    is_admin: false,
  };
  try {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  } catch (e: any) {
    if (e.response?.status === 404) {
      const response = await apiClient.post('/accounts', payload);
      return response.data;
    }
    throw e;
  }
};

export const updatePreferences = async (fullName: string, preferences: any) => {
  const response = await apiClient.post('/preferences', { full_name: fullName, preferences });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const updateUserProfile = async (profileData: any) => {
  const response = await apiClient.put('/users/me', profileData);
  return response.data;
};

export const deleteAccount = async (fullName: string) => {
  const response = await apiClient.delete(`/accounts/${encodeURIComponent(fullName)}`);
  return response.data;
};
