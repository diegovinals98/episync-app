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
      const response = await this.get(`${ENDPOINTS.tmdb.search}?query=${encodeURIComponent(query)}`, headers);
      return this.normalizeResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Añade una serie a un grupo
   * @param {number} groupId - ID del grupo
   * @param {Object} seriesData - Datos de la serie a añadir
   * @param {Object} headers - Headers con el token de autenticación
   * @returns {Promise} La respuesta con la serie añadida
   */
  async addSeriesToGroup(groupId, seriesData, headers = {}) {
    try {
      const response = await this.post(`${ENDPOINTS.groups.series}/${groupId}/series`, seriesData, headers);
      return this.normalizeResponse(response);
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
}

// Exportar una instancia única del servicio
export const apiService = new ApiService();

export default apiService; 