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
   * Maneja la respuesta de la petición
   * @param {Response} response - La respuesta de la petición
   * @returns {Promise} La respuesta procesada
   */
  async handleResponse(response) {
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
    
    return {
      success: true,
      status: response.status,
      message: data.message || 'Petición exitosa',
      data: data,
      error: null,
    };
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