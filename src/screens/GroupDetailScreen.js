import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { colors } from '../styles/colors';
import { createComponentStyles } from '../styles/components';
import Skeleton from '../components/Skeleton';
import apiService from '../services/api.service';

const GroupDetailScreen = ({ route, navigation, onBack, group, onAddSeries }) => {
  const groupData = group || route?.params?.group;
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [groupInfo, setGroupInfo] = useState(groupData);
  const [series, setSeries] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('series'); // 'series' or 'members'

  // Configurar el header de navegación
  useEffect(() => {
    if (onBack) {
      // Si estamos usando navegación personalizada
      return;
    }
    
    // Si estamos usando React Navigation
    if (navigation) {
      navigation.setOptions({
        title: groupInfo?.name || t('group'),
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ marginLeft: 16 }}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} 
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleSettings}
            style={{ marginRight: 16 }}
          >
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} 
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, groupInfo, isDarkMode, t, onBack]);

  // Función para obtener los datos del grupo
  const fetchGroupData = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();
      
      console.log('🔄 Fetching data for group ID:', groupInfo?.id);
      
      // Obtener información detallada del grupo
      const groupResponse = await apiService.getGroupDetails(groupInfo.id, headers);
      console.log('📋 Group details response:', groupResponse);
      
      if (groupResponse.success && groupResponse.normalizedData) {
        setGroupInfo(groupResponse.normalizedData);
        console.log('✅ Group details updated from normalizedData');
      } else if (groupResponse.success && groupResponse.data) {
        setGroupInfo(groupResponse.data);
        console.log('✅ Group details updated from data');
      } else {
        console.log('❌ Failed to get group details:', groupResponse.message);
      }
      
      // Obtener series del grupo
      const seriesResponse = await apiService.getGroupSeries(groupInfo.id, headers);
      console.log('📺 Group series response:', seriesResponse);
      
      if (seriesResponse.success && seriesResponse.normalizedData) {
        const seriesData = Array.isArray(seriesResponse.normalizedData) ? seriesResponse.normalizedData : [];
        console.log('✅ Series data received:', seriesData.length, 'series');
        console.log('📋 Series data details:', JSON.stringify(seriesData, null, 2));
        setSeries(seriesData);
      } else if (seriesResponse.success && seriesResponse.data) {
        const seriesData = Array.isArray(seriesResponse.data) ? seriesResponse.data : [];
        console.log('✅ Series data received (fallback):', seriesData.length, 'series');
        setSeries(seriesData);
      } else {
        console.log('❌ No series data or error:', seriesResponse.message);
        setSeries([]);
      }
      
      // Obtener miembros del grupo
      const membersResponse = await apiService.getGroupMembers(groupInfo.id, headers);
      console.log('👥 Group members response:', membersResponse);
      
      if (membersResponse.success && membersResponse.normalizedData) {
        const membersData = Array.isArray(membersResponse.normalizedData) ? membersResponse.normalizedData : [];
        console.log('✅ Members data received:', membersData.length, 'members');
        console.log('📋 Members data details:', JSON.stringify(membersData, null, 2));
        setMembers(membersData);
      } else if (membersResponse.success && membersResponse.data) {
        const membersData = Array.isArray(membersResponse.data) ? membersResponse.data : [];
        console.log('✅ Members data received (fallback):', membersData.length, 'members');
        setMembers(membersData);
      } else {
        console.log('❌ No members data or error:', membersResponse.message);
        setMembers([]);
      }
      
    } catch (error) {
      console.error('💥 Error fetching group data:', error);
      showError('Error', t('errorLoadingGroupData'));
    } finally {
      setIsLoading(false);
      console.log('🏁 Data fetching completed');
    }
  }, [groupInfo?.id, getAuthHeaders, showError, t]);

  // Función para refrescar datos
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGroupData();
    setRefreshing(false);
  }, [fetchGroupData]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // Función para manejar configuración del grupo
  const handleSettings = () => {
    // TODO: Implementar configuración del grupo
    Alert.alert(t('settings'), t('groupSettingsComingSoon'));
  };

  // Función para manejar clic en serie
  const handleSeriesPress = (series) => {
    // TODO: Navegar a detalles de la serie
    Alert.alert(series.name, t('seriesDetailsComingSoon'));
  };

  // Función para manejar clic en miembro
  const handleMemberPress = (member) => {
    // TODO: Mostrar perfil del miembro
    Alert.alert(member.name, t('memberProfileComingSoon'));
  };

  // Función para añadir serie al grupo
  const handleAddSeries = () => {
    // Navegar a la pantalla de añadir series
    if (onAddSeries && typeof onAddSeries === 'function') {
      onAddSeries('AddSeries', { group: groupInfo });
    }
  };

  // Función para añadir miembro al grupo
  const handleAddMember = () => {
    // TODO: Implementar añadir miembro
    Alert.alert(t('addMember'), t('addMemberComingSoon'));
  };

  // Función para invitar miembros
  const handleInviteMembers = () => {
    // TODO: Implementar invitación de miembros
    Alert.alert(t('inviteMembers'), t('inviteMembersComingSoon'));
  };

  // Renderizar información del grupo
  const renderGroupInfo = () => (
    <View style={[createComponentStyles(isDarkMode).card, { marginBottom: 24 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: groupInfo?.is_admin ? colors.success[500] : colors.primary[500],
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        }}>
          {groupInfo?.photo_url ? (
            <Image 
              source={{ uri: groupInfo.photo_url }} 
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <Ionicons 
              name={groupInfo?.is_admin ? "shield" : "people"} 
              size={40} 
              color="white" 
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[createComponentStyles(isDarkMode).cardTitle, { marginBottom: 4 }]}>
            {groupInfo?.name || t('group')}
          </Text>
          <Text style={createComponentStyles(isDarkMode).textSecondary}>
            {groupInfo?.member_count || 0} {t('members')} • {groupInfo?.series_count || 0} {t('series')}
          </Text>
          {groupInfo?.is_admin && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginTop: 4,
              backgroundColor: colors.success[100],
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              alignSelf: 'flex-start'
            }}>
              <Ionicons name="shield" size={12} color={colors.success[600]} />
              <Text style={{ 
                fontSize: 12, 
                color: colors.success[600], 
                marginLeft: 4,
                fontWeight: '600'
              }}>
                {t('admin')}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {groupInfo?.description && (
        <Text style={[createComponentStyles(isDarkMode).textSecondary, { marginBottom: 16 }]}>
          {groupInfo.description}
        </Text>
      )}
      
     
    </View>
  );

  // Renderizar tabs
  const renderTabs = () => (
    <View style={{ 
      flexDirection: 'row', 
      backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24
    }}>
      <TouchableOpacity 
        onPress={() => setActiveTab('series')}
        style={[
          { 
            flex: 1, 
            paddingVertical: 12, 
            paddingHorizontal: 16, 
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center'
          },
          activeTab === 'series' && {
            backgroundColor: colors.primary[500]
          }
        ]}
      >
        <Ionicons 
          name="tv-outline" 
          size={20} 
          color={activeTab === 'series' ? 'white' : (isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary)} 
          style={{ marginRight: 8 }}
        />
        <Text style={[
          createComponentStyles(isDarkMode).buttonSmallText,
          { 
            color: activeTab === 'series' ? 'white' : (isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary)
          }
        ]}>
          {t('series')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setActiveTab('members')}
        style={[
          { 
            flex: 1, 
            paddingVertical: 12, 
            paddingHorizontal: 16, 
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center'
          },
          activeTab === 'members' && {
            backgroundColor: colors.primary[500]
          }
        ]}
      >
        <Ionicons 
          name="people-outline" 
          size={20} 
          color={activeTab === 'members' ? 'white' : (isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary)} 
          style={{ marginRight: 8 }}
        />
        <Text style={[
          createComponentStyles(isDarkMode).buttonSmallText,
          { 
            color: activeTab === 'members' ? 'white' : (isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary)
          }
        ]}>
          {t('members')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar lista de series
  const renderSeriesList = () => {
    console.log('📺 Rendering series list. Series count:', series.length);
    
    if (isLoading) {
      return (
        <View>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={{ marginBottom: 12 }}>
              <Skeleton width="100%" height={80} borderRadius={12} />
            </View>
          ))}
        </View>
      );
    }

    if (series.length === 0) {
      console.log('📭 No series to display - showing empty state');
      return (
        <View style={{ 
          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
          borderRadius: 12,
          padding: 32,
          alignItems: 'center',
        }}>
          <Ionicons 
            name="tv-outline" 
            size={48} 
            color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
            style={{ marginBottom: 16 }}
          />
          <Text style={[createComponentStyles(isDarkMode).cardTitle, { marginBottom: 8, textAlign: 'center' }]}>
            {t('noSeries')}
          </Text>
          <Text style={[createComponentStyles(isDarkMode).textSecondary, { textAlign: 'center', marginBottom: 16 }]}>
            {t('noSeriesInGroup')}
          </Text>
          <TouchableOpacity 
            onPress={handleAddSeries}
            style={[createComponentStyles(isDarkMode).button, { paddingHorizontal: 16, paddingVertical: 8 }]}
          >
            <Text style={createComponentStyles(isDarkMode).buttonText}>{t('addFirstSeries')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('✅ Rendering', series.length, 'series');
    return (
      <View>
        {series.map((seriesItem) => (
          <TouchableOpacity 
            key={seriesItem.id}
            onPress={() => handleSeriesPress(seriesItem)}
            style={{
              backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                {seriesItem.poster_url ? (
                  <Image 
                    source={{ uri: seriesItem.poster_url }} 
                    style={{ width: 60, height: 60, borderRadius: 8 }}
                  />
                ) : (
                  <Text style={{ fontSize: 24 }}>📺</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={createComponentStyles(isDarkMode).listItemTitle}>{seriesItem.name || t('series')}</Text>
                <Text style={createComponentStyles(isDarkMode).listItemSubtitle}>
                  {seriesItem.episodes_count || 0} {t('episodes')} • {seriesItem.status || t('unknown')}
                </Text>
                {seriesItem.last_episode && (
                  <Text style={createComponentStyles(isDarkMode).listItemSubtitle}>
                    {t('lastEpisode')}: {seriesItem.last_episode}
                  </Text>
                )}
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Renderizar lista de miembros
  const renderMembersList = () => {
    console.log('👥 Rendering members list. Members count:', members.length);
    
    if (isLoading) {
      return (
        <View>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={{ marginBottom: 12 }}>
              <Skeleton width="100%" height={60} borderRadius={12} />
            </View>
          ))}
        </View>
      );
    }

    if (members.length === 0) {
      console.log('📭 No members to display - showing empty state');
      return (
        <View style={{ 
          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
          borderRadius: 12,
          padding: 32,
          alignItems: 'center',
        }}>
          <Ionicons 
            name="people-outline" 
            size={48} 
            color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
            style={{ marginBottom: 16 }}
          />
          <Text style={[createComponentStyles(isDarkMode).cardTitle, { marginBottom: 8, textAlign: 'center' }]}>
            {t('noMembers')}
          </Text>
          <Text style={[createComponentStyles(isDarkMode).textSecondary, { textAlign: 'center', marginBottom: 16 }]}>
            {t('noMembersInGroup')}
          </Text>
          <TouchableOpacity 
            onPress={handleAddMember}
            style={[createComponentStyles(isDarkMode).button, { paddingHorizontal: 16, paddingVertical: 8 }]}
          >
            <Text style={createComponentStyles(isDarkMode).buttonText}>{t('addFirstMember')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('✅ Rendering', members.length, 'members');
    return (
      <View>
        {members.map((member, index) => {
          // Validar que el miembro tenga datos válidos
          if (!member || typeof member !== 'object') {
            console.error('❌ Invalid member data:', member);
            return null;
          }
          
          return (
            <TouchableOpacity 
              key={member.id || `member-${index}`}
              onPress={() => handleMemberPress(member)}
              style={{
                backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: member.is_admin ? colors.success[500] : colors.primary[500],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  {member.avatar_url ? (
                    <Image 
                      source={{ uri: member.avatar_url }} 
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  ) : (
                    <Ionicons 
                      name={member.is_admin ? "shield" : "person"} 
                      size={24} 
                      color="white" 
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={createComponentStyles(isDarkMode).listItemTitle}>
                    {member.name || member.username || member.full_name || t('member')}
                  </Text>
                  <Text style={createComponentStyles(isDarkMode).listItemSubtitle}>
                    {member.series_watching || member.series_count || 0} {t('series')} • {member.episodes_watched || member.episodes_count || 0} {t('episodes')}
                  </Text>
                  {member.is_admin && (
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginTop: 4,
                      backgroundColor: colors.success[100],
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                      alignSelf: 'flex-start'
                    }}>
                      <Ionicons name="shield" size={12} color={colors.success[600]} />
                      <Text style={{ 
                        fontSize: 12, 
                        color: colors.success[600], 
                        marginLeft: 4,
                        fontWeight: '600'
                      }}>
                        {t('admin')}
                      </Text>
                    </View>
                  )}
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[
      createComponentStyles(isDarkMode).container,
      { backgroundColor: isDarkMode ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header personalizado para navegación personalizada */}
      {onBack && (
        <View style={[createComponentStyles(isDarkMode).header, { 
          backgroundColor: isDarkMode ? colors.dark.background : colors.light.background,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border,
        }]}>
          <TouchableOpacity 
            onPress={onBack}
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
            {groupInfo?.name || t('group')}
          </Text>
          <TouchableOpacity 
            onPress={handleSettings}
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
              name="settings-outline" 
              size={24} 
              color={isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary} 
            />
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView
        style={[createComponentStyles(isDarkMode).scrollView, onBack && { marginTop: 0 }]}
        contentContainerStyle={[createComponentStyles(isDarkMode).scrollContent, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {renderGroupInfo()}
        {renderTabs()}
        
        {activeTab === 'series' ? renderSeriesList() : renderMembersList()}
      </ScrollView>

      {/* Botón flotante */}
      <View style={{
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        alignItems: 'center',
      }}>
        <TouchableOpacity 
          onPress={activeTab === 'series' ? handleAddSeries : handleAddMember}
          style={{
            backgroundColor: colors.primary[500],
            borderRadius: 20,
            paddingVertical: 18,
            paddingHorizontal: 32,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 10,
            minWidth: 220,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Ionicons 
            name={activeTab === 'series' ? 'add' : 'person-add'} 
            size={26} 
            color="white" 
            style={{ marginRight: 10 }}
          />
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: 'white',
            letterSpacing: 0.5,
          }}>
            {activeTab === 'series' ? t('addSeries') : t('addMember')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupDetailScreen; 