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

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR — Log TOUT ce qui part
// ═══════════════════════════════════════════════════════════════
apiClient.interceptors.request.use(
  async (config) => {
    const startTime = Date.now();
    (config as any)._startTime = startTime;

    // Dynamically set BaseURL
    if (!config.baseURL) {
      config.baseURL = await getBaseUrl();
    }
    
    // Attach API Token
    const token = process.env.EXPO_PUBLIC_DEV_TOKEN;
    if (token) {
      config.headers['X-API-Token'] = token;
    }

    const fullUrl = `${config.baseURL}${config.url}`;
    const params = config.params ? JSON.stringify(config.params) : 'none';

    console.log(`\n╔══════════════════════════════════════════════╗`);
    console.log(`║  📤 API REQUEST — ${config.method?.toUpperCase()} `);
    console.log(`╠══════════════════════════════════════════════╣`);
    console.log(`║ 📱 Platform: ${Platform.OS.toUpperCase()}`);
    console.log(`║ 🌐 URL: ${fullUrl}`);
    console.log(`║ 📋 Method: ${config.method?.toUpperCase()}`);
    console.log(`║ 🔑 Token: ${token ? token.substring(0, 12) + '...' : 'NONE'}`);
    console.log(`║ 📦 Params: ${params}`);
    console.log(`║ 📝 Headers:`, JSON.stringify({
      'Content-Type': config.headers['Content-Type'],
      'X-API-Token': config.headers['X-API-Token'] ? '***SET***' : 'MISSING',
    }));
    if (config.data) {
      const dataStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
      console.log(`║ 📄 Body: ${dataStr.substring(0, 500)}${dataStr.length > 500 ? '...(truncated)' : ''}`);
    } else {
      console.log(`║ 📄 Body: (empty)`);
    }
    console.log(`╚══════════════════════════════════════════════╝\n`);

    return config;
  },
  (error) => {
    console.error(`🚨 [REQUEST SETUP ERROR]`, error.message);
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — Log TOUT ce qui revient
// ═══════════════════════════════════════════════════════════════
apiClient.interceptors.response.use(
  (response) => {
    const duration = (response.config as any)._startTime 
      ? `${Date.now() - (response.config as any)._startTime}ms` 
      : '?ms';
    
    const dataStr = JSON.stringify(response.data);
    const truncated = dataStr.length > 800 ? dataStr.substring(0, 800) + `...(${dataStr.length} chars total)` : dataStr;

    console.log(`\n╔══════════════════════════════════════════════╗`);
    console.log(`║  ✅ API RESPONSE — ${response.status} ${response.statusText}`);
    console.log(`╠══════════════════════════════════════════════╣`);
    console.log(`║ 🌐 URL: ${response.config.url}`);
    console.log(`║ ⏱️  Durée: ${duration}`);
    console.log(`║ 📊 Status: ${response.status}`);
    console.log(`║ 📦 Data Type: ${typeof response.data} ${Array.isArray(response.data) ? `(Array[${response.data.length}])` : ''}`);
    console.log(`║ 📄 Response Body:`, truncated);
    console.log(`╚══════════════════════════════════════════════╝\n`);

    return response;
  },
  (error) => {
    const duration = error.config?._startTime 
      ? `${Date.now() - error.config._startTime}ms` 
      : '?ms';

    console.error(`\n╔══════════════════════════════════════════════╗`);
    console.error(`║  ❌ API ERROR`);
    console.error(`╠══════════════════════════════════════════════╣`);
    console.error(`║ 🌐 URL: ${error.config?.baseURL}${error.config?.url}`);
    console.error(`║ 📋 Method: ${error.config?.method?.toUpperCase()}`);
    console.error(`║ ⏱️  Durée: ${duration}`);
    console.error(`║ 📊 Status: ${error.response?.status || 'NO RESPONSE'}`);
    console.error(`║ 💬 Message: ${error.message}`);
    console.error(`║ 📄 Error Data:`, JSON.stringify(error.response?.data || 'N/A'));
    console.error(`║ 🔗 Error Code: ${error.code || 'NONE'}`);
    if (error.config?.data) {
      console.error(`║ 📝 Sent Body:`, typeof error.config.data === 'string' ? error.config.data : JSON.stringify(error.config.data));
    }
    console.error(`╚══════════════════════════════════════════════╝\n`);
    return Promise.reject(error);
  }
);

export default apiClient;
