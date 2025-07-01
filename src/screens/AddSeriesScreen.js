import React, { useState, useCallback } from 'react';
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

const AddSeriesScreen = ({ route, navigation, onBack, groupId }) => {
  const { group } = route?.params || {};
  const groupIdFromProps = groupId || group?.id;
  
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

  // Función para añadir serie al grupo
  const addSeriesToGroup = useCallback(async (series) => {
    if (!groupIdFromProps) {
      showError('Error', t('groupIdRequired'));
      return;
    }

    try {
      setIsAddingSeries(true);
      const headers = getAuthHeaders();
      
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

      console.log('📺 Adding series to group:', seriesData);
      
      const response = await apiService.addSeriesToGroup(groupIdFromProps, seriesData, headers);
      console.log('📺 Add series response:', response);
      
      if (response.success) {
        showSuccess(t('seriesAdded'), t('seriesAddedSuccess'));
        // Volver a la pantalla anterior
        if (onBack) {
          onBack();
        } else if (navigation) {
          navigation.goBack();
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
  }, [groupIdFromProps, getAuthHeaders, showSuccess, showError, t, onBack, navigation]);

  // Función para manejar búsqueda
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchSeries(searchQuery.trim());
    }
  };

  // Función para seleccionar serie
  const handleSelectSeries = (series) => {
    setSelectedSeries(series);
    Alert.alert(
      t('confirmAddSeries'),
      `${t('addSeriesToGroup')} "${series.name}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('add'), 
          onPress: () => addSeriesToGroup(series),
          style: 'default'
        }
      ]
    );
  };

  // Renderizar resultado de búsqueda
  const renderSearchResult = (series) => (
    <TouchableOpacity 
      key={series.id}
      onPress={() => handleSelectSeries(series)}
      style={{
        backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{
        width: 60,
        height: 90,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      }}>
        {series.poster_path ? (
          <Image 
            source={{ uri: `https://image.tmdb.org/t/p/w200${series.poster_path}` }} 
            style={{ width: 60, height: 90 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ 
            width: 60, 
            height: 90, 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <Ionicons 
              name="tv-outline" 
              size={24} 
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
            />
          </View>
        )}
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={createComponentStyles(isDarkMode).listItemTitle}>
          {series.name}
        </Text>
        <Text style={createComponentStyles(isDarkMode).listItemSubtitle}>
          {series.first_air_date ? new Date(series.first_air_date).getFullYear() : t('unknown')}
        </Text>
        {series.vote_average > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="star" size={12} color={colors.warning[500]} />
            <Text style={[createComponentStyles(isDarkMode).textSecondary, { marginLeft: 4 }]}>
              {series.vote_average.toFixed(1)} ({series.vote_count} {t('votes')})
            </Text>
          </View>
        )}
        {series.overview && (
          <Text style={[createComponentStyles(isDarkMode).textSecondary, { marginTop: 4 }]} numberOfLines={2}>
            {series.overview}
          </Text>
        )}
      </View>
      
      <Ionicons 
        name="add-circle" 
        size={24} 
        color={colors.primary[500]} 
      />
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
        <View style={{ marginBottom: 24 }}>
          <Text style={createComponentStyles(isDarkMode).inputLabel}>
            {t('searchSeries')}
          </Text>
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
              onChangeText={setSearchQuery}
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
          
          {searchQuery.trim() && (
            <TouchableOpacity 
              onPress={handleSearch}
              style={[createComponentStyles(isDarkMode).button, { marginTop: 12 }]}
              disabled={isSearching}
            >
              <Text style={createComponentStyles(isDarkMode).buttonText}>
                {isSearching ? t('searching') : t('search')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <View>
            <Text style={createComponentStyles(isDarkMode).sectionTitle}>
              {t('searchResults')} ({searchResults.length})
            </Text>
            {searchResults.map(renderSearchResult)}
          </View>
        )}

        {/* Estado vacío */}
        {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
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
            <Text style={[createComponentStyles(isDarkMode).textSecondary, { textAlign: 'center' }]}>
              {t('searchForSeriesDescription')}
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