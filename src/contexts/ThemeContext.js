import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'system', 'light', 'dark'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem('themeMode');
      if (savedThemeMode) {
        setThemeMode(savedThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeModeAndSave = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determinar si está en modo oscuro basado en la configuración
  const isDarkMode = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = {
    isDarkMode,
    themeMode,
    setThemeMode: setThemeModeAndSave,
    isLoading,
    colors: isDarkMode ? {
      background: '#0f172a',
      surface: '#1e293b',
      primary: '#3b82f6',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      border: '#334155',
      error: '#ef4444',
      success: '#10b981',
      skeleton: '#334155',
      skeletonShimmer: '#475569',
    } : {
      background: '#ffffff',
      surface: '#f8fafc',
      primary: '#3b82f6',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
      error: '#ef4444',
      success: '#10b981',
      skeleton: '#e2e8f0',
      skeletonShimmer: '#f1f5f9',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 