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

const GroupSeriesDetailScreen = ({ onBack, group, series, members, onSeasonEpisodes }) => {
  const { isDarkMode } = useTheme();
  const { user, accessToken } = useAuth();
  const { success, error } = useToast();
  const styles = createComponentStyles(isDarkMode);

  const [seriesDetails, setSeriesDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [membersProgress, setMembersProgress] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  // Obtener progreso real de los miembros
  useEffect(() => {
    const fetchMembersProgress = async () => {
      if (!group?.id || !series?.id) {
        setLoadingProgress(false);
        return;
      }

      try {
        setLoadingProgress(true);
        console.log('📊 Obteniendo progreso real de miembros...');
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
          console.log('✅ Datos de progreso obtenidos:', membersProgressData);
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
  }, [group?.id, series?.id, accessToken]);

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
    if (onSeasonEpisodes && typeof onSeasonEpisodes === 'function') {
      onSeasonEpisodes('SeasonEpisodes', { group, series, season, members });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.background : colors.light.background }]}> 
      {/* Header */}
      <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border }]}> 
        <TouchableOpacity onPress={onBack} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary }]}> 
          {series?.name || 'Serie'}
        </Text>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          backgroundColor: socketConnected ? colors.success[500] : colors.error[500],
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Ionicons 
            name={socketConnected ? "wifi" : "wifi-outline"} 
            size={20} 
            color="white" 
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}>
        {/* Info de la serie */}
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
            <Text style={[styles.textSecondary, { textAlign: 'center', fontStyle: 'italic' }]}>
              No hay progreso registrado aún
            </Text>
          )}
        </View>

        {/* Temporadas */}
        <View style={[styles.card, { marginBottom: 20 }]}> 
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Temporadas</Text>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1,2,3,4,5].map((_, idx) => (
                <View key={idx} style={{ marginRight: 15, alignItems: 'center' }}>
                  <Skeleton width={120} height={180} borderRadius={12} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={16} borderRadius={8} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {seriesDetails?.seasons?.map(season => (
                <TouchableOpacity
                  key={season.season_number}
                  onPress={() => handleSeasonPress(season)}
                  style={{
                    marginRight: 15,
                    alignItems: 'center',
                    width: 120,
                  }}
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
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default GroupSeriesDetailScreen; 