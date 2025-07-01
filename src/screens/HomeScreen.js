import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../components/Skeleton';

const HomeScreen = ({ onSettings }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success: showSuccess, info: showInfo } = useToast();
  const styles = createComponentStyles(isDarkMode);
  
  const [isLoading, setIsLoading] = useState(false);

  // Obtener nombre completo del usuario
  const fullName = user ? `${user.name} ${user.lastname}` : 'Usuario';

  // Datos simulados
  const userStats = {
    seriesWatching: 8,
    episodesWatched: 156,
    hoursWatched: 78,
    groupsJoined: 3,
  };

  const popularSeries = [
    { id: 1, name: 'Breaking Bad', episodes: 62, image: '🎭' },
    { id: 2, name: 'Game of Thrones', episodes: 73, image: '⚔️' },
    { id: 3, name: 'Stranger Things', episodes: 34, image: '👻' },
    { id: 4, name: 'The Crown', episodes: 60, image: '👑' },
  ];

  const userGroups = [
    { id: 1, name: 'Familia Viñals', members: 4, series: 3 },
    { id: 2, name: 'Amigos Series', members: 8, series: 5 },
    { id: 3, name: 'Roommates', members: 3, series: 2 },
  ];

  const handleJoinGroup = () => {
    showInfo('Unirse a grupo', 'Funcionalidad en desarrollo');
  };

  const handleCreateGroup = () => {
    showInfo('Crear grupo', 'Funcionalidad en desarrollo');
  };

  const handleSeriesPress = (series) => {
    showInfo('Serie seleccionada', `Has seleccionado ${series.name}`);
  };

  const handleGroupPress = (group) => {
    showInfo('Grupo seleccionado', `Has seleccionado ${group.name}`);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={200} borderRadius={16} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={200} borderRadius={16} />
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
            <Text style={styles.headerTitle}>{t('hello')}, {fullName}!</Text>
            <Text style={styles.subtitle}>{t('welcomeBack')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onSettings} style={styles.headerButton}>
          <Ionicons name="settings-outline" size={20} color={isDarkMode ? colors.dark.text : colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Grupos */}
        <View style={styles.cardCompact}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.cardTitle}>{t('yourGroups')}</Text>
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
          {userGroups.map((group, index) => (
            <TouchableOpacity 
              key={group.id} 
              onPress={() => handleGroupPress(group)}
              style={[styles.listItem, { 
                borderBottomWidth: index < userGroups.length - 1 ? 1 : 0,
                paddingVertical: 16,
                paddingHorizontal: 20,
              }]}
            >
              <View style={[styles.avatar, { 
                width: 48, 
                height: 48, 
                borderRadius: 24,
                backgroundColor: colors.primary[500],
              }]}>
                <Ionicons name="people" size={24} color="white" />
              </View>
              <View style={[styles.listItemContent, { marginLeft: 12 }]}>
                <Text style={styles.listItemTitle}>{group.name}</Text>
                <Text style={styles.listItemSubtitle}>{group.members} {t('members')} • {group.series} {t('series')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Series populares */}
        <View style={styles.cardCompact}>
          <Text style={styles.cardTitle}>{t('popularSeries')}</Text>
          <View style={{ marginTop: 16 }}>
            {popularSeries.map((series, index) => (
              <TouchableOpacity 
                key={series.id} 
                onPress={() => handleSeriesPress(series)}
                style={[styles.listItem, { 
                  borderBottomWidth: index < popularSeries.length - 1 ? 1 : 0,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                }]}
              >
                <View style={[styles.avatar, { 
                  width: 48, 
                  height: 48, 
                  borderRadius: 24,
                  backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }]}>
                  <Text style={{ fontSize: 24 }}>{series.image}</Text>
                </View>
                <View style={[styles.listItemContent, { marginLeft: 12 }]}>
                  <Text style={styles.listItemTitle}>{series.name}</Text>
                  <Text style={styles.listItemSubtitle}>{series.episodes} {t('episodes')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen; 