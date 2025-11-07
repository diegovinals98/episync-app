/**
 * Configuración de entorno para la aplicación
 * 
 * Este archivo centraliza el acceso a las variables de entorno y proporciona
 * valores por defecto para desarrollo local.
 */

// Importar variables de entorno desde @env (react-native-dotenv)
import { 
  API_URL as ENV_API_URL, 
  SOCKET_URL as ENV_SOCKET_URL,
  API_URL_PROD,
  GOOGLE_CLIENT_ID as ENV_GOOGLE_CLIENT_ID,
  APPLE_CLIENT_ID as ENV_APPLE_CLIENT_ID,
  APP_NAME as ENV_APP_NAME,
  APP_VERSION as ENV_APP_VERSION,
  ENABLE_ANALYTICS as ENV_ENABLE_ANALYTICS,
  ENABLE_CRASH_REPORTING as ENV_ENABLE_CRASH_REPORTING,
} from '@env';

// Valores por defecto (para desarrollo) - solo como último recurso
const defaultConfig = {
  // Entorno
  NODE_ENV: 'development',
  
  // OAuth
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
  APPLE_CLIENT_ID: 'AAJC7S5F5Q',
  
  // App
  APP_NAME: 'EPISYNC',
  APP_VERSION: '1.0.1',
  
  // Características
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: false,
};

// Intentar usar las variables de entorno si están disponibles
// o usar los valores por defecto
// Nota: react-native-dotenv carga las variables desde .env
const getApiUrl = () => {
  const url = ENV_API_URL || 'http://localhost:4000';
  if (!ENV_API_URL) {
    console.warn('⚠️ API_URL no está definida en .env, usando localhost:4000 como fallback');
  }
  console.log('🔍 API_URL cargada:', url);
  return url;
};

const getSocketUrl = () => {
  const url = ENV_SOCKET_URL || ENV_API_URL || 'http://localhost:4000';
  if (!ENV_SOCKET_URL && !ENV_API_URL) {
    console.warn('⚠️ SOCKET_URL no está definida en .env, usando API_URL o localhost:4000 como fallback');
  }
  console.log('🔍 SOCKET_URL cargada:', url);
  return url;
};

export const ENV = {
  // API - DEBE venir del .env, sin fallback hardcodeado
  API_URL: getApiUrl(),
  
  // Entorno - Usar una función para determinar el entorno
  get IS_DEV() {
    return process.env.NODE_ENV !== 'production';
  },
  get IS_PROD() {
    return process.env.NODE_ENV === 'production';
  },
  
  // OAuth
  GOOGLE_CLIENT_ID: ENV_GOOGLE_CLIENT_ID || defaultConfig.GOOGLE_CLIENT_ID,
  APPLE_CLIENT_ID: ENV_APPLE_CLIENT_ID || defaultConfig.APPLE_CLIENT_ID,
  
  // App
  APP_NAME: ENV_APP_NAME || defaultConfig.APP_NAME,
  APP_VERSION: ENV_APP_VERSION || defaultConfig.APP_VERSION,
  
  // Características
  ENABLE_ANALYTICS: ENV_ENABLE_ANALYTICS === 'true' || defaultConfig.ENABLE_ANALYTICS,
  ENABLE_CRASH_REPORTING: ENV_ENABLE_CRASH_REPORTING === 'true' || defaultConfig.ENABLE_CRASH_REPORTING,
  
  // Socket - DEBE venir del .env
  SOCKET_URL: getSocketUrl(),
};

export default ENV; 