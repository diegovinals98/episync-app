import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import notificationRegistrationService from './src/services/notificationRegistration.service';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import AddSeriesScreen from './src/screens/AddSeriesScreen';
import Toast from 'react-native-toast-message';
import CustomToast from './src/components/CustomToast';
import Loader from './src/components/Loader';
import GroupSeriesDetailScreen from './src/screens/GroupSeriesDetailScreen';
import SeasonEpisodesScreen from './src/screens/SeasonEpisodesScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import Constants from 'expo-constants';
import { colors } from './src/styles/colors';
import { Alert } from "react-native";


fetch("https://episync.bodasofiaydiego.es/api/v1/health")
  .then(res => {
    return res.text().then(text => {
      Alert.alert(`Status: ${res.status}`, text);
    });
  })
  .catch(err => {
    Alert.alert("❌ Error de red", err.message);
    console.error(err);
  });

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  const { isDarkMode } = useTheme();
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: isDarkMode ? colors.dark.background : colors.light.background,
        },
        headerTintColor: isDarkMode ? colors.dark.text : colors.light.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          title: 'Iniciar Sesión',
          headerShown: false // Login no necesita header
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          title: 'Registrarse'
        }}
      />
    </Stack.Navigator>
  );
};

const MainStack = () => {
  const { isDarkMode } = useTheme();
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: isDarkMode ? colors.dark.background : colors.light.background,
        },
        headerTintColor: isDarkMode ? colors.dark.text : colors.light.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'Inicio',
          headerShown: false // Home no necesita header
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Configuración'
        }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ 
          title: 'Crear Grupo'
        }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.group?.name || 'Detalles del Grupo'
        })}
      />
      <Stack.Screen 
        name="AddSeries" 
        component={AddSeriesScreen}
        options={{ 
          title: 'Añadir Serie'
        }}
      />
      <Stack.Screen 
        name="GroupSeriesDetail" 
        component={GroupSeriesDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.series?.name || 'Detalles de Serie'
        })}
      />
      <Stack.Screen 
        name="SeasonEpisodes" 
        component={SeasonEpisodesScreen}
        options={({ route }) => ({ 
          title: route.params?.season?.name || 'Episodios'
        })}
      />
      <Stack.Screen 
        name="Comments" 
        component={CommentsScreen}
        options={({ route }) => ({ 
          title: route.params?.group?.name || 'Comentarios'
        })}
      />
    </Stack.Navigator>
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Configurar manejadores de notificaciones al montar el componente
  useEffect(() => {
    console.log('🔧 Configurando manejadores de notificaciones...');
    const { notificationListener, responseListener } = notificationRegistrationService.setupNotificationHandlers();
    
    // Cleanup al desmontar
    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);
  
  if (isLoading) {
    return <Loader message="Comprobando sesión..." />;
  }
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
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
