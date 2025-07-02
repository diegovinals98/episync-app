import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import Skeleton from '../components/Skeleton';

const SeasonEpisodesScreen = ({ onBack, group, series, season, members }) => {
  const { isDarkMode } = useTheme();
  const { user, accessToken } = useAuth();
  const { success, error } = useToast();
  const styles = createComponentStyles(isDarkMode);

  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [watchedEpisodes, setWatchedEpisodes] = useState(new Set());
  const [loadingWatched, setLoadingWatched] = useState(true);
  const [episodeWatchedState, setEpisodeWatchedState] = useState({});

  // MOCK: Asigna un progreso ficticio a cada miembro real
  const membersWithProgress = (members || []).map((m, i) => ({
    ...m,
    episodesWatched: Math.floor(Math.random() * (seasonEpisodes.length || 24)) + 1,
  }));

  // Ordenar miembros por progreso en esta temporada
  const sortedMembers = [...membersWithProgress].sort((a, b) => b.episodesWatched - a.episodesWatched);

  // Obtener episodios vistos del backend
  useEffect(() => {
    const fetchWatchedEpisodes = async () => {
      if (!group?.id || !series?.id || !season?.season_number) {
        setLoadingWatched(false);
        return;
      }

      try {
        setLoadingWatched(true);
        console.log('👁️ Obteniendo episodios vistos...');
        
        const response = await apiService.getEpisodesWatched(
          group.id,
          series.id,
          season.season_number,
          { 'Authorization': `Bearer ${accessToken}` }
        );
        
        console.log('👁️ Respuesta de episodios vistos:', response);
        
        // Extraer los episodios vistos de la respuesta anidada
        let episodesWatchedData;
        if (response.data && response.data.data && response.data.data.episodes_watched) {
          episodesWatchedData = response.data.data.episodes_watched;
        } else if (response.data && response.data.episodes_watched) {
          episodesWatchedData = response.data.episodes_watched;
        } else if (response.normalizedData && response.normalizedData.episodes_watched) {
          episodesWatchedData = response.normalizedData.episodes_watched;
        }
        
        if (episodesWatchedData && episodesWatchedData.length > 0) {
          // Crear un Set con los IDs de episodios vistos para búsqueda rápida
          const watchedIds = new Set(episodesWatchedData.map(ep => ep.episode_id));
          setWatchedEpisodes(watchedIds);
          
          // Inicializar el estado optimizado
          const watchedState = {};
          episodesWatchedData.forEach(ep => {
            watchedState[ep.episode_id] = true;
          });
          setEpisodeWatchedState(watchedState);
          
          console.log('✅ Episodios vistos cargados:', watchedIds);
        } else {
          setWatchedEpisodes(new Set());
          setEpisodeWatchedState({});
          console.log('ℹ️ No hay episodios vistos');
        }
      } catch (error) {
        console.error('❌ Error obteniendo episodios vistos:', error);
        setWatchedEpisodes(new Set());
      } finally {
        setLoadingWatched(false);
      }
    };

    fetchWatchedEpisodes();
  }, [group?.id, series?.id, season?.season_number, accessToken]);

  useEffect(() => {
    const fetchSeasonEpisodes = async () => {
      setLoading(true);
      
      if (!series.tmdb_id) {
        console.error('❌ No tmdb_id available for series:', series);
        setLoading(false);
        return;
      }
      
      const response = await apiService.getTMDBSeasonEpisodes(series.tmdb_id, season.season_number);
      
      if (response.success && response.data) {
        const episodes = response.data.episodes || [];
        // Agregar información adicional a cada episodio
        const episodesWithMetadata = episodes.map(ep => ({
          ...ep,
          series_id: series.id,
          season_number: season.season_number,
          user_id: user?.id,
          watched: watchedEpisodes.has(ep.id) // Marcar como visto si está en el Set
        }));
        setSeasonEpisodes(episodesWithMetadata);
        setSeasonDetails(response.data);
      } else {
        console.error('❌ Failed to fetch season episodes:', response.message);
        setSeasonEpisodes([]);
      }
      setLoading(false);
    };
    
    fetchSeasonEpisodes();
  }, [series, season, user]);

  // Configurar listeners de socket (el socket ya está conectado desde la pantalla anterior)
  useEffect(() => {
    const handleEpisodeWatched = (data) => {
      console.log('👁️ Episodio marcado como visto por otro usuario:', data);
      setEpisodeWatchedState(prev => ({
        ...prev,
        [data.episodeId]: true
      }));
      setWatchedEpisodes(prev => new Set([...prev, data.episodeId]));
    };

    const handleEpisodeUnwatched = (data) => {
      console.log('👁️ Episodio marcado como no visto por otro usuario:', data);
      setEpisodeWatchedState(prev => ({
        ...prev,
        [data.episodeId]: false
      }));
      setWatchedEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.episodeId);
        return newSet;
      });
    };

    const handleUserJoined = (data) => {
      console.log('👤 Usuario se unió al room:', data);
      success('Usuario conectado', `${data.username} se unió a la sesión`);
    };

    const handleUserLeft = (data) => {
      console.log('👤 Usuario salió del room:', data);
      success('Usuario desconectado', `${data.username} salió de la sesión`);
    };

    const handleRoomError = (error) => {
      console.error('❌ Error en room:', error);
      error('Error de room', error.message);
    };

    // Registrar listeners
    socketService.on('episode_watched', handleEpisodeWatched);
    socketService.on('episode_unwatched', handleEpisodeUnwatched);
    socketService.on('user_joined_room', handleUserJoined);
    socketService.on('user_left_room', handleUserLeft);
    socketService.on('room_error', handleRoomError);

    // Cleanup listeners
    return () => {
      socketService.off('episode_watched', handleEpisodeWatched);
      socketService.off('episode_unwatched', handleEpisodeUnwatched);
      socketService.off('user_joined_room', handleUserJoined);
      socketService.off('user_left_room', handleUserLeft);
      socketService.off('room_error', handleRoomError);
    };
  }, []);

  const toggleEpisodeWatched = (episodeId, currentWatched) => {
    const newWatchedState = !currentWatched;
    
    // Actualizar solo el estado del episodio específico
    setEpisodeWatchedState(prev => ({
      ...prev,
      [episodeId]: newWatchedState
    }));

    // Actualizar el Set de episodios vistos
    setWatchedEpisodes(prevWatched => {
      const newWatched = new Set(prevWatched);
      if (newWatchedState) {
        newWatched.add(episodeId);
      } else {
        newWatched.delete(episodeId);
      }
      return newWatched;
    });

    return newWatchedState;
  };

  const handleEpisodeToggle = (episodeId) => {
    const episode = seasonEpisodes.find(ep => ep.id === episodeId);
    if (!episode) return;

    const currentWatched = episodeWatchedState[episodeId] ?? episode.watched;
    const newWatchedState = toggleEpisodeWatched(episodeId, currentWatched);

    // Enviar por socket (el backend maneja el toggle)
    if (socketService.getConnectionStatus()) {
      console.log('📡 Enviando evento de episodio por socket...');
      console.log('📊 Episodio:', episode.episode_number, 'Temporada:', episode.season_number);
      
      // Siempre enviar el mismo evento, el backend decide si marcar como visto o no visto
      socketService.markEpisodeWatched(episode);
      console.log('✅ Evento de episodio enviado al backend');
    } else {
      console.log('❌ Socket no conectado, no se puede sincronizar el cambio');
      console.log('📊 Estado del socket:', socketService.getConnectionStatus());
      error('Sin conexión', 'No se pudo sincronizar el cambio');
    }
  };

  const getWatchedCount = () => {
    return watchedEpisodes.size;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.background : colors.light.background }]}> 
      {/* Header */}
      <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border }]}> 
        <TouchableOpacity onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}> 
            {series?.name}
          </Text>
          <Text style={[styles.textSecondary, { fontSize: 14, color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]}>
            {season?.name}
          </Text>
        </View>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: socketService.getConnectionStatus() ? colors.success[500] : colors.error[500],
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Ionicons 
            name={socketService.getConnectionStatus() ? "wifi" : "wifi-outline"} 
            size={20} 
            color="white" 
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent]}>
        {/* Info de la temporada */}
        {seasonDetails ? (
          <View style={[styles.card, { marginBottom: 20, alignItems: 'center', marginHorizontal: 0 }]}> 
            {seasonDetails.poster_path && (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w300${seasonDetails.poster_path}` }}
                style={{ width: 120, height: 180, borderRadius: 12, marginBottom: 12 }}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.cardTitle, { fontSize: 18, marginBottom: 8, textAlign: 'center', color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}>
              {seasonDetails.name}
            </Text>
            {seasonDetails.overview && (
              <Text style={[styles.textSecondary, { textAlign: 'center', marginBottom: 8, color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]} numberOfLines={3}>
                {seasonDetails.overview}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 16, width: '100%', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { fontSize: 20, color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}>{seasonEpisodes.length}</Text>
                <Text style={[styles.textSecondary, { color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]}>Episodios</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { fontSize: 20, color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}>{getWatchedCount()}</Text>
                <Text style={[styles.textSecondary, { color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]}>Vistos</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.headerTitle, { fontSize: 20, color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}>
                  {seasonDetails.air_date ? new Date(seasonDetails.air_date).getFullYear() : 'N/A'}
                </Text>
                <Text style={[styles.textSecondary, { color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]}>Año</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { marginBottom: 20, alignItems: 'center', marginHorizontal: 0 }]}> 
            <Skeleton width={120} height={180} borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton width={150} height={18} borderRadius={8} style={{ marginBottom: 8 }} />
            <Skeleton width={200} height={14} borderRadius={8} style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 16, width: '100%', justifyContent: 'space-around' }}>
              {[1,2,3].map((_, idx) => (
                <View key={idx} style={{ alignItems: 'center' }}>
                  <Skeleton width={30} height={20} borderRadius={8} style={{ marginBottom: 4 }} />
                  <Skeleton width={50} height={12} borderRadius={8} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lista de episodios */}
        <View style={[styles.card, { marginBottom: 20, marginHorizontal: 0 }]}> 
          <Text style={[styles.sectionTitle, { marginBottom: 12, color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}>Episodios</Text>
          {loading ? (
            <View>
              {[1,2,3,4,5,6,7,8].map((_, idx) => (
                <View key={idx} style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <Skeleton width={80} height={60} borderRadius={8} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton width="80%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
                    <Skeleton width="60%" height={14} borderRadius={8} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View>
              {seasonEpisodes.map(ep => {
                const isWatched = episodeWatchedState[ep.id] ?? ep.watched;
                return (
                  <TouchableOpacity
                    key={`episode-${ep.id}-${ep.episode_number}`}
                    style={{ 
                      flexDirection: 'row', 
                      marginBottom: 16,
                      backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                      borderRadius: 12,
                      padding: 12,
                      width: '100%',
                      marginHorizontal: 0,
                    }}
                    onPress={() => handleEpisodeToggle(ep.id)}
                  >
                    <View style={{
                      width: 80,
                      height: 60,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginRight: 12,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      flexShrink: 0,
                    }}>
                      {ep.still_path ? (
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w200${ep.still_path}` }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{
                          width: '100%',
                          height: '100%',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Ionicons name="play-circle-outline" size={24} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
                        </View>
                      )}
                    </View>
                    
                    <View style={{ flex: 1, justifyContent: 'space-between', minWidth: 0 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listItemTitle, { fontSize: 14, marginBottom: 4, color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]} numberOfLines={1}>
                          {ep.episode_number}. {ep.name}
                        </Text>
                        <Text style={[styles.textSecondary, { fontSize: 12, marginBottom: 4, color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]} numberOfLines={2}>
                          {ep.overview || 'Sin descripción disponible'}
                        </Text>
                        {ep.air_date && (
                          <Text style={[styles.textSecondary, { fontSize: 11, color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary }]}>
                            {new Date(ep.air_date).toLocaleDateString('es-ES')}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={{
                        backgroundColor: isWatched ? colors.success[500] : colors.primary[100],
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        alignSelf: 'flex-start',
                        marginLeft: 8,
                        flexShrink: 0,
                      }}
                      onPress={() => handleEpisodeToggle(ep.id)}
                    >
                      <Text style={{ 
                        color: isWatched ? 'white' : colors.primary[700], 
                        fontWeight: '600',
                        fontSize: 12,
                      }}>
                        {isWatched ? 'Visto' : 'Marcar'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default SeasonEpisodesScreen; 