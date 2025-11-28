import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import apiService from './api.service';

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.error('❌ Permiso no concedido para notificaciones push');
      return null;
    }
    
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.error('❌ ID del proyecto no encontrado');
      return null;
    }
    
    try {
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('✅ Token de push obtenido:', pushTokenString);
      
      return pushTokenString;
    } catch (e) {
      console.error('💥 Error al obtener el token de push:', e);
      return null;
    }
  } else {
    console.log('⚠️ No es un dispositivo físico, no se puede obtener token de push');
    return null;
  }
}

// Función para guardar el token en el backend
async function saveTokenToBackend(token, accessToken) {
  try {
    const response = await fetch(`${ENV.API_URL}/api/v1/users/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        expo_push_token: token,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Token guardado en el backend:', result);
      return { success: true, data: result };
    } else {
      console.error('❌ Error guardando token en el backend:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('💥 Exception guardando token en el backend:', error);
    return { success: false, error: error.message };
  }
}

// Función para actualizar el token en el backend
async function updateTokenInBackend(token, accessToken) {
  try {
    const response = await fetch(`${ENV.API_URL}/api/v1/users/push-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        expo_push_token: token,
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Token actualizado en el backend:', result);
      return { success: true, data: result };
    } else {
      console.error('❌ Error actualizando token en el backend:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('💥 Exception actualizando token en el backend:', error);
    return { success: false, error: error.message };
  }
}

// Función para eliminar el token del backend
async function removeTokenFromBackend(accessToken) {
  try {
    const response = await fetch(`${ENV.API_URL}/api/v1/users/push-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Token eliminado del backend:', result);
      return { success: true, data: result };
    } else {
      console.error('❌ Error eliminando token del backend:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('💥 Exception eliminando token del backend:', error);
    return { success: false, error: error.message };
  }
}

// Función principal para registrar y guardar el token
async function registerAndSaveToken(accessToken) {
  try {
    console.log('🔄 Iniciando registro de notificaciones push...');
    
    // Obtener el token de push
    const token = await registerForPushNotificationsAsync();
    console.log('🔄 Token de push obtenido:', token);
    
    if (!token) {
      console.log('❌ No se pudo obtener el token de push');
      return { success: false, error: 'No se pudo obtener el token de push' };
    }
    
    // Guardar el token en el backend
    const saveResult = await saveTokenToBackend(token, accessToken);
    
    if (saveResult.success) {
      console.log('✅ Token registrado y guardado exitosamente');
      return { success: true, token, data: saveResult.data };
    } else {
      console.error('❌ Error guardando el token:', saveResult.error);
      return { success: false, token, error: saveResult.error };
    }
    
  } catch (error) {
    console.error('💥 Error en el proceso de registro:', error);
    return { success: false, error: error.message };
  }
}

// Configurar manejadores de notificaciones
function setupNotificationHandlers(navigationRef, getAccessToken) {
  // Manejador para cuando la app está en primer plano
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Manejador para cuando se recibe una notificación
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notificación recibida:', notification);
  });

  // Manejador para cuando se toca una notificación
  const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
    console.log('👆 Notificación tocada');
    
    // Aquí puedes manejar la navegación basada en los datos de la notificación
    const data = response.notification.request.content.data;
    if (data) {
      console.log('📊 Datos de la notificación:', JSON.stringify(data, null, 2));
      
      // Navegación basada en el tipo de notificación
      if (data.type === 'episode_watched') {
        try {
          const accessToken = getAccessToken ? await getAccessToken() : null;
          
          if (!accessToken) {
            console.error('❌ No se pudo obtener el token de acceso');
            return;
          }

          const headers = {
            'Authorization': `Bearer ${accessToken}`,
          };

          // Obtener datos del grupo y la serie
          if (data.groupId && data.seriesId) {
            console.log('🔄 Obteniendo datos del grupo y la serie...');
            
            // Obtener detalles del grupo
            const groupResponse = await apiService.getGroupDetails(data.groupId, headers);
            const group = groupResponse?.data || groupResponse;
            
            // Obtener series del grupo
            const seriesResponse = await apiService.getGroupSeries(data.groupId, headers);
            const allSeries = seriesResponse?.data || seriesResponse || [];
            
            // Encontrar la serie específica
            const series = allSeries.find(s => 
              s.id === data.seriesId || 
              s.tmdb_id === data.seriesId || 
              s.tmdb_id?.toString() === data.seriesId?.toString()
            );

            // Obtener miembros del grupo
            const membersResponse = await apiService.getGroupMembers(data.groupId, headers);
            const members = membersResponse?.data || membersResponse || [];

            if (group && series) {
              console.log('✅ Datos obtenidos, navegando a GroupSeriesDetail');
              
              // Navegar a la pantalla de detalles de la serie del grupo
              if (navigationRef?.current) {
                navigationRef.current.navigate('GroupSeriesDetail', {
                  group,
                  series,
                  members,
                });
              } else {
                console.error('❌ navigationRef no está disponible');
              }
            } else {
              console.error('❌ No se pudieron obtener los datos del grupo o la serie');
            }
          } else {
            console.error('❌ Faltan groupId o seriesId en los datos de la notificación');
          }
        } catch (error) {
          console.error('❌ Error navegando desde notificación:', error);
        }
      }
    }
  });

  return { notificationListener, responseListener };
}

const notificationRegistrationService = {
  registerForPushNotificationsAsync,
  saveTokenToBackend,
  updateTokenInBackend,
  removeTokenFromBackend,
  registerAndSaveToken,
  setupNotificationHandlers,
};

export default notificationRegistrationService; 