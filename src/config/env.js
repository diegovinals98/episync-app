/**
 * Configuración de entorno para la aplicación
 * 
 * Este archivo centraliza el acceso a las variables de entorno y proporciona
 * valores por defecto para desarrollo local.
 */

// Valores por defecto (para desarrollo)
const defaultConfig = {
  // API
  API_URL: 'http://localhost:4000',
  
  // Entorno
  NODE_ENV: 'development',
  
  // OAuth
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
  APPLE_CLIENT_ID: 'YOUR_APPLE_CLIENT_ID',
  
  // App
  APP_NAME: 'EPISYNC',
  APP_VERSION: '1.0.0',
  
  // Características
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: false,
};

// Intentar usar las variables de entorno si están disponibles
// o usar los valores por defecto
export const ENV = {
  // API
  API_URL: process.env.API_URL || defaultConfig.API_URL,
  
  // Entorno - Usar una función para determinar el entorno
  get IS_DEV() {
    return process.env.NODE_ENV !== 'production';
  },
  get IS_PROD() {
    return process.env.NODE_ENV === 'production';
  },
  
  // OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || defaultConfig.GOOGLE_CLIENT_ID,
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || defaultConfig.APPLE_CLIENT_ID,
  
  // App
  APP_NAME: process.env.APP_NAME || defaultConfig.APP_NAME,
  APP_VERSION: process.env.APP_VERSION || defaultConfig.APP_VERSION,
  
  // Características
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true' || defaultConfig.ENABLE_ANALYTICS,
  ENABLE_CRASH_REPORTING: process.env.ENABLE_CRASH_REPORTING === 'true' || defaultConfig.ENABLE_CRASH_REPORTING,
  
  // Socket
  SOCKET_URL: 'http://localhost:4000',
};

export default ENV; 