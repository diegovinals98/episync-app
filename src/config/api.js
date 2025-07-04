/**
 * Configuración de la API para diferentes entornos
 */

// Detectar el entorno actual
const isProduction = process.env.NODE_ENV === 'production';

// URLs de la API
const API_CONFIG = {
  development: {
    baseUrl: 'https://episync.bodasofiaydiego.es',
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
  return `${API.baseUrl}${endpoint}`;
};

export default {
  API,
  ENDPOINTS,
  buildApiUrl,
}; 