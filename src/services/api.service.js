import { API, ENDPOINTS, buildApiUrl } from '../config/api';
import { ENV } from '../config/env';

/**
 * Servicio para manejar las peticiones a la API
 */
class ApiService {
  constructor() {
    this.baseUrl = ENV.API_URL;
    this.timeout = API.timeout;
  }

  /**
   * Realiza una petición GET
   * @param {string} endpoint - El endpoint relativo
   * @param {Object} headers - Headers adicionales
   * @returns {Promise} La respuesta de la petición
   */
  async get(endpoint, headers = {}) {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Realiza una petición POST
   * @param {string} endpoint - El endpoint relativo
   * @param {Object} data - Los datos a enviar
   * @param {Object} headers - Headers adicionales
   * @returns {Promise} La respuesta de la petición
   */
  async post(endpoint, data = {}, headers = {}) {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Realiza una petición PUT
   * @param {string} endpoint - El endpoint relativo
   * @param {Object} data - Los datos a enviar
   * @param {Object} headers - Headers adicionales
   * @returns {Promise} La respuesta de la petición
   */
  async put(endpoint, data = {}, headers = {}) {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Realiza una petición DELETE
   * @param {string} endpoint - El endpoint relativo
   * @param {Object} headers - Headers adicionales
   * @returns {Promise} La respuesta de la petición
   */
  async delete(endpoint, headers = {}) {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene los grupos del usuario autenticado
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con los grupos del usuario
   */
  async getUserGroups(headers = {}) {
    try {
      const response = await this.get(ENDPOINTS.groups.user, headers);
      // Normalizar la respuesta para facilitar el acceso a los datos
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Crea un nuevo grupo
   * @param {Object} groupData - Datos del grupo a crear
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con el grupo creado
   */
  async createGroup(groupData, headers = {}) {
    try {
      const response = await this.post(ENDPOINTS.groups.create, groupData, headers);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene los detalles de un grupo específico
   * @param {number} groupId - ID del grupo
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con los detalles del grupo
   */
  async getGroupDetails(groupId, headers = {}) {
    try {
      const response = await this.get(`${ENDPOINTS.groups.details}/${groupId}`, headers);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene las series de un grupo específico
   * @param {number} groupId - ID del grupo
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con las series del grupo
   */
  async getGroupSeries(groupId, headers = {}) {
    try {
      const response = await this.get(`${ENDPOINTS.groups.series}/${groupId}/series`, headers);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene los miembros de un grupo específico
   * @param {number} groupId - ID del grupo
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con los miembros del grupo
   */
  async getGroupMembers(groupId, headers = {}) {
    try {
      const response = await this.get(`${ENDPOINTS.groups.members}/${groupId}/members`, headers);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Busca usuarios por nombre o username
   * @param {string} query - Texto para buscar usuarios
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con los usuarios encontrados
   */
  async searchUsers(query, headers = {}) {
    try {
      const response = await this.get(`${ENDPOINTS.users.search}?q=${encodeURIComponent(query)}`, headers);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Sube una imagen al servidor
   * @param {Object} imageData - Datos de la imagen (uri, type, name)
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con la URL de la imagen subida
   */
  async uploadImage(imageData, headers = {}) {
    try {
      const formData = new FormData();
      
      // Crear el archivo para subir
      const imageFile = {
        uri: imageData.uri,
        type: imageData.type || 'image/jpeg',
        name: imageData.name || 'group-photo.jpg',
      };
      
      formData.append('image', imageFile);
      
      const response = await fetch(buildApiUrl(ENDPOINTS.upload.image), {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers,
        },
        body: formData,
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Busca series en TheMovieDatabase
   * @param {string} query - Texto para buscar series
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con las series encontradas
   */
  async searchTMDBSeries(query, headers = {}) {
    try {
      // Parámetros para la búsqueda de TMDB
      const params = new URLSearchParams({
        query: query,
        include_adult: 'false',
        language: 'en-US',
        page: '1'
      });

      // Headers específicos para TMDB
      const tmdbHeaders = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1YmRhYzE1NTQ1ZjUzNzM2ZDUyZTk3MTE1NDI0NTExNSIsIm5iZiI6MTc1MTM3ODA3Ny40ODMsInN1YiI6IjY4NjNlODlkZDljYTA2ZmNlZmY4M2VkMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9nsGIEk6ApFEVetd-9yIfFes8bclTPu-jsgdqc7G9mk',
        'accept': 'application/json',
        ...headers
      };

      const url = `${ENDPOINTS.tmdb.search}?${params.toString()}`;
      console.log('🔍 TMDB URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: tmdbHeaders,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.status_message || 'Error en la búsqueda de TMDB',
          data: null,
          error: data,
        };
      }

      // TMDB devuelve los resultados en data.results
      return {
        success: true,
        status: response.status,
        message: 'Búsqueda exitosa',
        data: data.results || [],
        error: null,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Normaliza una respuesta de la API para facilitar el acceso a los datos
   * @param {Object} response - La respuesta original
   * @returns {Object} La respuesta normalizada
   */
  normalizeResponse(response) {
    if (!response.success) {
      return response;
    }

    // Crear una copia de la respuesta
    const normalizedResponse = { ...response };

    // Si los datos están anidados en data.data, subirlos un nivel
    if (response.data && response.data.data) {
      normalizedResponse.normalizedData = response.data.data;
    } else {
      normalizedResponse.normalizedData = response.data;
    }

    return normalizedResponse;
  }

  /**
   * Maneja la respuesta de la petición
   * @param {Response} response - La respuesta de la petición
   * @returns {Promise} La respuesta procesada
   */
  async handleResponse(response) {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || 'Error en la petición',
          data: null,
          error: data,
        };
      }
      
      // Manejar diferentes estructuras de respuesta
      // Algunas APIs devuelven { data: { ... } }, otras { data: { data: { ... } } }
      return {
        success: true,
        status: response.status,
        message: data.message || 'Petición exitosa',
        data: data,
        error: null,
      };
    } catch (error) {
      console.error('Error al procesar respuesta:', error);
      return {
        success: false,
        status: response.status || 500,
        message: 'Error al procesar la respuesta',
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Maneja los errores de la petición
   * @param {Error} error - El error de la petición
   * @returns {Object} El error procesado
   */
  handleError(error) {
    console.error('API Error:', error);
    
    return {
      success: false,
      status: 500,
      message: 'Error de conexión',
      data: null,
      error: error.message,
    };
  }

  /**
   * Obtiene los detalles de una serie desde TMDB
   * @param {number} tmdbId - ID de TMDB de la serie
   * @param {Object} headers - Headers adicionales
   * @returns {Promise} La respuesta con los detalles de la serie
   */
  async getTMDBSeriesDetails(tmdbId, headers = {}) {
    try {
      // Headers específicos para TMDB
      const tmdbHeaders = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1YmRhYzE1NTQ1ZjUzNzM2ZDUyZTk3MTE1NDI0NTExNSIsIm5iZiI6MTc1MTM3ODA3Ny40ODMsInN1YiI6IjY4NjNlODlkZDljYTA2ZmNlZmY4M2VkMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9nsGIEk6ApFEVetd-9yIfFes8bclTPu-jsgdqc7G9mk',
        'accept': 'application/json',
        ...headers
      };

      const url = `https://api.themoviedb.org/3/tv/${tmdbId}?language=en-US`;
      console.log('🔍 TMDB Series Details URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: tmdbHeaders,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.status_message || 'Error al obtener detalles de la serie',
          data: null,
          error: data,
        };
      }

      return {
        success: true,
        status: response.status,
        message: 'Detalles de serie obtenidos exitosamente',
        data: data,
        error: null,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene los episodios de una temporada específica de TMDB
   * @param {number} tmdbId - ID de TMDB de la serie
   * @param {number} seasonNumber - Número de temporada
   * @param {Object} headers - Headers adicionales
   * @returns {Promise} La respuesta con los episodios de la temporada
   */
  async getTMDBSeasonEpisodes(tmdbId, seasonNumber, headers = {}) {
    try {
      // Headers específicos para TMDB
      const tmdbHeaders = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1YmRhYzE1NTQ1ZjUzNzM2ZDUyZTk3MTE1NDI0NTExNSIsIm5iZiI6MTc1MTM3ODA3Ny40ODMsInN1YiI6IjY4NjNlODlkZDljYTA2ZmNlZmY4M2VkMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9nsGIEk6ApFEVetd-9yIfFes8bclTPu-jsgdqc7G9mk',
        'accept': 'application/json',
        ...headers
      };

      const url = `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?language=en-US`;
      console.log('🔍 TMDB Season Episodes URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: tmdbHeaders,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.status_message || 'Error al obtener episodios de la temporada',
          data: null,
          error: data,
        };
      }

      return {
        success: true,
        status: response.status,
        message: 'Episodios obtenidos exitosamente',
        data: data,
        error: null,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene el progreso de los miembros de un grupo en una serie específica
   * @param {number} groupId - ID del grupo
   * @param {number} seriesId - ID de la serie
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con el progreso de los miembros
   */
  async getSeriesProgress(groupId, seriesId, headers = {}) {
    try {
      const response = await this.get(ENDPOINTS.groups.progress(groupId, seriesId), headers);
      console.log('🔍 Series progress response:', response);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene los episodios vistos de una temporada específica
   * @param {number} groupId - ID del grupo
   * @param {number} seriesId - ID de la serie
   * @param {number} seasonNumber - Número de temporada
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con los episodios vistos
   */
  async getEpisodesWatched(groupId, seriesId, seasonNumber, headers = {}) {
    try {
      const response = await this.get(ENDPOINTS.groups.episodesWatched(groupId, seriesId, seasonNumber), headers);
      console.log('🔍 Episodes watched response:', response);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Obtiene los próximos capítulos/episodios del usuario
   * @param {Object} headers - Headers con el token de autenticación
   * @param {Object} options - Opciones adicionales (limit, offset, etc.)
   * @returns {Promise} La respuesta con los próximos episodios
   */
  async getUpcomingEpisodes(headers = {}, options = {}) {
    try {
      const { limit, offset } = options;
      let endpoint = ENDPOINTS.episodes.upcoming;
      
      // Agregar query params si se proporcionan
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (offset) params.append('offset', offset);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      const response = await this.get(endpoint, headers);
      console.log('🔍 Upcoming episodes response:', response);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Exportar una instancia única del servicio
export const apiService = new ApiService();

export default apiService; 