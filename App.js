import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useAuth } from './src/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import CustomToast from './src/components/CustomToast';

// Componente principal que maneja la navegación basada en autenticación
const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState('home');

  // Si está cargando, mostrar skeleton o splash
  if (isLoading) {
    return null; // O un componente de loading
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Si está autenticado, mostrar la app principal
  const handleSettings = () => {
    setCurrentScreen('settings');
  };

  const handleBackFromSettings = () => {
    setCurrentScreen('home');
  };

  switch (currentScreen) {
    case 'settings':
      return <SettingsScreen onBack={handleBackFromSettings} />;
    case 'home':
    default:
      return <HomeScreen onSettings={handleSettings} />;
  }
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppContent />
            <Toast config={{
              success: (props) => <CustomToast {...props} type="success" />,
              error: (props) => <CustomToast {...props} type="error" />,
              info: (props) => <CustomToast {...props} type="info" />,
              warning: (props) => <CustomToast {...props} type="warning" />,
            }} />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
