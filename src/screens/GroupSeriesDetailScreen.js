import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import Skeleton from '../components/Skeleton';

const GroupSeriesDetailScreen = ({ navigation, route }) => {
  const { group, series, members } = route?.params || {};
  const { isDarkMode } = useTheme();
  const { user, accessToken } = useAuth();
  const { success, error, info } = useToast();
  const { t } = useLanguage();
  const styles = createComponentStyles(isDarkMode);

  const [seriesDetails, setSeriesDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [membersProgress, setMembersProgress] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Configurar el header de navegación con botón de eliminar
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        title: series?.name || t('series'),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={handleComments}
              style={{ marginRight: 16 }}
            >
              <Ionicons 
                name="chatbubble-outline" 
                size={24} 
                color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDeleteSeries}
              style={{ marginRight: 16 }}
            >
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color={colors.error[500]} 
              />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, series, isDarkMode, t]);

  // Función para manejar la eliminación de la serie
  const handleDeleteSeries = () => {
    Alert.alert(
      t('deleteSeries'),
      t('deleteSeriesConfirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            if (!group?.id || !series?.id) {
              error('Error', 'Faltan datos para eliminar la serie');
              return;
            }

            if (!socketService.getConnectionStatus()) {
              error('Error', 'No hay conexión con el servidor');
              return;
            }

            console.log('🗑️ Eliminando serie:', { groupId: group.id, seriesId: series.id });
            socketService.removeSeriesFromGroup(group.id, series.id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Función para manejar los comentarios
  const handleComments = () => {
    navigation.navigate('Comments', { group, series });
  };

  // Obtener progreso real de los miembros (solo la primera vez)
  useFocusEffect(
    React.useCallback(() => {
      const fetchMembersProgress = async () => {
        if (!group?.id || !series?.id) {
          setLoadingProgress(false);
          return;
        }

        // Solo cargar si no hay datos de progreso ya cargados
        if (membersProgress.length > 0) {
          console.log('📊 Progreso ya cargado, saltando llamada a API');
          setLoadingProgress(false);
          return;
        }

        try {
          setLoadingProgress(true);
          console.log('📊 Obteniendo progreso inicial de miembros...');
          console.log('🔍 token:', accessToken);
          
          const response = await apiService.getSeriesProgress(
            group.id, 
            series.id, 
            { 'Authorization': `Bearer ${accessToken}` }
          );
          
          console.log('📊 Respuesta de progreso:', response);
          
          // La respuesta tiene estructura anidada: response.data.data.members_progress
          let membersProgressData;
          if (response.data && response.data.data && response.data.data.members_progress) {
            membersProgressData = response.data.data.members_progress;
          } else if (response.data && response.data.members_progress) {
            membersProgressData = response.data.members_progress;
          } else if (response.normalizedData && response.normalizedData.members_progress) {
            membersProgressData = response.normalizedData.members_progress;
          }
          
          if (membersProgressData && membersProgressData.length > 0) {
            console.log('✅ Datos de progreso inicial obtenidos:', membersProgressData);
            setMembersProgress(membersProgressData);
          } else {
            console.log('⚠️ No hay datos de progreso disponibles');
            setMembersProgress([]);
          }
        } catch (error) {
          console.error('❌ Error obteniendo progreso:', error);
          setMembersProgress([]);
        } finally {
          setLoadingProgress(false);
        }
      };

      fetchMembersProgress();
    }, [group?.id, series?.id, accessToken, membersProgress.length])
  );

  // Configurar listeners de socket para eliminación de serie
  useEffect(() => {
    const handleSeriesDeleted = (data) => {
      console.log('🗑️ Serie eliminada (series-deleted recibido):', data);
      
      // Verificar que los datos correspondan a la serie actual
      let seriesId = data.data?.series_id || data.data?.seriesId || data.data?.id || data.series_id || data.seriesId;
      let groupId = data.data?.groupId || data.groupId;
      
      // Verificar si es la serie actual comparando con diferentes campos posibles
      const isCurrentSeries = 
        seriesId === series?.id || 
        seriesId === series?.series_id || 
        seriesId === series?.seriesId ||
        (data.data?.tmdb_id && data.data.tmdb_id === series?.tmdb_id);
      
      // Si es la serie actual, navegar de vuelta (no necesitamos verificar groupId porque estamos en el room de la serie)
      if (isCurrentSeries) {
        console.log('✅ Serie actual eliminada, navegando de vuelta');
        success('Serie eliminada', data.message || 'La serie ha sido eliminada del grupo');
        // Navegar de vuelta a la pantalla del grupo
        setTimeout(() => {
          console.log('🚀 Ejecutando navegación de vuelta...');
          navigation.goBack();
        }, 300);
      } else {
        console.log('ℹ️ Serie eliminada pero no es la actual, ignorando');
        console.log('📊 Comparación:', {
          groupId,
          currentGroupId: group?.id,
          seriesId,
          currentSeriesId: series?.id,
          currentSeriesSeriesId: series?.series_id,
          isCurrentSeries
        });
      }
    };

    const handleSeriesRemoved = (data) => {
      console.log('🗑️ Serie eliminada del grupo (evento recibido):', data);
      
      // Verificar que los datos correspondan a la serie actual
      if (data.groupId === group?.id && data.seriesId === series?.id) {
        console.log('✅ Serie actual eliminada, navegando de vuelta');
        success('Serie eliminada', data.message || 'La serie ha sido eliminada del grupo');
        // Navegar de vuelta a la pantalla del grupo
        setTimeout(() => {
          console.log('🚀 Ejecutando navegación de vuelta...');
          navigation.navigate('GroupDetail', { group });
        }, 300);
      } else {
        console.log('ℹ️ Serie eliminada pero no es la actual, ignorando');
      }
    };

    const handleSeriesRemovedError = (errorData) => {
      console.error('❌ Error al eliminar serie:', errorData);
      error('Error', errorData.message || 'No se pudo eliminar la serie');
    };

    socketService.on('series-deleted', handleSeriesDeleted);
    socketService.on('series-removed-from-group', handleSeriesRemoved);
    socketService.on('series-removed-error', handleSeriesRemovedError);

    return () => {
      socketService.off('series-deleted', handleSeriesDeleted);
      socketService.off('series-removed-from-group', handleSeriesRemoved);
      socketService.off('series-removed-error', handleSeriesRemovedError);
    };
  }, [group?.id, series?.id, series?.series_id, navigation, success, error, group]);

  // Configurar listeners de socket para actualización en tiempo real
  useEffect(() => {
    const handleSeriesProgressUpdated = (data) => {
      console.log('📊 Progreso de serie actualizado en tiempo real:', data);
      
      // Verificar que los datos correspondan a la serie actual
      if (data.groupId === group?.id && data.seriesId === series?.id) {
        console.log('✅ Actualizando progreso para la serie actual');
        
        // Extraer los datos de progreso de los miembros
        let membersProgressData;
        if (data.data && data.data.members_progress) {
          membersProgressData = data.data.members_progress;
        } else if (data.members_progress) {
          membersProgressData = data.members_progress;
        }
        
        if (membersProgressData && membersProgressData.length > 0) {
          console.log('✅ Actualizando progreso de miembros:', membersProgressData);
          setMembersProgress(membersProgressData);
        } else {
          console.log('⚠️ No hay datos de progreso en la actualización');
        }
      } else {
        console.log('ℹ️ Actualización de progreso para otra serie/grupo, ignorando');
      }
    };

    // Registrar listener
    socketService.on('series-progress-updated', handleSeriesProgressUpdated);

    // Cleanup listener
    return () => {
      socketService.off('series-progress-updated', handleSeriesProgressUpdated);
    };
  }, [group?.id, series?.id]);

  // Ordenar miembros por progreso (más avanzado primero)
  const sortedMembers = [...membersProgress].sort((a, b) => {
    if (b.highest_season !== a.highest_season) return b.highest_season - a.highest_season;
    return b.highest_episode - a.highest_episode;
  });

  // Generar room ID: groupId+tmdb_id
  const roomId = `${group?.id}+${series?.tmdb_id}`;

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      console.log('🔍 Series id:', series.id);
      console.log('🔍 Series tmdb_id:', series.tmdb_id);
      
      if (!series.tmdb_id) {
        console.error('❌ No tmdb_id available for series:', series);
        setLoading(false);
        return;
      }
      
      const response = await apiService.getTMDBSeriesDetails(series.tmdb_id);
      
      if (response.success && response.data) {
        setSeriesDetails(response.data);
      } else {
        console.error('❌ Failed to fetch series details:', response.message);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [series]);

  // Conectar al room específico de la serie cuando se cargan los detalles
  useEffect(() => {
    const connectToSeriesRoom = async () => {
      if (!group?.id || !series?.tmdb_id) {
        console.log('❌ Faltan datos para conectar al room de la serie');
        console.log('📊 Datos disponibles:', {
          groupId: group?.id,
          tmdbId: series?.tmdb_id
        });
        return;
      }

      try {
        console.log('🚪 Uniéndose al room de la serie:', roomId);
        socketService.joinRoom(roomId);
        setSocketConnected(true);
        //success('Conectado', `Sincronización activa para ${series.name}`);
        console.log('✅ Unido exitosamente al room de la serie');
      } catch (error) {
        console.error('❌ Error uniéndose al room de la serie:', error);
        setSocketConnected(false);
        error('Error de conexión', 'No se pudo unir al room de sincronización');
      }
    };

    if (seriesDetails && !loading) {
      connectToSeriesRoom();
    }

    // Cleanup al desmontar
    return () => {
      if (socketConnected) {
        console.log('🚪 Saliendo del room de la serie al salir');
        socketService.leaveRoom();
        setSocketConnected(false);
      }
    };
  }, [seriesDetails, loading, group?.id, series?.tmdb_id, accessToken, roomId]);

  const handleSeasonPress = (season) => {
    navigation.navigate('SeasonEpisodes', { group, series, season, members });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      socketService.leaveRoom();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.background : colors.light.background }]}> 
      {/* Info de la serie fija arriba */}
      {seriesDetails ? (
        <View style={[styles.card, { marginBottom: 20, alignItems: 'center' }]}> 
          {seriesDetails.poster_path && (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w300${seriesDetails.poster_path}` }}
              style={{ width: 120, height: 180, borderRadius: 12, marginBottom: 12 }}
              resizeMode="cover"
            />
          )}
          <Text style={[styles.cardTitle, { fontSize: 20, marginBottom: 8, textAlign: 'center' }]}>{seriesDetails.name}</Text>
          <Text style={[styles.textSecondary, { textAlign: 'center' }]} numberOfLines={4}>{seriesDetails.overview}</Text>
        </View>
      ) : (
        <View style={[styles.card, { marginBottom: 20, alignItems: 'center' }]}> 
          <Skeleton width={120} height={180} borderRadius={12} style={{ marginBottom: 12 }} />
          <Skeleton width={150} height={20} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width={220} height={14} borderRadius={8} style={{ marginBottom: 4 }} />
          <Skeleton width={180} height={14} borderRadius={8} />
        </View>
      )}

      {/* Scroll solo para progreso y temporadas */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}> 
        {/* Miembros y progreso */}
        <View style={[styles.card, { marginBottom: 20 }]}> 
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Progreso de miembros</Text>
          {loadingProgress ? (
            // Skeletons mientras carga
            [1, 2, 3].map((_, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Skeleton width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />
                <Skeleton width={120} height={16} borderRadius={8} style={{ flex: 1 }} />
                <Skeleton width={60} height={24} borderRadius={8} style={{ marginLeft: 8 }} />
              </View>
            ))
          ) : sortedMembers.length > 0 ? (
            sortedMembers.map(member => (
              <View key={member.user_id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary[500],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="person" size={20} color="white" />
                </View>
                <Text style={[styles.listItemTitle, { flex: 1 }]}>{member.full_name || member.username}</Text>
                <View style={{
                  backgroundColor: colors.primary[100],
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}>
                  <Text style={{ color: colors.primary[700], fontWeight: '600', fontSize: 13 }}>
                    T{member.highest_season} · E{member.highest_episode}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.textSecondary, { textAlign: 'center', fontStyle: 'italic' }]}>No hay progreso registrado aún</Text>
          )}
        </View>

        {/* Temporadas en grid de 2 columnas */}
        <View style={[styles.card, { marginBottom: 20 }]}> 
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Temporadas</Text>
          {loading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[1,2,3,4].map((_, idx) => (
                <View key={idx} style={{ width: '48%', marginBottom: 16, alignItems: 'center' }}>
                  <Skeleton width={120} height={180} borderRadius={12} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={16} borderRadius={8} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={(seriesDetails?.seasons || []).filter(season => season.name !== 'Specials')}
              keyExtractor={item => item.season_number.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              renderItem={({ item: season }) => (
                <TouchableOpacity
                  onPress={() => handleSeasonPress(season)}
                  style={{ width: '48%', marginBottom: 16, alignItems: 'center' }}
                >
                  <View style={{
                    width: 120,
                    height: 180,
                    borderRadius: 12,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDarkMode ? colors.dark.border : colors.light.border,
                    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  }}>
                    {season.poster_path ? (
                      <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w300${season.poster_path}` }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      }}>
                        <Ionicons name="tv-outline" size={40} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
                      </View>
                    )}
                  </View>
                  <Text style={{
                    color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary,
                    fontWeight: '600',
                    fontSize: 14,
                    marginTop: 8,
                    textAlign: 'center',
                  }}>
                    {season.name}
                  </Text>
                  <Text style={{
                    color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                    textAlign: 'center',
                  }}>
                    {season.episode_count} episodios
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.textSecondary, { textAlign: 'center', fontStyle: 'italic' }]}>No hay temporadas</Text>}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default GroupSeriesDetailScreen; 