import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { apiService } from '../services/api.service';
import { ENDPOINTS } from '../config/api';
import { ENV } from '../config/env';

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
      const storedUser = await AsyncStorage.getItem('user');

      if (storedAccessToken && storedRefreshToken && storedUser) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        // Verificar si el token sigue siendo válido
        const isValid = await validateToken(storedAccessToken);
        if (!isValid) {
          await refreshAccessToken(storedRefreshToken);
        }
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
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
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
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
        throw new Error('Token refresh failed');
      }

      console.log('refresh response', response);
      
      // La respuesta tiene una estructura doblemente anidada: response.data.data
      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken: newRefresh, user: userData } = responseData;
      
      if (!accessToken || !newRefresh || !userData) {
        console.error('Datos inválidos en respuesta de refresh:', responseData);
        throw new Error('Formato de respuesta inválido en refresh token');
      }
      
      setAccessToken(accessToken);
      setRefreshToken(newRefresh);
      setUser(userData);
      
      await saveTokens(accessToken, newRefresh, userData);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Revocar token en el servidor si es necesario
      if (refreshToken) {
        await apiService.post(ENDPOINTS.auth.logout, { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      await clearTokens();
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
      
      if (response.status === 401) {
        // Token expirado, intentar refrescar
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          // Reintentar request con nuevo token
          const newHeaders = {
            ...getAuthHeaders(),
            ...options.headers,
          };
          
          switch (options.method?.toUpperCase() || 'GET') {
            case 'POST':
              return apiService.post(endpoint, options.body, newHeaders);
            case 'PUT':
              return apiService.put(endpoint, options.body, newHeaders);
            case 'DELETE':
              return apiService.delete(endpoint, newHeaders);
            default:
              return apiService.get(endpoint, newHeaders);
          }
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
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