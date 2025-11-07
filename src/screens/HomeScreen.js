import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../components/Skeleton';
import { apiService } from '../services/api.service';
import socketService from '../services/socket.service';




const HomeScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user, getAuthHeaders, authenticatedRequest } = useAuth();
  const { success, error, info } = useToast();
  const styles = createComponentStyles(isDarkMode);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' o 'series'
  const [userGroups, setUserGroups] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userStats, setUserStats] = useState({
    seriesWatching: 0,
    episodesWatched: 0,
    hoursWatched: 0,
    groupsJoined: 0,
  });
  const [userSeries, setUserSeries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [nextEpisodes, setNextEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Obtener nombre completo del usuario
  const fullName = user ? `${user.name} ${user.lastname}` : 'Usuario';

  const mockRecentActivity = [];

  // Conexión al room de usuario al abrir la app
  useEffect(() => {
    if (user && user.id) {
      const headers = getAuthHeaders();
      // Verificar si el socket está conectado y cambiar al room de usuario si es necesario
      if (!socketService.getConnectionStatus()) {
        socketService.connect('user_' + user.id, headers['Authorization']);
      } else {
        // Si ya está conectado, cambiar al room de usuario
        socketService.changeRoom('user_' + user.id);
      }
    }
  }, [user]);

  // Escuchar evento updated-number-series y actualizar el número de series del grupo correspondiente
  useEffect(() => {
    const handleUpdatedNumberSeries = (data) => {
      if (!data || !data.groupId) return;
      setUserGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === data.groupId
            ? { ...group, series_count: data.seriesCount }
            : group
        )
      );
    };
    socketService.on('updated-number-series', handleUpdatedNumberSeries);
    return () => {
      socketService.off('updated-number-series', handleUpdatedNumberSeries);
    };
  }, []);

  // Función para obtener los grupos del usuario y próximos episodios
  const fetchUserGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      setIsLoadingEpisodes(true);
      const headers = getAuthHeaders();
      
      // Llamar a ambos endpoints en paralelo
      const [groupsResponse, episodesResponse] = await Promise.all([
        apiService.getUserGroups(headers),
        apiService.getUpcomingEpisodes(headers, { limit: 10 })
      ]);
      
      console.log('response getUserGroups', groupsResponse);
      console.log('response getUpcomingEpisodes', episodesResponse);
      
      // Procesar respuesta de próximos episodios
      if (episodesResponse.success) {
        const episodesData = episodesResponse.normalizedData || episodesResponse.data;
        if (episodesData && episodesData.episodes && Array.isArray(episodesData.episodes)) {
          setNextEpisodes(episodesData.episodes);
          console.log('✅ Próximos episodios cargados:', episodesData.episodes.length);
        } else {
          setNextEpisodes([]);
          console.log('ℹ️ No hay próximos episodios disponibles');
        }
      } else {
        console.error('Error al obtener próximos episodios:', episodesResponse.message);
        setNextEpisodes([]);
      }
      
      // Procesar respuesta de grupos
      const response = groupsResponse;
      
      if (response.success && response.normalizedData && response.normalizedData.groups) {
        const groupsData = response.normalizedData.groups;
        
        if (Array.isArray(groupsData)) {
          
          // Validar cada grupo antes de procesarlo
          const validGroups = groupsData.filter(group => {
            if (!group || typeof group !== 'object') {
              console.error('Grupo inválido encontrado:', group);
              return false;
            }
            return true;
          });
          
          console.log('Grupos válidos:', validGroups.length);
          setUserGroups(validGroups);
          
          // Extraer actividad reciente de todos los grupos
          const allActivity = [];
          validGroups.forEach((group, index) => {
            if (group && typeof group === 'object' && group.recent_activity && Array.isArray(group.recent_activity)) {
              // Validar cada actividad antes de procesarla
              const validActivities = group.recent_activity.filter(activity => {
                if (!activity || typeof activity !== 'object') {
                  console.error('Actividad inválida encontrada:', activity);
                  return false;
                }
                return true;
              });
              
              console.log(`Grupo ${index} tiene ${validActivities.length} actividades válidas`);
              
              // Validar que el grupo tenga las propiedades necesarias
              const safeGroup = {
                id: group.id || `group-${index}`,
                name: group.name || 'Grupo sin nombre',
                recent_activity: validActivities || []
              };
              
              safeGroup.recent_activity.forEach((activity, activityIndex) => {
                if (activity && typeof activity === 'object' && !Array.isArray(activity)) {
                  try {
                    allActivity.push({
                      ...activity,
                      groupId: safeGroup.id,
                      groupName: safeGroup.name
                    });
                  } catch (spreadError) {
                    console.error('Error al hacer spread de actividad:', spreadError, activity);
                    // Añadir actividad básica sin spread
                    allActivity.push({
                      type: 'unknown',
                      groupId: safeGroup.id,
                      groupName: safeGroup.name,
                      created_at: new Date().toISOString()
                    });
                  }
                } else {
                  // Si no es un objeto válido, añade una actividad básica
                  allActivity.push({
                    type: 'unknown',
                    groupId: safeGroup.id,
                    groupName: safeGroup.name,
                    created_at: new Date().toISOString()
                  });
                }
              });
            }
          });
          
          
          // Ordenar actividad por fecha más reciente
          allActivity.sort((a, b) => {
            if (!a.created_at || !b.created_at) return 0;
            return new Date(b.created_at) - new Date(a.created_at);
          });
          
          setRecentActivity(allActivity);
        } else {
          console.error('Error al obtener grupos: formato de datos incorrecto', groupsData);
          error('Error', 'Formato de datos incorrecto');
          // Usar datos simulados como fallback
          
          setRecentActivity(mockRecentActivity);
        }
      } else {
        console.error('Error al obtener grupos:', response.error);
        error('Error', 'No se pudieron cargar tus grupos');
        // Usar datos simulados como fallback
        
        setRecentActivity(mockRecentActivity);
      }
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      error('Error', 'No se pudieron cargar tus grupos');
      // Usar datos simulados como fallback
      
      setRecentActivity(mockRecentActivity);
      setNextEpisodes([]);
    } finally {
      setIsLoadingGroups(false);
      setIsLoadingEpisodes(false);
    }
  }, [getAuthHeaders, error]);

  // Cargar grupos del usuario
  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  const handleJoinGroup = () => {
    info('Unirse a grupo', 'Funcionalidad en desarrollo');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleSeriesPress = (series) => {
    info('Serie seleccionada', `Has seleccionado ${series.name}`);
  };

  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetail', { group });
  };

  const handleActivityPress = (activity) => {
    info('Actividad', `Actividad en ${activity.series_name || activity.series}`);
  };

  const renderActivityItem = (activity) => {
    let icon, title, subtitle;
    
    // Validar que activity sea un objeto válido
    if (!activity || typeof activity !== 'object') {
      console.error('Actividad inválida:', activity);
      return null;
    }
    console.log('🔍 Activity type:', activity.type);
    switch (activity.type) {

      case 'episode_watched':
        icon = <Ionicons name="play-circle" size={20} color={colors.success[500]} />;
        title = `${activity.name || 'Usuario'} vio ${activity.episode_name || 'un episodio'}`;
        subtitle = `${activity.series_name || 'Serie'} • ${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'series_completed':
        icon = <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />;
        title = `${activity.name || 'Usuario'} completó ${activity.series_name || 'una serie'}`;
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'series_started':
        icon = <Ionicons name="play" size={20} color={colors.primary[500]} />;
        title = `${activity.name || 'Usuario'} comenzó ${activity.series_name || 'una serie'}`;
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'comment_added':
        icon = <Ionicons name="chatbubble" size={20} color={colors.warning[500]} />;
        title = `${activity.name || 'Usuario'} comentó en ${activity.series_name || 'una serie'}`;
        subtitle = `"${activity.comment || 'Comentario'}" • ${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'user_joined':
        icon = <Ionicons name="person-add" size={20} color={colors.info[500]} />;
        title = `${activity.name || 'Usuario'} se unió al grupo`;
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'user_left':
        icon = <Ionicons name="person-remove" size={20} color={colors.error[500]} />;
        title = `${activity.name || 'Usuario'} abandonó el grupo`;
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'group_created':
        icon = <Ionicons name="add-circle" size={20} color={colors.success[500]} />;
        title = `${activity.name || 'Usuario'} creó el grupo`;
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      case 'series_added':
        icon = <Ionicons name="add-circle" size={20} color={colors.success[500]} />;
        title = `${activity.name || 'Usuario'} añadió ${activity.series_name || 'una serie'}`;
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
        break;
      default:
        icon = <Ionicons name="ellipse" size={20} color={colors.info[500]} />;
        title = "Actividad";
        subtitle = `${formatTimeAgo(activity.created_at)} • ${activity.groupName || 'Grupo'}`;
    }

    return (
      <View
        style={[styles.listItem, {
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 8,
          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
          borderRadius: 12,
        }]}
      >
        <View style={{ marginRight: 12 }}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{title}</Text>
          <Text style={styles.listItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  // Función para formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    if (!dateString) {
      return 'recientemente';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'recientemente';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffDay > 0) {
        return diffDay === 1 ? '1d' : `${diffDay}d`;
      } else if (diffHour > 0) {
        return diffHour === 1 ? '1h' : `${diffHour}h`;
      } else if (diffMin > 0) {
        return diffMin === 1 ? '1m' : `${diffMin}m`;
      } else {
        return 'ahora';
      }
    } catch (error) {
      console.error('Error al formatear fecha:', error, dateString);
      return 'recientemente';
    }
  };

  // Mover fetchDashboard fuera del useEffect para poder llamarlo desde onRefresh
  const fetchDashboard = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      console.log(isInitial ? 'Cargando datos iniciales...' : 'Refrescando datos...');
      const headers = getAuthHeaders();
      const response = await apiService.get('/api/v1/users/dashboard', headers);
      console.log('Respuesta del endpoint:', response);
      if (response.success && response.data) {
        const stats = response.data.stats || response.data.data?.stats || {};
        setUserStats({
          seriesWatching: Number(stats.seriesWatching) || 0,
          episodesWatched: Number(stats.episodesWatched) || 0,
          hoursWatched: Number(stats.hoursWatched) || 0,
          groupsJoined: Number(stats.groupsJoined) || 0,
        });
        const series = response.data.series || response.data.data?.series || [];
        setUserSeries(series);
        const groups = response.data.groups || response.data.data?.groups || [];
        setUserGroups(groups);
        if (!isInitial) success('¡Actualizado!', 'Datos actualizados correctamente');
        console.log('Nuevos datos series:', series);
        console.log('Nuevos datos grupos:', groups);
      } else {
        setUserStats({ seriesWatching: 0, episodesWatched: 0, hoursWatched: 0, groupsJoined: 0 });
        setUserSeries([]);
        setUserGroups([]);
      }
    } catch (err) {
      setUserStats({ seriesWatching: 0, episodesWatched: 0, hoursWatched: 0, groupsJoined: 0 });
      setUserSeries([]);
      setUserGroups([]);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [getAuthHeaders, success]);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserGroups();
    fetchDashboard(false).finally(() => setRefreshing(false));
    console.log('Refrescando datos...');
    
  }, [fetchDashboard]);

  // Skeleton para grupos
  const GroupsSkeleton = () => (
    <>
      {[1, 2, 3].map((_, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={'60%'} height={16} borderRadius={8} style={{ marginBottom: 8 }} />
            <Skeleton width={'40%'} height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </>
  );
  // Skeleton para series
  const SeriesSkeleton = () => (
    <>
      {[1, 2, 3].map((_, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={60} height={60} borderRadius={8} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={'70%'} height={16} borderRadius={8} style={{ marginBottom: 8 }} />
            <Skeleton width={'50%'} height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        
        {/* Header Skeleton */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View>
              <Skeleton width={120} height={18} style={{ marginBottom: 4 }} />
              <Skeleton width={80} height={14} />
            </View>
          </View>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>

        {/* Tabs Skeleton */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ 
            flex: 1, 
            alignItems: 'center', 
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'groups' ? colors.primary[500] : 'transparent',
          }}>
            <Skeleton width={60} height={16} />
          </View>
          <View style={{ 
            flex: 1, 
            alignItems: 'center', 
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'series' ? colors.primary[500] : 'transparent',
          }}>
            <Skeleton width={60} height={16} />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {activeTab === 'groups' ? (
            <>
              {/* Sección de título de grupos */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Skeleton width={120} height={18} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Skeleton width={60} height={28} borderRadius={8} />
                  <Skeleton width={60} height={28} borderRadius={8} />
                </View>
              </View>

              {/* Tarjetas de grupos horizontales */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ marginBottom: 24 }}
              >
                {[1, 2, 3].map((_, index) => (
                  <View 
                    key={index}
                    style={{
                      width: 160,
                      height: 140,
                      marginRight: 12,
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                  >
                    <Skeleton width={160} height={140} borderRadius={16} />
                  </View>
                ))}
              </ScrollView>

              {/* Título de actividad reciente */}
              <Skeleton width={140} height={18} style={{ marginBottom: 16 }} />

              {/* Items de actividad */}
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Skeleton 
                    width="100%" 
                    height={70} 
                    borderRadius={12} 
                    style={{ marginBottom: 8 }} 
                  />
                </View>
              ))}

              {/* Título de próximos episodios */}
              <Skeleton width={160} height={18} style={{ marginTop: 24, marginBottom: 16 }} />

              {/* Próximos episodios */}
              {[1, 2].map((_, index) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Skeleton 
                    width="100%" 
                    height={60} 
                    borderRadius={12} 
                    style={{ marginBottom: 8 }} 
                  />
                </View>
              ))}
            </>
          ) : (
            <>
              {/* Estadísticas del usuario */}
              <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 24 }} />
              
              {/* Título de tus series */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Skeleton width={100} height={18} />
                <Skeleton width={60} height={28} borderRadius={8} />
              </View>
              
              {/* Lista de series */}
              {[1, 2, 3, 4].map((_, index) => (
                <View key={index} style={{ marginBottom: 12 }}>
                  <Skeleton 
                    width="100%" 
                    height={100} 
                    borderRadius={12} 
                    style={{ marginBottom: 8 }} 
                  />
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Header fijo */}
      <View style={{ paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary[500],
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="person" size={20} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>{fullName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={20} color={isDarkMode ? colors.dark.text : colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Tabs de navegación */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginBottom: 16,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'groups' ? colors.primary[500] : 'transparent',
            }}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={{
              fontWeight: '600',
              color: activeTab === 'groups' ? colors.primary[500] : isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
            }}>
              {t('groups')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'series' ? colors.primary[500] : 'transparent',
            }}
            onPress={() => setActiveTab('series')}
          >
            <Text style={{
              fontWeight: '600',
              color: activeTab === 'series' ? colors.primary[500] : isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
            }}>
              {t('series')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* ScrollView solo para la zona de pestañas */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0ea5e9']}
            tintColor={'#0ea5e9'}
          />
        }
      >
        {/* Mostrar skeleton solo en la primera carga, nunca durante el refresco manual */}
        {isLoading && (!userSeries.length && !userGroups.length) ? (
          activeTab === 'groups' ? <GroupsSkeleton /> : <SeriesSkeleton />
        ) : activeTab === 'groups' ? (
          <>
              {/* Grupos del usuario */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('yourGroups')}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={handleJoinGroup} style={[styles.buttonSmall, { backgroundColor: colors.primary[500] }]}>
                    <Ionicons name="add" size={16} color="white" />
                    <Text style={[styles.buttonSmallText, { color: 'white' }]}>{t('join')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCreateGroup} style={[styles.buttonSmall, { backgroundColor: colors.success[500] }]}>
                    <Ionicons name="create" size={16} color="white" />
                    <Text style={[styles.buttonSmallText, { color: 'white' }]}>{t('create')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tarjetas de grupos */}
              {isLoadingGroups ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={{ marginBottom: 24 }}
                >
                  {[1, 2, 3].map((_, index) => (
                    <View 
                      key={index}
                      style={{
                        width: 160,
                        height: 140,
                        marginRight: 12,
                        borderRadius: 16,
                        overflow: 'hidden',
                      }}
                    >
                      <Skeleton width={160} height={140} borderRadius={16} />
                    </View>
                  ))}
                </ScrollView>
              ) : userGroups.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={{ marginBottom: 24 }}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {userGroups
                    .filter(group => group && typeof group === 'object' && group.id)
                    .map(group => (
                      <TouchableOpacity 
                        key={group.id}
                        onPress={() => handleGroupPress(group)}
                        style={{
                          width: 160,
                          marginRight: 12,
                          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                          borderRadius: 16,
                          padding: 16,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <View style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: group.is_admin ? colors.success[500] : colors.primary[500],
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}>
                          <Ionicons 
                            name={group.is_admin ? "shield" : "people"} 
                            size={24} 
                            color="white" 
                          />
                        </View>
                        <Text style={[styles.listItemTitle, { marginBottom: 4 }]}>{group.name || 'Grupo sin nombre'}</Text>
                        <Text style={styles.listItemSubtitle}>{group.member_count || 0} {t('members')}</Text>
                        <Text style={styles.listItemSubtitle}>{group.series_count || 0} {t('series')}</Text>
                      </TouchableOpacity>
                    ))}
                  
                  {/* Añadir grupo */}
                  <TouchableOpacity 
                    onPress={handleCreateGroup}
                    style={{
                      width: 160,
                      marginRight: 12,
                      backgroundColor: 'transparent',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons 
                      name="add-circle" 
                      size={32} 
                      color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={[styles.listItemSubtitle, { textAlign: 'center' }]}>
                      {t('createNewGroup')}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <View style={{ 
                  backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                  marginBottom: 24
                }}>
                  <Ionicons 
                    name="people-outline" 
                    size={48} 
                    color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={[styles.listItemTitle, { marginBottom: 8, textAlign: 'center' }]}>
                    {t('noGroups')}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { textAlign: 'center', marginBottom: 16 }]}>
                    {t('noGroupsSubtitle')}
                  </Text>
                  <TouchableOpacity 
                    onPress={handleCreateGroup}
                    style={[styles.button, { paddingHorizontal: 16, paddingVertical: 8 }]}
                  >
                    <Text style={styles.buttonText}>{t('createGroup')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Actividad reciente */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
              </View>
              
              {isLoadingGroups ? (
                // Skeleton para actividad reciente
                [1, 2, 3].map((_, index) => (
                  <View key={index} style={{ marginBottom: 8 }}>
                    <Skeleton 
                      width="100%" 
                      height={70} 
                      borderRadius={12} 
                    />
                  </View>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity
                  .filter(a => a && typeof a === 'object' && !Array.isArray(a))
                  .map((activity, index) => (
                    <View key={`${activity.type}-${activity.series_name || activity.series || activity.id || index}`}>
                      {renderActivityItem(activity)}
                    </View>
                  ))
              ) : (
                <View style={{ 
                  backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}>
                  <Text style={[styles.listItemSubtitle, { textAlign: 'center' }]}>
                    No hay actividad reciente
                  </Text>
                </View>
              )}

              {/* Próximos episodios */}
              <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>{t('upcomingEpisodes')}</Text>
              </View>
              
              {isLoadingEpisodes ? (
                [1, 2, 3].map((_, index) => (
                  <View key={index} style={{ marginBottom: 8 }}>
                    <Skeleton 
                      width="100%" 
                      height={70} 
                      borderRadius={12} 
                    />
                  </View>
                ))
              ) : nextEpisodes.length > 0 ? (
                nextEpisodes
                  .filter(episode => episode && typeof episode === 'object' && episode.id)
                  .map((episode) => (
                    <TouchableOpacity 
                      key={episode.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 8,
                      }}
                    >
                      {episode.still_path ? (
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w200${episode.still_path}` }}
                          style={{
                            width: 60,
                            height: 40,
                            borderRadius: 8,
                            marginRight: 12,
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{
                          width: 60,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Text style={{ fontSize: 20 }}>📺</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemTitle}>
                          {episode.series?.name || episode.series || 'Serie'}
                        </Text>
                        <Text style={styles.listItemSubtitle}>
                          S{episode.season_number || 0}E{episode.episode_number || 0} - {episode.name || 'Episodio'}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.listItemSubtitle, { color: colors.primary[500], fontWeight: '600' }]}>
                          {episode.air_date ? new Date(episode.air_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : (episode.days_until_air ? `En ${episode.days_until_air} días` : 'Próximamente')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
              ) : (
                <View style={{ 
                  backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}>
                  <Text style={[styles.listItemSubtitle, { textAlign: 'center' }]}>
                    No hay próximos episodios
                  </Text>
                </View>
              )}
            </>
        ) : (
          <>
              {/* Estadísticas reales mejoradas visualmente */}
              <View style={[styles.card, { marginBottom: 20, paddingVertical: 24 }]}> 
                <Text style={[styles.sectionTitle, { marginBottom: 18, fontSize: 20 }]}>{t('yourStats')}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Series Watching */}
                  <View style={{
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: isDarkMode ? 'rgba(0,180,255,0.08)' : 'rgba(0,180,255,0.08)',
                    marginHorizontal: 4,
                    borderRadius: 12,
                    paddingVertical: 12,
                    shadowColor: isDarkMode ? '#000' : '#222',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.10,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <Ionicons name="tv-outline" size={32} color={colors.primary[500]} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>{userStats.seriesWatching}</Text>
                  </View>
                  {/* Episodes Watched */}
                  <View style={{
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: isDarkMode ? 'rgba(0,200,100,0.08)' : 'rgba(0,200,100,0.08)',
                    marginHorizontal: 4,
                    borderRadius: 12,
                    paddingVertical: 12,
                    shadowColor: isDarkMode ? '#000' : '#222',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.10,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <Ionicons name="play-outline" size={32} color={colors.success[500]} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>{userStats.episodesWatched}</Text>
                  </View>
                  {/* Hours Watched */}
                  <View style={{
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: isDarkMode ? 'rgba(255,180,0,0.08)' : 'rgba(255,180,0,0.08)',
                    marginHorizontal: 4,
                    borderRadius: 12,
                    paddingVertical: 12,
                    shadowColor: isDarkMode ? '#000' : '#222',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.10,
                    shadowRadius: 8,
                    elevation: 2,
                  }}>
                    <Ionicons name="time-outline" size={32} color={colors.warning[500]} style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>{userStats.hoursWatched}</Text>
                  </View>
                </View>
              </View>
              {/* Lista de series reales */}
              <View style={[styles.card, { marginBottom: 20 }]}> 
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>{t('yourSeries')}</Text>
                {isLoading ? (
                  <ActivityIndicator size="large" color={colors.primary[500]} />
                ) : userSeries.length === 0 ? (
                  <Text style={[styles.textSecondary, { textAlign: 'center', fontStyle: 'italic' }]}>No tienes series aún</Text>
                ) : (
                  <FlatList
                    data={userSeries}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => {
                      // Asegura que los valores sean numéricos
                      const watched = Number(item.watched_episodes) || 0;
                      const total = Number(item.total_episodes) || 0;
                      const progress = Number(item.progress) || 0;
                      return (
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 18,
                            shadowColor: isDarkMode ? '#000' : '#222',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.10,
                            shadowRadius: 8,
                            elevation: 3,
                          }}
                          onPress={() => handleSeriesPress(item)}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: item.poster_url }}
                            style={{ width: 80, height: 120, borderRadius: 12, marginRight: 18, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={[styles.cardTitle, { fontSize: 17, fontWeight: '700', marginBottom: 4 }]} numberOfLines={2}>{item.name}</Text>
                            <Text style={[styles.textSecondary, { fontSize: 13, marginBottom: 2 }]}>{watched} / {total}</Text>
                            <Text style={[styles.textSecondary, { fontSize: 13, marginBottom: 2 }]}>{t('lastEpisode')}: {item.last_episode}</Text>
                            {/* Barra de progreso visual elegante */}
                            <View style={{ height: 10, backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface, borderRadius: 5, marginTop: 10, overflow: 'hidden', width: '100%' }}>
                              <View 
                                style={{ 
                                  height: '100%', 
                                  width: `${progress}%`, 
                                  backgroundColor: progress === 100 ? colors.success[500] : colors.primary[500],
                                  borderRadius: 5,
                                  transition: 'width 0.3s',
                                }} 
                              />
                            </View>
                            <Text style={{ color: progress === 100 ? colors.success[500] : colors.primary[500], fontWeight: '600', fontSize: 13, marginTop: 4, textAlign: 'right' }}>{progress}%</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={isLoading ? (
                      // Skeletons bonitos mientras carga
                      <>
                        {[1,2,3].map(idx => (
                          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, borderRadius: 16, padding: 16, marginBottom: 18 }}>
                            <Skeleton width={80} height={120} borderRadius={12} style={{ marginRight: 18 }} />
                            <View style={{ flex: 1 }}>
                              <Skeleton width={120} height={18} borderRadius={8} style={{ marginBottom: 8 }} />
                              <Skeleton width={80} height={14} borderRadius={8} style={{ marginBottom: 6 }} />
                              <Skeleton width={100} height={14} borderRadius={8} style={{ marginBottom: 6 }} />
                              <Skeleton width={160} height={10} borderRadius={5} style={{ marginTop: 10 }} />
                            </View>
                          </View>
                        ))}
                      </>
                    ) : (
                      <Text style={[styles.textSecondary, { textAlign: 'center', fontStyle: 'italic' }]}>No tienes series aún</Text>
                    )}
                  />
                )}
              </View>
            </>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen; 