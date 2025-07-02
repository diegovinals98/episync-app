import React, { useState } from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
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

// Componente principal que maneja la navegación basada en autenticación
const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [refreshGroups, setRefreshGroups] = useState(null);
  const [groupDetailData, setGroupDetailData] = useState(null);
  const [addSeriesData, setAddSeriesData] = useState(null);
  const [groupSeriesDetailData, setGroupSeriesDetailData] = useState(null);
  const [seasonEpisodesData, setSeasonEpisodesData] = useState(null);

  // Definir todas las funciones de manejo antes de los returns condicionales
  const handleSettings = React.useCallback(() => {
    setCurrentScreen('settings');
  }, []);

  const handleBackFromSettings = React.useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleCreateGroup = React.useCallback(() => {
    setCurrentScreen('createGroup');
  }, []);

  const handleBackFromCreateGroup = React.useCallback(() => {
    setCurrentScreen('home');
  }, []);

  const handleGroupDetail = React.useCallback((screenName, params) => {
    if (screenName === 'GroupDetail') {
      setGroupDetailData(params.group);
      setCurrentScreen('groupDetail');
    }
  }, []);

  const handleBackFromGroupDetail = React.useCallback(() => {
    setCurrentScreen('home');
    setGroupDetailData(null);
  }, []);

  const handleGroupCreated = React.useCallback(() => {
    // Volver a la pantalla principal y refrescar los grupos
    setCurrentScreen('home');
    if (refreshGroups) {
      // Pequeño delay para asegurar que la pantalla se ha actualizado
      setTimeout(() => {
        refreshGroups();
      }, 500);
    }
  }, [refreshGroups]);

  const handleGroupCreatedCallback = React.useCallback((refreshFunction) => {
    setRefreshGroups(() => refreshFunction);
  }, []);

  const handleAddSeries = React.useCallback((screenName, params) => {
    if (screenName === 'AddSeries') {
      setAddSeriesData(params.group);
      setCurrentScreen('addSeries');
    }
  }, []);

  const handleBackFromAddSeries = React.useCallback(() => {
    setCurrentScreen('groupDetail');
    setAddSeriesData(null);
  }, []);

  const handleGroupSeriesDetail = React.useCallback((screenName, params) => {
    if (screenName === 'GroupSeriesDetail') {
      setGroupSeriesDetailData(params);
      setCurrentScreen('groupSeriesDetail');
    }
  }, []);

  const handleBackFromGroupSeriesDetail = React.useCallback(() => {
    setCurrentScreen('groupDetail');
    setGroupSeriesDetailData(null);
  }, []);

  const handleSeasonEpisodes = React.useCallback((screenName, params) => {
    if (screenName === 'SeasonEpisodes') {
      setSeasonEpisodesData(params);
      setCurrentScreen('seasonEpisodes');
    }
  }, []);

  const handleBackFromSeasonEpisodes = React.useCallback(() => {
    setCurrentScreen('groupSeriesDetail');
    setSeasonEpisodesData(null);
  }, []);

  // Si está cargando, mostrar el loader
  if (isLoading) {
    return <Loader message="Comprobando sesión..." />;
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Si está autenticado, mostrar la app principal
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'settings':
        return <SettingsScreen onBack={handleBackFromSettings} />;
      case 'createGroup':
        return <CreateGroupScreen onBack={handleBackFromCreateGroup} onSuccess={handleGroupCreated} />;
      case 'groupSeriesDetail':
        return (
          <GroupSeriesDetailScreen
            onBack={handleBackFromGroupSeriesDetail}
            group={groupSeriesDetailData?.group}
            series={groupSeriesDetailData?.series}
            members={groupSeriesDetailData?.members}
            onSeasonEpisodes={handleSeasonEpisodes}
          />
        );
      case 'groupDetail':
        return (
          <GroupDetailScreen 
            group={groupDetailData}
            onBack={handleBackFromGroupDetail}
            onAddSeries={handleAddSeries}
            onGroupSeriesDetail={handleGroupSeriesDetail}
            onSeasonEpisodes={handleSeasonEpisodes}
          />
        );
      case 'addSeries':
        return <AddSeriesScreen onBack={handleBackFromAddSeries} group={addSeriesData} />;
      case 'seasonEpisodes':
        return (
          <SeasonEpisodesScreen 
            group={seasonEpisodesData?.group}
            series={seasonEpisodesData?.series}
            season={seasonEpisodesData?.season}
            members={seasonEpisodesData?.members}
            onBack={handleBackFromSeasonEpisodes}
          />
        );
      case 'home':
      default:
        return <HomeScreen onSettings={handleSettings} onCreateGroup={handleCreateGroup} onGroupCreated={handleGroupCreatedCallback} onGroupDetail={handleGroupDetail} onAddSeries={handleAddSeries} onSeasonEpisodes={handleSeasonEpisodes} />;
    }
  };

  return renderCurrentScreen();
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
