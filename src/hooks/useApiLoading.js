import { useState, useCallback } from 'react';
import { useLoading } from '../contexts/LoadingContext';

/**
 * Hook personalizado para manejar loading en llamadas a la API
 * 
 * @param {string} loadingKey - Clave única para identificar este loading
 * @returns {Object} - { loading, execute, startLoading, stopLoading }
 * 
 * @example
 * const { loading, execute } = useApiLoading('fetchUserGroups');
 * 
 * const fetchData = async () => {
 *   await execute(async () => {
 *     const response = await apiService.getUserGroups();
 *     // procesar respuesta
 *   });
 * };
 */
export const useApiLoading = (loadingKey) => {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [localLoading, setLocalLoading] = useState(false);

  const execute = useCallback(async (asyncFunction) => {
    try {
      setLocalLoading(true);
      startLoading(loadingKey);
      const result = await asyncFunction();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLocalLoading(false);
      stopLoading(loadingKey);
    }
  }, [loadingKey, startLoading, stopLoading]);

  const start = useCallback(() => {
    setLocalLoading(true);
    startLoading(loadingKey);
  }, [loadingKey, startLoading]);

  const stop = useCallback(() => {
    setLocalLoading(false);
    stopLoading(loadingKey);
  }, [loadingKey, stopLoading]);

  return {
    loading: localLoading || isLoading(loadingKey),
    execute,
    startLoading: start,
    stopLoading: stop,
  };
};

export default useApiLoading;

