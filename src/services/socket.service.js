import io from 'socket.io-client';
import { ENV } from '../config/env';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  /**
   * Conecta al socket y se une a un room específico
   * @param {string} roomId - ID del room (formato: groupId+seriesId)
   * @param {string} token - Token de autenticación
   * @returns {Promise} Promise que se resuelve cuando se conecta
   */
  connect(roomId, token) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Iniciando conexión Socket.IO...');
        console.log('📍 URL del servidor:', ENV.SOCKET_URL || 'http://localhost:4000');
        console.log('🚪 Room ID:', roomId);
        
        // Desconectar si ya hay una conexión activa
        if (this.socket) {
          console.log('🔄 Desconectando socket anterior...');
          this.disconnect();
        }

        // Crear nueva conexión
        this.socket = io(ENV.SOCKET_URL || 'http://localhost:4000', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000
        });

        // Eventos de conexión
        this.socket.on('connect', () => {
          console.log('✅ Socket conectado exitosamente!');
          console.log('🆔 Socket ID:', this.socket.id);
          console.log('🚪 Uniéndose al room:', roomId);
          this.isConnected = true;
          
          // Unirse al room
          this.joinRoom(roomId);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión Socket:', error);
          console.error('🔍 Detalles del error:', error.message);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket desconectado');
          console.log('📝 Razón:', reason);
          this.isConnected = false;
        });

        // Eventos específicos del room
        this.socket.on('episode_watched', (data) => {
          console.log('👁️ Episodio marcado como visto:', data);
          this.emitEvent('episode_watched', data);
        });

        this.socket.on('episode_unwatched', (data) => {
          console.log('👁️ Episodio marcado como no visto:', data);
          this.emitEvent('episode_unwatched', data);
        });

        this.socket.on('user_joined_room', (data) => {
          console.log('👤 Usuario se unió al room:', data);
          this.emitEvent('user_joined_room', data);
        });

        this.socket.on('user_left_room', (data) => {
          console.log('👤 Usuario salió del room:', data);
          this.emitEvent('user_left_room', data);
        });

        this.socket.on('room_error', (error) => {
          console.error('❌ Error en room:', error);
          this.emitEvent('room_error', error);
        });

      } catch (error) {
        console.error('❌ Error al conectar socket:', error);
        reject(error);
      }
    });
  }

  /**
   * Se une a un room específico
   * @param {string} roomId - ID del room
   */
  joinRoom(roomId) {
    if (!this.socket || !this.socket.connected) {
      console.error('❌ Socket no conectado');
      return;
    }

    console.log('🚪 Uniéndose al room:', roomId);
    console.log('📊 Estado actual del socket:', {
      connected: this.socket.connected,
      id: this.socket.id,
      roomId: roomId
    });
    
    this.currentRoom = roomId;
    this.socket.emit('join_room', { roomId });
    
    console.log('✅ Solicitud de unión al room enviada');
  }

  /**
   * Sale del room actual
   */
  leaveRoom() {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.log('ℹ️ No hay room activo para salir');
      return;
    }

    console.log('🚪 Saliendo del room:', this.currentRoom);
    this.socket.emit('leave_room', { roomId: this.currentRoom });
    this.currentRoom = null;
    console.log('✅ Solicitud de salida del room enviada');
  }

  /**
   * Marca un episodio como visto
   * @param {Object} episodeData - Datos del episodio
   */
  markEpisodeWatched(episodeData) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.error('❌ Socket no conectado o no en room');
      return;
    }

    const data = {
      roomId: this.currentRoom,
      episodeId: episodeData.id,
      episodeNumber: episodeData.episode_number,
      seasonNumber: episodeData.season_number,
      seriesId: episodeData.series_id,
      userId: episodeData.user_id,
      timestamp: new Date().toISOString()
    };

    console.log('👁️ Marcando episodio como visto');
    console.log('📊 Datos del episodio:', {
      roomId: data.roomId,
      episodeId: data.episodeId,
      episodeNumber: data.episodeNumber,
      seasonNumber: data.seasonNumber,
      seriesId: data.seriesId,
      userId: data.userId
    });
    console.log('🕐 Timestamp:', data.timestamp);
    
    this.socket.emit('mark_episode_watched', data);
    console.log('✅ Evento mark_episode_watched enviado');
  }

  /**
   * Marca un episodio como no visto
   * @param {Object} episodeData - Datos del episodio
   */
  markEpisodeUnwatched(episodeData) {
    if (!this.socket || !this.isConnected || !this.currentRoom) {
      console.error('❌ Socket no conectado o no en room');
      return;
    }

    const data = {
      roomId: this.currentRoom,
      episodeId: episodeData.id,
      episodeNumber: episodeData.episode_number,
      seasonNumber: episodeData.season_number,
      seriesId: episodeData.series_id,
      userId: episodeData.user_id,
      timestamp: new Date().toISOString()
    };

    console.log('👁️ Marcando episodio como no visto');
    console.log('📊 Datos del episodio:', {
      roomId: data.roomId,
      episodeId: data.episodeId,
      episodeNumber: data.episodeNumber,
      seasonNumber: data.seasonNumber,
      seriesId: data.seriesId,
      userId: data.userId
    });
    console.log('🕐 Timestamp:', data.timestamp);
    
    this.socket.emit('mark_episode_unwatched', data);
    console.log('✅ Evento mark_episode_unwatched enviado');
  }

  /**
   * Agrega un listener para un evento específico
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remueve un listener específico
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback a remover
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emite un evento interno a los listeners registrados
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos del evento
   */
  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error en listener de ${event}:`, error);
        }
      });
    }
  }

  /**
   * Desconecta el socket
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Iniciando desconexión del socket...');
      console.log('🚪 Room actual:', this.currentRoom);
      console.log('🆔 Socket ID:', this.socket.id);
      
      this.leaveRoom();
      this.socket.disconnect();
      this.socket = null;
      this.currentRoom = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('✅ Socket desconectado completamente');
    } else {
      console.log('ℹ️ No hay socket activo para desconectar');
    }
  }

  /**
   * Obtiene el estado de conexión
   * @returns {boolean} true si está conectado
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Obtiene el room actual
   * @returns {string|null} ID del room actual
   */
  getCurrentRoom() {
    return this.currentRoom;
  }
}

// Exportar una instancia única del servicio
export const socketService = new SocketService();
export default socketService; 