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

const AddSeriesScreen = ({ navigation, onBack, group }) => {
  // Obtener el groupId solo desde la prop group
  const groupIdFinal = group?.id;

  console.log('Group ID usado en AddSeriesScreen:', groupIdFinal);

  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const { showSuccess, showError } = useToast();
  
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
      showError('Error', t('searchError'));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [showError, t]);

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
      console.log('🔍 Group ID from params:', groupIdFinal);
      showError('Error', t('groupIdRequired'));
      return;
    }
    try {
      setIsAddingSeries(true);
      const headers = getAuthHeaders();
      console.log('🔍 Headers:', headers);
      const seriesData = {
        tmdb_id: series.id,
        name: series.name,
        poster_url: series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : null,
        overview: series.overview,
        first_air_date: series.first_air_date,
        vote_average: series.vote_average,
        vote_count: series.vote_count,
        popularity: series.popularity,
      };
      console.log('🔍 Series data:', seriesData);
      const response = await apiService.addSeriesToGroup(groupIdFinal, seriesData, headers);
      if (response.success) {
        showSuccess(t('seriesAdded'), t('seriesAddedSuccess'));
        if (onBack) {
          onBack();
        }
      } else {
        showError('Error', response.message || t('addSeriesError'));
      }
    } catch (error) {
      console.error('💥 Error adding series:', error);
      showError('Error', t('addSeriesError'));
    } finally {
      setIsAddingSeries(false);
    }
  }, [groupIdFinal, getAuthHeaders, showSuccess, showError, t, onBack]);

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
      {/* Header personalizado */}
      <View style={[createComponentStyles(isDarkMode).header, { 
        backgroundColor: isDarkMode ? colors.dark.background : colors.light.background,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border,
      }]}>
        <TouchableOpacity 
          onPress={onBack || (navigation && navigation.goBack)}
          style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            justifyContent: 'center', 
            alignItems: 'center' 
          }}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} 
          />
        </TouchableOpacity>
        <Text style={[createComponentStyles(isDarkMode).headerTitle, { 
          color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary 
        }]}>
          {t('addSeries')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

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