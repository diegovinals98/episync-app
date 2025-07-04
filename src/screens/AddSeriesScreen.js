import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { colors } from '../styles/colors';
import { createComponentStyles } from '../styles/components';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';

const AddSeriesScreen = ({ navigation, route }) => {
  // Obtener el groupId desde route.params
  const group = route?.params?.group;
  const groupIdFinal = group?.id;

  console.log('Group ID usado en AddSeriesScreen:', groupIdFinal);

  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const { success, error } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingSeries, setIsAddingSeries] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Función para buscar series en TMDB
  const searchSeries = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await apiService.searchTMDBSeries(query);
      console.log('🔍 TMDB search response:', response);
      
      if (response.success && response.data) {
        const results = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Search results:', results.length, 'series found');
        setSearchResults(results);
      } else {
        console.log('❌ No search results:', response.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('💥 Error searching series:', error);
      error(t('searchError'));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [error, t]);

  // Debounce para evitar demasiadas llamadas a la API
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Función para manejar cambios en el texto de búsqueda con debounce
  const handleSearchTextChange = useCallback((text) => {
    setSearchQuery(text);
    
    // Cancelar el timeout anterior si existe
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Si el texto está vacío, limpiar resultados inmediatamente
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Crear nuevo timeout para buscar después de 500ms de inactividad
    const newTimeout = setTimeout(() => {
      searchSeries(text.trim());
    }, 500);
    
    setSearchTimeout(newTimeout);
  }, [searchTimeout, searchSeries]);

  // Cleanup del timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Función para añadir serie al grupo
  const addSeriesToGroup = useCallback(async (series) => {
    if (!groupIdFinal) {
      error(t('groupIdRequired'));
      return;
    }

    try {
      setIsAddingSeries(true);

      // 1. Obtener detalles completos de TMDB
      const tmdbId = series.id;
      const tmdbToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1YmRhYzE1NTQ1ZjUzNzM2ZDUyZTk3MTE1NDI0NTExNSIsIm5iZiI6MTc1MTM3ODA3Ny40ODMsInN1YiI6IjY4NjNlODlkZDljYTA2ZmNlZmY4M2VkMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.9nsGIEk6ApFEVetd-9yIfFes8bclTPu-jsgdqc7G9mk'; // Sustituye por variable si lo necesitas
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}?language=en-US`,
        {
          headers: {
            'Authorization': tmdbToken,
            'accept': 'application/json'
          }
        }
      );
      const tmdbData = await tmdbResponse.json();

      // 2. Construir el objeto completo
      const seriesData = {
        tmdb_id: tmdbData.id,
        name: tmdbData.name,
        overview: tmdbData.overview,
        poster_path: tmdbData.poster_path || null,
        backdrop_path: tmdbData.backdrop_path || null,
        first_air_date: tmdbData.first_air_date || null,
        number_of_seasons: tmdbData.number_of_seasons || (tmdbData.seasons ? tmdbData.seasons.length : null),
        number_of_episodes: tmdbData.number_of_episodes || null,
        genres: tmdbData.genres ? JSON.stringify(tmdbData.genres) : null,
        vote_average: tmdbData.vote_average || 0.0,
        vote_count: tmdbData.vote_count || 0,
        is_popular: 0,
        created_at: null,
        updated_at: null,
        popularity: tmdbData.popularity || 0.0,
      };

      // 3. Enviar por socket
      socketService.addSeriesToGroup(groupIdFinal, seriesData);

    } catch (err) {
      error('Error', t('addSeriesError'));
      setIsAddingSeries(false);
    }
  }, [groupIdFinal, getAuthHeaders, error, t]);

  // Configurar listeners de socket para añadir series
  useEffect(() => {
    const handleSeriesAdded = (data) => {
      console.log('📺 Evento series-added-to-group recibido:', data);
      setIsAddingSeries(false);
      if (data && data.success) {
        console.log('✅ Serie añadida exitosamente, navegando de vuelta');
        success(t('seriesAdded'), data.message || t('seriesAddedSuccess'));
        
        // Navegar de vuelta - el socket actualizará la lista en GroupDetailScreen
        navigation.goBack();
      } else if (data && data.message) {
        console.log('❌ Error en la respuesta:', data.message);
        error('Error', data.message);
      }
    };

    const handleSeriesError = (errorData) => {
      setIsAddingSeries(false);
      error('Error', errorData.message || t('addSeriesError'));
    };

    const handleGenericError = (errorData) => {
      console.log('❌ Error genérico recibido:', errorData);
      setIsAddingSeries(false);
      error('Error', errorData.message || t('addSeriesError'));
    };

    console.log('🔧 Registrando listeners de socket para AddSeriesScreen');
    socketService.on('series-added-to-group', handleSeriesAdded);
    socketService.on('series-added-error', handleSeriesError);
    socketService.on('error', handleGenericError);
    console.log('✅ Listeners registrados correctamente');

    return () => {
      socketService.off('series-added-to-group', handleSeriesAdded);
      socketService.off('series-added-error', handleSeriesError);
      socketService.off('error', handleGenericError);
      setIsAddingSeries(false);
    };
  }, [success, error, t, navigation]);

  // Función para manejar búsqueda manual (botón)
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchSeries(searchQuery.trim());
    }
  };

  // Función para seleccionar serie
  const handleSelectSeries = (series) => {
    console.log('Pulsada tarjeta, añadiendo serie:', series);
    addSeriesToGroup(series);
  };

  // Renderizar resultado de búsqueda
  const renderSearchResult = (series) => (
    <TouchableOpacity
      key={series.id}
      onPress={() => handleSelectSeries(series)}
      style={{
        backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
        borderRadius: 16,
        width: '48%',
        marginBottom: 16,
        padding: 10,
        height: 180,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Carátula */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        {series.poster_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w300${series.poster_path}` }}
            style={{ width: 80, height: 120, borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: 80,
            height: 120,
            borderRadius: 8,
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons
              name="tv-outline"
              size={28}
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Info */}
      <Text
        style={[
          createComponentStyles(isDarkMode).cardTitle,
          {
            textAlign: 'center',
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 2,
            paddingHorizontal: 2,
          },
        ]}
        numberOfLines={2}
      >
        {series.name}
      </Text>
      {series.first_air_date && (
        <Text
          style={[
            createComponentStyles(isDarkMode).textSecondary,
            {
              textAlign: 'center',
              fontSize: 12,
            },
          ]}
        >
          {new Date(series.first_air_date).getFullYear()}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[
      createComponentStyles(isDarkMode).container,
      { backgroundColor: isDarkMode ? colors.dark.background : colors.light.background }
    ]}>
      

      <ScrollView
        style={createComponentStyles(isDarkMode).scrollView}
        contentContainerStyle={createComponentStyles(isDarkMode).scrollContent}
      >
        {/* Barra de búsqueda */}
        <View style={{ marginBottom: 24 , marginTop: 24}}>
          
          <View style={createComponentStyles(isDarkMode).inputContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
            />
            <TextInput
              style={createComponentStyles(isDarkMode).input}
              placeholder={t('searchSeriesPlaceholder')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <ActivityIndicator 
                size="small" 
                color={colors.primary[500]} 
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
          
          {searchQuery.trim() && isSearching && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: 12,
              padding: 12,
              backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
              borderRadius: 8
            }}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={[createComponentStyles(isDarkMode).textSecondary, { marginLeft: 8 }]}>
                {t('searching')}
              </Text>
            </View>
          )}
        </View>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <View>
            <Text style={[createComponentStyles(isDarkMode).sectionTitle, { marginBottom: 16 }]}>
              {t('searchResults')} ({searchResults.length})
            </Text>
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}>
              {searchResults.map(renderSearchResult)}
            </View>
          </View>
        )}

        {/* Estado vacío */}
        {searchQuery.trim() && !isSearching && searchResults.length === 0 && searchTimeout && (
          <View style={{ 
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
          }}>
            <Ionicons 
              name="search-outline" 
              size={48} 
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
              style={{ marginBottom: 16 }}
            />
            <Text style={[createComponentStyles(isDarkMode).cardTitle, { marginBottom: 8, textAlign: 'center' }]}>
              {t('noSeriesFound')}
            </Text>
            <Text style={[createComponentStyles(isDarkMode).textSecondary, { textAlign: 'center' }]}>
              {t('tryDifferentSearch')}
            </Text>
          </View>
        )}

        {/* Instrucciones */}
        {!searchQuery.trim() && (
          <View style={{ 
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
          }}>
            <Ionicons 
              name="search" 
              size={48} 
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
              style={{ marginBottom: 16 }}
            />
            <Text style={[createComponentStyles(isDarkMode).cardTitle, { marginBottom: 8, textAlign: 'center' }]}>
              {t('searchForSeries')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Loading overlay */}
      {isAddingSeries && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={[createComponentStyles(isDarkMode).text, { marginTop: 16 }]}>
              {t('addingSeries')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AddSeriesScreen; 