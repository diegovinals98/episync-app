import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traducciones
export const translations = {
  es: {
    // Login
    welcome: 'Bienvenido a',
    appName: 'EPISYNC',
    loginSubtitle: 'Gestiona series con familia y amigos',
    email: 'Email',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    loginButton: 'Iniciar Sesión',
    orContinueWith: 'o continúa con',
    noAccount: '¿No tienes cuenta?',
    registerHere: 'Regístrate aquí',
    pleaseCompleteFields: 'Por favor completa todos los campos',
    error: 'Error',
    
    // Registro
    register: 'Registro',
    createAccount: 'Crear Cuenta',
    registerSubtitle: 'Únete a la comunidad de EPISYNC',
    username: 'Nombre de usuario',
    usernamePlaceholder: 'Elige un nombre de usuario único',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    lastname: 'Apellido',
    lastnamePlaceholder: 'Tu apellido',
    confirmPassword: 'Confirmar Contraseña',
    registerButton: 'Registrarse',
    registering: 'Registrando...',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    loginHere: 'Inicia sesión aquí',
    
    // Home
    hello: 'Hola',
    welcomeBack: '¡Bienvenido de vuelta!',
    yourStats: 'Tus Estadísticas',
    series: 'Series',
    episodes: 'Episodios',
    hours: 'Horas',
    yourGroups: 'Tus Grupos',
    join: 'Unirse',
    create: 'Crear',
    members: 'miembros',
    popularSeries: 'Series Populares',
    
    // Settings
    settings: 'Configuración',
    profile: 'Perfil',
    appTheme: 'Tema de la App',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    notifications: 'Notificaciones',
    notificationsSubtitle: 'Recibe notificaciones de actividad',
    tapToChangePhoto: 'Toca para cambiar foto',
    saved: 'Guardado',
    savedMessage: 'Tus cambios han sido guardados',
    
    // General
    myGroups: 'Mis Grupos',
    noGroups: 'No tienes grupos',
    noGroupsSubtitle: 'Crea o únete a un grupo para empezar',
    createGroup: 'Crear Grupo',
    joinGroup: 'Unirse a Grupo',
    recentActivity: 'Actividad Reciente',
  },
  en: {
    // Login
    welcome: 'Welcome to',
    appName: 'EPISYNC',
    loginSubtitle: 'Manage series with family and friends',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    loginButton: 'Login',
    orContinueWith: 'or continue with',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    pleaseCompleteFields: 'Please complete all fields',
    error: 'Error',
    
    // Registro
    register: 'Register',
    createAccount: 'Create Account',
    registerSubtitle: 'Join the EPISYNC community',
    username: 'Username',
    usernamePlaceholder: 'Choose a unique username',
    name: 'Name',
    namePlaceholder: 'Your name',
    lastname: 'Last name',
    lastnamePlaceholder: 'Your last name',
    confirmPassword: 'Confirm Password',
    registerButton: 'Register',
    registering: 'Registering...',
    alreadyHaveAccount: 'Already have an account?',
    loginHere: 'Login here',
    
    // Home
    hello: 'Hello',
    welcomeBack: 'Welcome back!',
    yourStats: 'Your Stats',
    series: 'Series',
    episodes: 'Episodes',
    hours: 'Hours',
    yourGroups: 'Your Groups',
    join: 'Join',
    create: 'Create',
    members: 'members',
    popularSeries: 'Popular Series',
    
    // Settings
    settings: 'Settings',
    profile: 'Profile',
    name: 'Name',
    appTheme: 'App Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    notifications: 'Notifications',
    notificationsSubtitle: 'Receive activity notifications',
    tapToChangePhoto: 'Tap to change photo',
    saved: 'Saved',
    savedMessage: 'Your changes have been saved',
    
    // General
    myGroups: 'My Groups',
    noGroups: 'You have no groups',
    noGroupsSubtitle: 'Create or join a group to get started',
    createGroup: 'Create Group',
    joinGroup: 'Join Group',
    recentActivity: 'Recent Activity',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem('language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const languageContext = {
    language,
    changeLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={languageContext}>
      {children}
    </LanguageContext.Provider>
  );
}; 