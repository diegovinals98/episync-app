import { useState, useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';
import socketService from '../services/socket.service';

/**
 * Hook para manejar loading durante eventos de socket
 * 
 * @param {string} eventName - Nombre del evento de socket a escuchar
 * @param {string} loadingKey - Clave única para identificar este loading
 * @param {Function} onEvent - Callback cuando se recibe el evento
 * @returns {Object} - { loading, connectionStatus }
 * 
 * @example
 * const { loading } = useSocketLoading(
 *   'series-added-to-group',
 *   'addingSeries',
 *   (data) => {
 *     // manejar evento
 *   }
 * );
 */
export const useSocketLoading = (eventName, loadingKey, onEvent) => {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    // Verificar estado de conexión
    const checkConnection = () => {
      const isConnected = socketService.getConnectionStatus();
      setConnectionStatus(isConnected);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    // Listener para el evento
    if (eventName && onEvent) {
      const handleEvent = (data) => {
        stopLoading(loadingKey);
        onEvent(data);
      };

      socketService.on(eventName, handleEvent);

      return () => {
        socketService.off(eventName, handleEvent);
        clearInterval(interval);
      };
    }

    return () => {
      clearInterval(interval);
    };
  }, [eventName, loadingKey, onEvent, stopLoading]);

  const start = () => {
    startLoading(loadingKey);
  };

  const stop = () => {
    stopLoading(loadingKey);
  };

  return {
    loading: isLoading(loadingKey),
    connectionStatus,
    startLoading: start,
    stopLoading: stop,
  };
};

export default useSocketLoading;

