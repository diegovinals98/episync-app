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

// Datos simulados como fallback
const mockUserGroups = [
  { 
    id: 1, 
    name: 'Familia Viñals', 
    member_count: 4, 
    series_count: 3,
    is_admin: true,
    recent_activity: [
      { type: 'episode_watched', user_id: 2, username: 'mariavinals', name: 'María', series_name: 'The Crown', episode_name: 'S04E02', created_at: new Date(Date.now() - 7200000).toISOString() },
      { type: 'series_completed', user_id: 3, username: 'papavinals', name: 'Papá', series_name: 'Breaking Bad', created_at: new Date(Date.now() - 86400000).toISOString() }
    ]
  },
  { 
    id: 2, 
    name: 'Amigos Series', 
    member_count: 8, 
    series_count: 5,
    is_admin: false,
    recent_activity: [
      { type: 'episode_watched', user_id: 5, username: 'carlos', name: 'Carlos', series_name: 'Stranger Things', episode_name: 'S04E08', created_at: new Date(Date.now() - 18000000).toISOString() },
      { type: 'comment', user_id: 6, username: 'laura', name: 'Laura', series_name: 'Game of Thrones', comment: '¡No puedo creer ese final!', created_at: new Date(Date.now() - 43200000).toISOString() }
    ]
  },
  { 
    id: 3, 
    name: 'Roommates', 
    member_count: 3, 
    series_count: 2,
    is_admin: true,
    recent_activity: [
      { type: 'series_started', user_id: 7, username: 'alex', name: 'Alex', series_name: 'The Boys', created_at: new Date(Date.now() - 10800000).toISOString() }
    ]
  },
];

// Actividad reciente simulada como fallback
const mockRecentActivity = mockUserGroups.flatMap(group => 
  (group.recent_activity || []).map(activity => ({
    ...activity,
    groupId: group.id,
    groupName: group.name
  }))
).sort((a, b) => {
  if (!a.created_at || !b.created_at) return 0;
  return new Date(b.created_at) - new Date(a.created_at);
});

// Datos simulados para series y próximos episodios
const popularSeries = [
  { id: 1, name: 'Breaking Bad', episodes: 62, image: '🎭', lastEpisode: 'S05E16', progress: 100 },
  { id: 2, name: 'Game of Thrones', episodes: 73, image: '⚔️', lastEpisode: 'S06E02', progress: 65 },
  { id: 3, name: 'Stranger Things', episodes: 34, image: '👻', lastEpisode: 'S04E09', progress: 100 },
  { id: 4, name: 'The Crown', episodes: 60, image: '👑', lastEpisode: 'S03E01', progress: 45 },
];

// Próximos episodios
const upcomingEpisodes = [
  { id: 1, series: 'House of the Dragon', episode: 'S02E05', date: 'Hoy, 22:00', image: '🐉' },
  { id: 2, series: 'The Boys', episode: 'S04E06', date: 'Mañana, 21:00', image: '💥' },
  { id: 3, series: 'Fallout', episode: 'S01E09', date: '15 Jul, 22:00', image: '☢️' },
];

const HomeScreen = ({ onSettings, onCreateGroup, onGroupCreated, onGroupDetail, onAddSeries }) => {
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

  // Obtener nombre completo del usuario
  const fullName = user ? `${user.name} ${user.lastname}` : 'Usuario';

  // Datos simulados para estadísticas del usuario
  const userStats = {
    seriesWatching: 8,
    episodesWatched: 156,
    hoursWatched: 78,
    groupsJoined: userGroups.length,
  };

  // Función para obtener los grupos del usuario
  const fetchUserGroups = useCallback(async () => {
    try {
      setIsLoadingGroups(true);
      const headers = getAuthHeaders();
      const response = await apiService.getUserGroups(headers);
      console.log('response getUserGroups', response);
      
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
          setUserGroups(mockUserGroups);
          setRecentActivity(mockRecentActivity);
        }
      } else {
        console.error('Error al obtener grupos:', response.error);
        error('Error', 'No se pudieron cargar tus grupos');
        // Usar datos simulados como fallback
        setUserGroups(mockUserGroups);
        setRecentActivity(mockRecentActivity);
      }
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      error('Error', 'No se pudieron cargar tus grupos');
      // Usar datos simulados como fallback
      setUserGroups(mockUserGroups);
      setRecentActivity(mockRecentActivity);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [getAuthHeaders, error]);

  // Cargar grupos del usuario
  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  // Exponer la función de refrescar grupos
  useEffect(() => {
    if (onGroupCreated) {
      onGroupCreated(fetchUserGroups);
    }
  }, []); // Solo ejecutar una vez al montar el componente

  const handleJoinGroup = () => {
    info('Unirse a grupo', 'Funcionalidad en desarrollo');
  };

  const handleCreateGroup = () => {
    if (onCreateGroup) {
      onCreateGroup();
    } else {
      info('Crear grupo', 'Funcionalidad en desarrollo');
    }
  };

  const handleSeriesPress = (series) => {
    info('Serie seleccionada', `Has seleccionado ${series.name}`);
  };

  const handleGroupPress = (group) => {
    // Navegar a la pantalla de detalles del grupo
    if (onGroupDetail && typeof onGroupDetail === 'function') {
      onGroupDetail('GroupDetail', { group });
    }
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
      case 'comment':
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
        <TouchableOpacity onPress={onSettings} style={styles.headerButton}>
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

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'groups' ? (
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
            
            {upcomingEpisodes
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
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 20 }}>{episode.image || '📺'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>{episode.series || 'Serie'}</Text>
                    <Text style={styles.listItemSubtitle}>{episode.episode || 'Episodio'}</Text>
                  </View>
                  <View>
                    <Text style={[styles.listItemSubtitle, { color: colors.primary[500], fontWeight: '600' }]}>
                      {episode.date || 'Próximamente'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </>
        ) : (
          <>
            {/* Estadísticas del usuario */}
            <View style={styles.cardCompact}>
              <Text style={styles.cardTitle}>{t('yourStats')}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, borderRadius: 12 }}>
                  <Ionicons name="tv-outline" size={24} color={colors.primary[500]} />
                  <Text style={[styles.headerTitle, { fontSize: 20, marginTop: 8 }]}>{userStats.seriesWatching}</Text>
                  <Text style={styles.textSecondary}>{t('series')}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, borderRadius: 12 }}>
                  <Ionicons name="play-outline" size={24} color={colors.success[500]} />
                  <Text style={[styles.headerTitle, { fontSize: 20, marginTop: 8 }]}>{userStats.episodesWatched}</Text>
                  <Text style={styles.textSecondary}>{t('episodes')}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, borderRadius: 12 }}>
                  <Ionicons name="time-outline" size={24} color={colors.warning[500]} />
                  <Text style={[styles.headerTitle, { fontSize: 20, marginTop: 8 }]}>{userStats.hoursWatched}h</Text>
                  <Text style={styles.textSecondary}>{t('hours')}</Text>
                </View>
              </View>
            </View>

            {/* Tus series */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('yourSeries')}</Text>
              <TouchableOpacity style={[styles.buttonSmall, { backgroundColor: colors.primary[500] }]}>
                <Ionicons name="add" size={16} color="white" />
                <Text style={[styles.buttonSmallText, { color: 'white' }]}>{t('add')}</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de series */}
            {popularSeries
              .filter(series => series && typeof series === 'object' && series.id)
              .map((series) => (
                <TouchableOpacity 
                  key={series.id}
                  onPress={() => handleSeriesPress(series)}
                  style={{
                    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ fontSize: 24 }}>{series.image || '📺'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listItemTitle}>{series.name || 'Serie'}</Text>
                      <Text style={styles.listItemSubtitle}>
                        {series.episodes || 0} {t('episodes')} • {t('lastWatched')}: {series.lastEpisode || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Barra de progreso */}
                  <View style={{ height: 4, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                    <View 
                      style={{ 
                        height: '100%', 
                        width: `${series.progress || 0}%`, 
                        backgroundColor: (series.progress || 0) === 100 ? colors.success[500] : colors.primary[500],
                        borderRadius: 2,
                      }} 
                    />
                  </View>
                  <Text style={[styles.listItemSubtitle, { marginTop: 8, textAlign: 'right' }]}>
                    {series.progress || 0}% {t('completed')}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen; 