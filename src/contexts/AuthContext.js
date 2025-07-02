import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { apiService } from '../services/api.service';
import { ENDPOINTS } from '../config/api';
import { ENV } from '../config/env';
import { useToast } from './ToastContext';
import socketService from '../services/socket.service';

// Configurar WebBrowser para auth
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Obtener el scheme de la configuración de Expo
const APP_SCHEME = Constants.expoConfig?.scheme || 'episync';

// Configuración de OAuth
const GOOGLE_CLIENT_ID = ENV.GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = ENV.APPLE_CLIENT_ID;

export const AuthProvider = ({ children }) => {
  const { success, error } = useToast();
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configuración de AuthSession
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: APP_SCHEME,
      }),
    },
    { authorizationEndpoint: 'https://accounts.google.com/oauth/authorize' }
  );

  // Cargar tokens al iniciar
  useEffect(() => {
    loadTokens();
  }, []);

  // Manejar respuesta de Google OAuth
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuth(response.params.code);
    }
  }, [response]);

  // Cargar tokens guardados
  const loadTokens = async () => {
    try {
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUserString = await AsyncStorage.getItem('user');

      console.log('Cargando tokens almacenados...');
      
      // Verificar que tenemos todos los datos necesarios
      if (!storedAccessToken || !storedRefreshToken || !storedUserString) {
        console.log('No hay tokens almacenados o están incompletos');
        console.log('storedAccessToken', storedAccessToken);
        console.log('storedRefreshToken', storedRefreshToken);
        console.log('storedUserString', storedUserString);
        setIsLoading(false);
        return;
      }
      
      // Intentar parsear los datos del usuario
      let storedUser;
      try {
        storedUser = JSON.parse(storedUserString);
        if (!storedUser || typeof storedUser !== 'object') {
          throw new Error('Formato de usuario inválido');
        }
      } catch (parseError) {
        console.error('Error al parsear datos del usuario:', parseError);
        await clearTokens(); // Limpiar datos corruptos
        setIsLoading(false);
        return;
      }

      // Establecer los datos en el estado
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUser(storedUser);
      setIsAuthenticated(true);

      console.log('Tokens cargados correctamente');

      // Conectar al socket después de cargar los tokens
      try {
        console.log('🔌 Conectando al socket (global) después de cargar tokens...');
        await socketService.connect('global', storedAccessToken);
        console.log('✅ Socket conectado exitosamente después de cargar tokens');
      } catch (socketError) {
        console.error('❌ Error conectando al socket después de cargar tokens:', socketError);
        console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
      }

      // Verificar si el token sigue siendo válido
      try {
        const isValid = await validateToken(storedAccessToken);
        if (!isValid) {
          console.log('Token expirado, intentando refrescar...');
          const refreshed = await refreshAccessToken(storedRefreshToken);
          if (!refreshed) {
            console.log('No se pudo refrescar el token, cerrando sesión');
            await clearTokens();
            setIsAuthenticated(false);
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
        }
      } catch (validationError) {
        console.error('Error al validar token:', validationError);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      await clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar tokens
  const saveTokens = async (access, refresh, userData) => {
    try {
      if (!access || !refresh || !userData) {
        console.error('saveTokens: Missing required data', { access, refresh, userData });
        return;
      }
      
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  };

  // Limpiar tokens
  const clearTokens = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  };

  // Login con email/password
  const loginWithEmail = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Para desarrollo, simular login exitoso si el email contiene "test"
      if (email.includes('test')) {
        const mockUser = {
          id: '123',
          username: 'testuser',
          name: 'Usuario',
          lastname: 'Test',
          email: email,
          avatar_url: null,
          role: 'user',
          email_verified: false
        };
        
        const mockAccessToken = 'mock-access-token-' + Date.now();
        const mockRefreshToken = 'mock-refresh-token-' + Date.now();
        
        setAccessToken(mockAccessToken);
        setRefreshToken(mockRefreshToken);
        setUser(mockUser);
        setIsAuthenticated(true);
        
        await saveTokens(mockAccessToken, mockRefreshToken, mockUser);
        
        // Conectar al socket después del login exitoso
        try {
          console.log('🔌 Conectando al socket (global) después del login...');
          await socketService.connect('global', mockAccessToken);
          console.log('✅ Socket conectado exitosamente después del login');
        } catch (socketError) {
          console.error('❌ Error conectando al socket después del login:', socketError);
          console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
        }
        
        success('Login exitoso', 'Bienvenido de vuelta!');
        return { success: true };
      }
      
      // Conectar con la API real
      const response = await apiService.post(ENDPOINTS.auth.login, { email, password });
      
      if (!response.success) {
        throw new Error(response.message || 'Error en el login');
      }

      console.log('login response', response);
      
      // La respuesta tiene una estructura doblemente anidada: response.data.data
      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken, user: userData } = responseData;
      
      if (!accessToken || !refreshToken || !userData) {
        console.error('Datos inválidos en respuesta:', responseData);
        throw new Error('Formato de respuesta inválido');
      }
      
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      await saveTokens(accessToken, refreshToken, userData);
      
      // Conectar al socket después del login exitoso
      try {
        console.log('🔌 Conectando al socket (global) después del login...');
        await socketService.connect('global', accessToken);
        console.log('✅ Socket conectado exitosamente después del login');
      } catch (socketError) {
        console.error('❌ Error conectando al socket después del login:', socketError);
        console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
      }
      
      success('Login exitoso', 'Bienvenido de vuelta!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      error('Error de conexión', 'No se pudo conectar al servidor');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Google
  const loginWithGoogle = async () => {
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        // El manejo se hace en el useEffect
        return { success: true };
      } else {
        return { success: false, error: 'Login cancelado' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Manejar respuesta de Google
  const handleGoogleAuth = async (code) => {
    try {
      setIsLoading(true);
      
      // Para desarrollo, simular login exitoso
      if (ENV.IS_DEV) {
        const mockUser = {
          id: '456',
          name: 'Usuario Google',
          email: 'google@test.com',
          avatar_url: null
        };
        
        const mockAccessToken = 'mock-google-access-token-' + Date.now();
        const mockRefreshToken = 'mock-google-refresh-token-' + Date.now();
        
        setAccessToken(mockAccessToken);
        setRefreshToken(mockRefreshToken);
        setUser(mockUser);
        setIsAuthenticated(true);
        
        await saveTokens(mockAccessToken, mockRefreshToken, mockUser);
        
        // Conectar al socket después del login exitoso
        try {
          console.log('🔌 Conectando al socket (global) después del login...');
          await socketService.connect('global', mockAccessToken);
          console.log('✅ Socket conectado exitosamente después del login');
        } catch (socketError) {
          console.error('❌ Error conectando al socket después del login:', socketError);
          console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
        }
        
        success('Login exitoso', 'Bienvenido de vuelta!');
        return { success: true };
      }
      
      // Conectar con la API real
      const response = await apiService.post(ENDPOINTS.auth.google, { code });
      
      if (!response.success) {
        throw new Error(response.message || 'Error en la autenticación con Google');
      }

      const { accessToken: access, refreshToken: refresh, user: userData } = response.data;
      
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userData);
      setIsAuthenticated(true);
      
      await saveTokens(access, refresh, userData);
      
      // Conectar al socket después del login exitoso
      try {
        console.log('🔌 Conectando al socket (global) después del login...');
        await socketService.connect('global', access);
        console.log('✅ Socket conectado exitosamente después del login');
      } catch (socketError) {
        console.error('❌ Error conectando al socket después del login:', socketError);
        console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
      }
      
      success('Login exitoso', 'Bienvenido de vuelta!');
      return { success: true };
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Login con Apple
  const loginWithApple = async () => {
    try {
      setIsLoading(true);
      
      // Para desarrollo, simular login exitoso
      if (ENV.IS_DEV) {
        const mockUser = {
          id: '789',
          name: 'Usuario Apple',
          email: 'apple@test.com',
          avatar_url: null
        };
        
        const mockAccessToken = 'mock-apple-access-token-' + Date.now();
        const mockRefreshToken = 'mock-apple-refresh-token-' + Date.now();
        
        setAccessToken(mockAccessToken);
        setRefreshToken(mockRefreshToken);
        setUser(mockUser);
        setIsAuthenticated(true);
        
        await saveTokens(mockAccessToken, mockRefreshToken, mockUser);
        
        // Conectar al socket después del login exitoso
        try {
          console.log('🔌 Conectando al socket (global) después del login...');
          await socketService.connect('global', mockAccessToken);
          console.log('✅ Socket conectado exitosamente después del login');
        } catch (socketError) {
          console.error('❌ Error conectando al socket después del login:', socketError);
          console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
        }
        
        success('Login exitoso', 'Bienvenido de vuelta!');
        return { success: true };
      }
      
      // En un entorno real, implementar Apple Sign-In
      // Necesitarás configurar Apple Developer Account
      return { success: false, error: 'Apple Sign-In no implementado aún' };
    } catch (error) {
      console.error('Apple login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar usuario
  const register = async (name, lastname, username, email, password) => {
    try {
      setIsLoading(true);
      
      // Para desarrollo, simular registro exitoso si el email contiene "test"
      if (email.includes('test')) {
        const mockUser = {
          username: username,
          name: name,
          lastname: lastname,
          email: email,
          avatar_url: null,
          role: 'user',
          email_verified: false
        };
        
        const mockAccessToken = 'mock-access-token-' + Date.now();
        const mockRefreshToken = 'mock-refresh-token-' + Date.now();
        
        setAccessToken(mockAccessToken);
        setRefreshToken(mockRefreshToken);
        setUser(mockUser);
        setIsAuthenticated(true);
        
        await saveTokens(mockAccessToken, mockRefreshToken, mockUser);
        
        // Conectar al socket después del login exitoso
        try {
          console.log('🔌 Conectando al socket (global) después del login...');
          await socketService.connect('global', mockAccessToken);
          console.log('✅ Socket conectado exitosamente después del login');
        } catch (socketError) {
          console.error('❌ Error conectando al socket después del login:', socketError);
          console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
        }
        
        success('Registro exitoso', 'Bienvenido!');
        return { success: true };
      }
      
      const response = await apiService.post(ENDPOINTS.auth.register, { 
        name, 
        lastname, 
        username, 
        email, 
        password 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Error en el registro');
      }

      console.log('register response', response);
      
      // La respuesta tiene una estructura doblemente anidada: response.data.data
      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken, user: userData } = responseData;
      
      if (!accessToken || !refreshToken || !userData) {
        console.error('Datos inválidos en respuesta de registro:', responseData);
        throw new Error('Formato de respuesta inválido');
      }
      
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      await saveTokens(accessToken, refreshToken, userData);
      
      // Conectar al socket después del login exitoso
      try {
        console.log('🔌 Conectando al socket (global) después del login...');
        await socketService.connect('global', accessToken);
        console.log('✅ Socket conectado exitosamente después del login');
      } catch (socketError) {
        console.error('❌ Error conectando al socket después del login:', socketError);
        console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
      }
      
      success('Registro exitoso', 'Bienvenido!');
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Validar token
  const validateToken = async (token) => {
    try {
      const response = await apiService.get(ENDPOINTS.auth.validate, {
        'Authorization': `Bearer ${token}`,
      });
      return response.success;
    } catch (error) {
      return false;
    }
  };

  // Refrescar token
  const refreshAccessToken = async (refresh) => {
    try {
      const response = await apiService.post(ENDPOINTS.auth.refresh, { refreshToken: refresh });
      
      if (!response.success) {
        console.error('Error en refresh token:', response.message);
        throw new Error(response.message || 'Token refresh failed');
      }

      
      // La respuesta tiene una estructura doblemente anidada: response.data.data
      let responseData;
      
      // Intentar obtener los datos de diferentes formas posibles según la estructura de la respuesta
      if (response.data && response.data.data) {
        responseData = response.data.data;
      } else if (response.data) {
        responseData = response.data;
      } else {
        throw new Error('Formato de respuesta inválido en refresh token');
      }
      
      const { accessToken, refreshToken: newRefresh, user: userData } = responseData;
      
      if (!accessToken) {
        console.error('Token de acceso no encontrado en la respuesta:', responseData);
        throw new Error('Token de acceso no encontrado en la respuesta');
      }
      
      // Actualizar el token de acceso
      setAccessToken(accessToken);
      
      // Actualizar el token de refresco si está disponible
      if (newRefresh) {
        setRefreshToken(newRefresh);
      }
      
      // Actualizar datos del usuario si están disponibles
      if (userData) {
        setUser(userData);
      }
      
      // Guardar los nuevos tokens
      await saveTokens(
        accessToken, 
        newRefresh || refresh, // Usar el nuevo token de refresco o mantener el actual
        userData || user // Usar los nuevos datos de usuario o mantener los actuales
      );
      
      // Reconectar el socket con el nuevo token
      try {
        console.log('🔌 Reconectando socket (global) después de refrescar token...');
        await socketService.disconnect(); // Desconectar primero
        await socketService.connect('global', accessToken);
        console.log('✅ Socket reconectado exitosamente después de refrescar token');
      } catch (socketError) {
        console.error('❌ Error reconectando socket después de refrescar token:', socketError);
        console.log('⚠️ La app continuará funcionando sin sincronización en tiempo real');
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // No cerrar sesión automáticamente, solo devolver false
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Desconectar el socket antes del logout
      socketService.disconnect();
      console.log('🔌 Socket desconectado durante logout');
      
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      success('Logout exitoso', 'Sesión cerrada correctamente');
    } catch (error) {
      console.error('Logout error:', error);
      error('Error', 'No se pudo cerrar la sesión');
    }
  };

  // Obtener headers para requests autenticados
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  };

  // Request interceptor para refrescar token automáticamente
  const authenticatedRequest = async (endpoint, options = {}) => {
    try {
      const headers = {
        ...getAuthHeaders(),
        ...options.headers,
      };
      
      let response;
      
      switch (options.method?.toUpperCase() || 'GET') {
        case 'POST':
          response = await apiService.post(endpoint, options.body, headers);
          break;
        case 'PUT':
          response = await apiService.put(endpoint, options.body, headers);
          break;
        case 'DELETE':
          response = await apiService.delete(endpoint, headers);
          break;
        default:
          response = await apiService.get(endpoint, headers);
      }
      
      // Si la respuesta es 401 (Unauthorized) o contiene un mensaje específico de token expirado
      if (response.status === 401 || 
          (response.error && typeof response.error === 'string' && 
           response.error.toLowerCase().includes('token'))) {
        
        console.log('Token expirado, intentando refrescar...');
        
        // Verificar que tenemos un token de refresco
        if (!refreshToken) {
          console.error('No hay refresh token disponible');
          await logout();
          return { 
            success: false, 
            error: 'Sesión expirada. Por favor inicia sesión nuevamente.' 
          };
        }
        
        // Intentar refrescar token
        const refreshed = await refreshAccessToken(refreshToken);
        
        if (refreshed) {
          console.log('Token refrescado exitosamente, reintentando petición');
          
          // Reintentar request con nuevo token
          const newHeaders = {
            ...getAuthHeaders(), // Usar el nuevo token
            ...options.headers,
          };
          
          // Reintentar la petición con el nuevo token
          let newResponse;
          switch (options.method?.toUpperCase() || 'GET') {
            case 'POST':
              newResponse = await apiService.post(endpoint, options.body, newHeaders);
              break;
            case 'PUT':
              newResponse = await apiService.put(endpoint, options.body, newHeaders);
              break;
            case 'DELETE':
              newResponse = await apiService.delete(endpoint, newHeaders);
              break;
            default:
              newResponse = await apiService.get(endpoint, newHeaders);
          }
          
          return newResponse;
        } else {
          // Si no se pudo refrescar el token, cerrar sesión
          console.error('No se pudo refrescar el token, cerrando sesión');
          await logout();
          return { 
            success: false, 
            error: 'Sesión expirada. Por favor inicia sesión nuevamente.' 
          };
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated request error:', error);
      return {
        success: false,
        error: error.message || 'Error en la petición autenticada',
      };
    }
  };

  const authContext = {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
    register,
    logout,
    getAuthHeaders,
    authenticatedRequest,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}; 