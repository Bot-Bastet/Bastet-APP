import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Fallback IP to .env if not set by user
export const DEFAULT_GATEWAY_IP = process.env.EXPO_PUBLIC_GATEWAY_IP || '192.168.1.108';

export const getBaseUrl = async () => {
  const isSecure = process.env.EXPO_PUBLIC_USE_SSL === 'true';
  const protocol = isSecure ? 'https' : 'http';
  
  if (Platform.OS === 'web') return `${protocol}://${DEFAULT_GATEWAY_IP}:44888`;
  const savedIp = await SecureStore.getItemAsync('gateway_ip');
  return `${protocol}://${savedIp || DEFAULT_GATEWAY_IP}:44888`;
};

const apiClient = axios.create({
  // baseURL is set dynamically in interceptor if needed, or we can resolve it before calls.
  // For simplicity we will attach the baseURL in the interceptor
});

apiClient.interceptors.request.use(
  async (config) => {
    // Dynamically set BaseURL
    if (!config.baseURL) {
      config.baseURL = await getBaseUrl();
    }
    
    // Attach API Token
    const token = process.env.EXPO_PUBLIC_DEV_TOKEN;
    if (token) {
      config.headers['X-API-Token'] = token;
    }

    console.log(`\n--- [📱 PLATFORM: ${Platform.OS.toUpperCase()}] API REQUEST ---`);
    console.log(`URL: ${config.baseURL}${config.url}`);
    console.log(`METHOD: ${config.method?.toUpperCase()}`);
    console.log(`PAYLOAD:`, JSON.stringify(config.data));
    console.log(`----------------------------------\n`);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API SUCCESS] ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`\n--- [❌ API ERROR] ---`);
    console.error(`URL FAUTIVE: ${error.config?.baseURL}${error.config?.url}`);
    console.error(`STATUS: ${error.response?.status}`);
    console.error(`MESSAGE: ${error.message}`);
    console.error(`DATA:`, error.response?.data);
    console.error(`----------------------\n`);
    return Promise.reject(error);
  }
);

export default apiClient;
