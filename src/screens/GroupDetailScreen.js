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
import socketService from '../services/socket.service';

const GroupDetailScreen = ({ route, navigation }) => {
  const groupData = route?.params?.group;
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const { success, error } = useToast();
  
  const [groupInfo, setGroupInfo] = useState(groupData);
  const [series, setSeries] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('series');
  const [socketConnected, setSocketConnected] = useState(false); // 'series' or 'members'

  // Configurar el header de navegación
  useEffect(() => {
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
  }, [navigation, groupInfo, isDarkMode, t]);

  // Función para obtener los datos del grupo
  const fetchGroupData = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders();
      
      console.log('🔄 Fetching data for group ID:', groupInfo?.id);
      
      // Obtener información detallada del grupo
      const groupResponse = await apiService.getGroupDetails(groupInfo.id, headers);
      
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

        // Asegurar que tmdb_id esté presente en cada serie
        const mappedSeries = seriesData.map(series => ({
          ...series,
          tmdb_id: series.tmdb_id || series.id_tmdb || series.tmdb || null
        }));
        setSeries(mappedSeries);
      } else if (seriesResponse.success && seriesResponse.data) {
        const seriesData = Array.isArray(seriesResponse.data) ? seriesResponse.data : [];
        console.log('✅ Series data received (fallback):', seriesData.length, 'series');
        // Asegurar que tmdb_id esté presente en cada serie
        const mappedSeries = seriesData.map(series => ({
          ...series,
          tmdb_id: series.tmdb_id || series.id_tmdb || series.tmdb || null
        }));
        setSeries(mappedSeries);
      } else {
        console.log('❌ No series data or error:', seriesResponse.message);
        setSeries([]);
      }
      
      // Obtener miembros del grupo
      const membersResponse = await apiService.getGroupMembers(groupInfo.id, headers);
      
      if (membersResponse.success && membersResponse.normalizedData) {
        const membersData = Array.isArray(membersResponse.normalizedData) ? membersResponse.normalizedData : [];

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
      error('Error', t('errorLoadingGroupData'));
    } finally {
      setIsLoading(false);
      console.log('🏁 Data fetching completed');
    }
  }, [groupInfo?.id, getAuthHeaders, error, t]);

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

  // Conectar al room del grupo cuando se monta el componente
  useEffect(() => {
    const connectToGroupRoom = async () => {
      if (!groupInfo?.id) {
        console.log('❌ No hay ID de grupo para conectar al room');
        return;
      }

      try {
        console.log('🚪 Conectando al room del grupo:', groupInfo.id);
        
        // Generar room ID para el grupo (solo groupId)
        const groupRoomId = groupInfo.id.toString();
        
        // Conectar al room del grupo
        await socketService.connect(groupRoomId, getAuthHeaders()['Authorization']);
        setSocketConnected(true);
        console.log('✅ Conectado exitosamente al room del grupo');
      } catch (error) {
        console.error('❌ Error conectando al room del grupo:', error);
        setSocketConnected(false);
      }
    };

    // Solo conectar si ya tenemos los datos del grupo cargados
    if (groupInfo?.id && !isLoading) {
      connectToGroupRoom();
    }

    // Cleanup al desmontar
    return () => {
      if (socketConnected) {
        console.log('🚪 Desconectando del room del grupo al salir');
        socketService.disconnect();
        setSocketConnected(false);
      }
    };
  }, [groupInfo?.id, isLoading, getAuthHeaders]);

  // Configurar listeners de socket para eventos del grupo
  useEffect(() => {
    const handleUserJoinedGroup = (data) => {
      console.log('👤 Usuario se unió al grupo:', data);
      success('Usuario conectado', `${data.username} se unió al grupo`);
    };

    const handleUserLeftGroup = (data) => {
      console.log('👤 Usuario salió del grupo:', data);
      success('Usuario desconectado', `${data.username} salió del grupo`);
    };

    const handleGroupError = (error) => {
      console.error('❌ Error en grupo:', error);
      error('Error de grupo', error.message);
    };

    const handleGenericError = (errorData) => {
      console.log('❌ Error genérico recibido en GroupDetail:', errorData);
      error('Error', errorData.message);
    };

    const handleSeriesAddedToGroup = async (data) => {
      console.log('📺 Nueva serie añadida al grupo:', data);
      console.log('📊 Datos completos del evento:', JSON.stringify(data, null, 2));
      
      // Extraer los datos de la serie del evento
      let seriesData;
      if (data.success && data.data) {
        seriesData = data.data;
        success('Serie añadida', data.message || `${seriesData.series_name} se añadió al grupo`);
      } else {
        seriesData = data;
        success('Serie añadida', `${seriesData.name || seriesData.series_name} se añadió al grupo`);
      }
      // Construir poster_url si viene poster_path pero no poster_url
      let poster_url = seriesData.poster_url;
      if (!poster_url && seriesData.poster_path) {
        poster_url = `https://image.tmdb.org/t/p/w500${seriesData.poster_path}`;
      }
      // Añadir la serie con los datos mínimos (si no está duplicada)
      setSeries(prevSeries => {
        const isDuplicate = prevSeries.some(series => 
          series.id === seriesData.id || 
          series.series_id === seriesData.series_id ||
          series.tmdb_id === seriesData.tmdb_id
        );
        if (isDuplicate) {
          return prevSeries;
        }
        return [...prevSeries, { ...seriesData, poster_url, loadingDetails: true }];
      });
      setGroupInfo(prevGroupInfo => ({
        ...prevGroupInfo,
        series_count: (prevGroupInfo.series_count || 0) + 1
      }));
      if (seriesData.tmdb_id) {
        try {
          const response = await apiService.getTMDBSeriesDetails(seriesData.tmdb_id);
          if (response.success && response.data) {
            const poster_url = response.data.poster_path
              ? `https://image.tmdb.org/t/p/w500${response.data.poster_path}`
              : null;
            setSeries(prevSeries =>
              prevSeries.map(s =>
                s.tmdb_id === seriesData.tmdb_id
                  ? { ...s, ...response.data, poster_url, loadingDetails: false }
                  : s
              )
            );
          }
        } catch (err) {
          console.error('❌ Error al obtener detalles de la serie desde TMDB:', err);
        }
      }
    };

    // Registrar listeners siempre (el socket service maneja la conexión internamente)
    console.log('🔧 Registrando listeners de socket para GroupDetailScreen');
    socketService.on('user_joined_group', handleUserJoinedGroup);
    socketService.on('user_left_group', handleUserLeftGroup);
    socketService.on('group_error', handleGroupError);
    socketService.on('series-added-to-group', handleSeriesAddedToGroup);
    socketService.on('error', handleGenericError);
    console.log('✅ Listeners registrados correctamente');

    // Cleanup listeners
    return () => {
      socketService.off('user_joined_group', handleUserJoinedGroup);
      socketService.off('user_left_group', handleUserLeftGroup);
      socketService.off('group_error', handleGroupError);
      socketService.off('series-added-to-group', handleSeriesAddedToGroup);
      socketService.off('error', handleGenericError);
    };
  }, [socketConnected, success, error]);

  // Función para manejar configuración del grupo
  const handleSettings = () => {
    // TODO: Implementar configuración del grupo
    Alert.alert(t('settings'), t('groupSettingsComingSoon'));
  };

  // Función para manejar clic en serie
  const handleSeriesPress = (seriesItem) => {
    navigation.navigate('GroupSeriesDetail', { 
      group: groupInfo, 
      series: seriesItem, 
      members 
    });
  };

  // Función para manejar clic en miembro
  const handleMemberPress = (member) => {
    // TODO: Mostrar perfil del miembro
    Alert.alert(member.name, t('memberProfileComingSoon'));
  };

  // Función para añadir serie al grupo
  const handleAddSeries = () => {
    navigation.navigate('AddSeries', { group: groupInfo });
  };

  // Función para añadir miembro al grupo
  const handleAddMember = () => {
    // TODO: Implementar añadir miembro al grupo
    Alert.alert(t('addMember'), t('addMemberComingSoon'));
  };

  // Función para invitar miembros
  const handleInviteMembers = () => {
    // TODO: Implementar invitación de miembros
    Alert.alert(t('inviteMembers'), t('inviteMembersComingSoon'));
  };

  // Renderizar información del grupo
  const renderGroupInfo = () => (
    <View style={[createComponentStyles(isDarkMode).card]}>
      <View style={{ flexDirection: 'row', alignItems: 'center'}}>
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
        <Text style={[createComponentStyles(isDarkMode).textSecondary]}>
          {groupInfo.description.length > 100 ? groupInfo.description.substring(0, 100) + '...' : groupInfo.description}
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
                    { member.full_name || member.name || member.username || t('member')}
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
      <ScrollView
        style={[createComponentStyles(isDarkMode).scrollView]}
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