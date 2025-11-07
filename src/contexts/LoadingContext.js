import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Modal, ActivityIndicator, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from './ThemeContext';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const { isDarkMode } = useTheme();

  // Función para iniciar loading con una clave específica
  const startLoading = useCallback((key, message = '') => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { loading: true, message }
    }));
  }, []);

  // Función para detener loading con una clave específica
  const stopLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // Función para verificar si una clave específica está cargando
  const isLoading = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);

  // Función para obtener el mensaje de una clave específica
  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || '';
  }, [loadingStates]);

  // Función para loading global (overlay)
  const setGlobalLoadingState = useCallback((loading, message = '') => {
    setGlobalLoading(loading);
    setGlobalMessage(message);
  }, []);

  // Verificar si hay algún loading activo
  const hasAnyLoading = Object.keys(loadingStates).length > 0 || globalLoading;

  const value = {
    startLoading,
    stopLoading,
    isLoading,
    getLoadingMessage,
    setGlobalLoading: setGlobalLoadingState,
    globalLoading,
    globalMessage,
    hasAnyLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading && (
        <LoadingOverlay 
          message={globalMessage} 
          isDarkMode={isDarkMode}
        />
      )}
    </LoadingContext.Provider>
  );
};

// Componente de Loading Overlay elegante
const LoadingOverlay = ({ message, isDarkMode }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de rotación continua
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Animación de escala pulsante
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedIconStyle = {
    transform: [
      { rotate: rotateInterpolate },
      { scale: scale }
    ],
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      statusBarTranslucent
    >
      <View style={[
        styles.overlay,
        { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
      ]}>
        <View style={[
          styles.container,
          { backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface }
        ]}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primary[500] },
              animatedIconStyle
            ]}
          >
            <Ionicons name="sync" size={32} color="white" />
          </Animated.View>
          
          <ActivityIndicator 
            size="large" 
            color={colors.primary[500]} 
            style={styles.spinner}
          />
          
          {message && (
            <Text style={[
              styles.message,
              { color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }
            ]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  spinner: {
    marginTop: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 200,
  },
});

export default LoadingContext;

