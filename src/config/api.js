/**
 * Configuración de la API para diferentes entornos
 */

// Detectar el entorno actual
const isProduction = process.env.NODE_ENV === 'production';

// URLs de la API
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:4000',
    timeout: 10000, // 10 segundos
  },
  production: {
    baseUrl: 'https://api.episync.com', // URL de producción (por ahora es ficticia)
    timeout: 15000, // 15 segundos
  }
};

// Exportar la configuración según el entorno
export const API = isProduction ? API_CONFIG.production : API_CONFIG.development;

// Endpoints específicos
export const ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    google: '/api/v1/auth/google',
    apple: '/api/v1/auth/apple',
    validate: '/api/v1/auth/validate',
  },
  users: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
  },
  groups: {
    list: '/groups',
    create: '/groups',
    join: '/groups/join',
    details: (groupId) => `/groups/${groupId}`,
  },
  series: {
    popular: '/series/popular',
    search: '/series/search',
    details: (seriesId) => `/series/${seriesId}`,
  },
  episodes: {
    markWatched: (episodeId) => `/episodes/${episodeId}/watched`,
    markUnwatched: (episodeId) => `/episodes/${episodeId}/unwatched`,
  },
};

/**
 * Construye una URL completa para un endpoint
 * @param {string} endpoint - El endpoint relativo
 * @returns {string} La URL completa
 */
export const buildApiUrl = (endpoint) => {
  return `${API.baseUrl}${endpoint}`;
};

export default {
  API,
  ENDPOINTS,
  buildApiUrl,
}; 