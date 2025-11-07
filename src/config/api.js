/**
 * Configuración de la API para diferentes entornos
 */

import { ENV } from './env';

// Detectar el entorno actual
const isProduction = process.env.NODE_ENV === 'production';

// URLs de la API
const API_CONFIG = {
  development: {
    baseUrl: ENV.API_URL || 'http://localhost:4000', // Usa la URL del .env
    timeout: 10000, // 10 segundos
  },
  production: {
    baseUrl: (() => {
      // Intentar importar API_URL_PROD desde @env
      try {
        const { API_URL_PROD } = require('@env');
        return API_URL_PROD || ENV.API_URL || 'https://api.episync.com';
      } catch {
        return ENV.API_URL || 'https://api.episync.com';
      }
    })(), // URL de producción
    timeout: 15000, // 15 segundos
  }
};

// Validar que baseUrl esté definido
if (!API_CONFIG.development.baseUrl) {
  console.error('❌ ERROR: API_URL no está definida. Verifica tu archivo .env');
}
console.log('🔍 API baseUrl configurado:', API_CONFIG.development.baseUrl);

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
    search: '/api/v1/users/search',
  },
  groups: {
    list: '/groups',
    create: '/api/v1/groups',
    join: '/groups/join',
    details: '/api/v1/groups',
    series: '/api/v1/groups',
    members: '/api/v1/groups',
    user: '/api/v1/groups/user',
    progress: (groupId, seriesId) => `/api/v1/groups/${groupId}/series/${seriesId}/progress`,
    episodesWatched: (groupId, seriesId, seasonNumber) => `/api/v1/groups/${groupId}/series/${seriesId}/season/${seasonNumber}/episodes-watched`,
  },
  series: {
    popular: '/series/popular',
    search: '/series/search',
    details: (seriesId) => `/series/${seriesId}`,
  },
  tmdb: {
    search: 'https://api.themoviedb.org/3/search/tv',
  },
  episodes: {
    markWatched: (episodeId) => `/episodes/${episodeId}/watched`,
    markUnwatched: (episodeId) => `/episodes/${episodeId}/unwatched`,
    upcoming: '/api/v1/episodes/upcoming',
  },
  upload: {
    image: '/api/v1/upload/image',
  },
};

/**
 * Construye una URL completa para un endpoint
 * @param {string} endpoint - El endpoint relativo
 * @returns {string} La URL completa
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = API.baseUrl || ENV.API_URL || 'http://localhost:4000';
  
  // Asegurar que baseUrl no termine con / y endpoint no empiece con /
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${cleanBaseUrl}${cleanEndpoint}`;
};

export default {
  API,
  ENDPOINTS,
  buildApiUrl,
}; 