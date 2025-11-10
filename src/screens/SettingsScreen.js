import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import notificationRegistrationService from '../services/notificationRegistration.service';

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, themeMode, setThemeMode } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const styles = createComponentStyles(isDarkMode);

  // Estado de perfil
  const [name, setName] = useState(user?.name || 'Diego Viñals');
  const [email, setEmail] = useState(user?.email || 'diego@email.com');
  const [profileImage, setProfileImage] = useState(user?.avatar_url || null);
  const [notifications, setNotifications] = useState(true);

  // Cambiar foto de perfil
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        success('Foto actualizada', 'Tu foto de perfil se ha actualizado correctamente');
      }
    } catch (error) {
      error('Error', 'No se pudo actualizar la foto de perfil');
    }
  };

  // Guardar cambios (simulado)
  const handleSave = () => {
    success('Cambios guardados', 'Tus cambios han sido guardados correctamente');
  };

  // Manejar notificaciones push
  const handlePushNotifications = async () => {
    try {
      success('Registrando...', 'Configurando notificaciones push...');
      
      const result = await notificationRegistrationService.registerAndSaveToken(user?.accessToken);
      
      if (result.success) {
        success('Notificaciones activadas', 'Las notificaciones push están ahora activas');
        setNotifications(true);
      } else {
        error('Error', 'No se pudieron activar las notificaciones push');
        setNotifications(false);
      }
    } catch (err) {
      error('Error', 'Error al configurar las notificaciones push');
      setNotifications(false);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderSectionHeader = (title) => (
    <Text style={[styles.textSecondary, { 
      fontSize: 13, 
      fontWeight: '600', 
      textTransform: 'uppercase', 
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 24,
      color: colors.primary[500]
    }]}>
      {title}
    </Text>
  );

  const renderSettingItem = ({ icon, title, subtitle, onPress, rightElement, showBorder = true }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.listItem, { 
        borderBottomWidth: showBorder ? 1 : 0,
        paddingVertical: 16,
        paddingHorizontal: 20,
      }]}
    >
      <View style={[styles.avatar, { 
        width: 36, 
        height: 36, 
        borderRadius: 18,
        backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
      }]}>
        <Ionicons name={icon} size={18} color={colors.primary[500]} />
      </View>
      <View style={[styles.listItemContent, { marginLeft: 12 }]}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto de perfil */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity onPress={pickImage}>
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
              justifyContent: 'center', 
              alignItems: 'center', 
              overflow: 'hidden',
              borderWidth: 3,
              borderColor: colors.primary[500],
              shadowColor: colors.primary[500],
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 8,
            }}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              ) : (
                <Ionicons name="person" size={40} color={colors.primary[500]} />
              )}
              <View style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                backgroundColor: colors.primary[500], 
                borderRadius: 16, 
                padding: 6,
                shadowColor: colors.primary[500],
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.textSecondary, { marginTop: 12, textAlign: 'center' }]}>{t('tapToChangePhoto')}</Text>
        </View>

        {/* Información del perfil */}
        {renderSectionHeader(t('profile'))}
        <View style={styles.cardCompact}>
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{t('name')}</Text>
            <TextInput 
              value={name} 
              onChangeText={setName} 
              style={styles.inputContainer}
              placeholder={t('name')} 
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>{t('email')}</Text>
            <TextInput 
              value={email} 
              onChangeText={setEmail} 
              style={styles.inputContainer}
              placeholder={t('email')} 
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
              keyboardType="email-address" 
              autoCapitalize="none" 
              autoCorrect={false} 
            />
          </View>
        </View>

        {/* Preferencias de tema */}
        {renderSectionHeader(t('appTheme'))}
        <View style={styles.cardCompact}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'light', icon: 'sunny', label: t('light') },
              { key: 'dark', icon: 'moon', label: t('dark') },
              { key: 'system', icon: 'desktop', label: t('system') },
            ].map((option) => (
              <TouchableOpacity 
                key={option.key}
                onPress={() => setThemeMode(option.key)} 
                style={{ 
                  flex: 1, 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: themeMode === option.key 
                    ? colors.primary[500] 
                    : (isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
                  borderWidth: 1,
                  borderColor: themeMode === option.key 
                    ? colors.primary[500] 
                    : (isDarkMode ? colors.dark.border : colors.light.border),
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={themeMode === option.key ? 'white' : colors.primary[500]} 
                />
                <Text style={{ 
                  color: themeMode === option.key ? 'white' : (isDarkMode ? colors.dark.text : colors.light.text), 
                  fontWeight: '600', 
                  marginTop: 8,
                  fontSize: 14,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selector de idioma */}
        {renderSectionHeader(t('language'))}
        <View style={styles.cardCompact}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'es', icon: 'flag', label: t('spanish') },
              { key: 'en', icon: 'flag', label: t('english') },
            ].map((option) => (
              <TouchableOpacity 
                key={option.key}
                onPress={() => changeLanguage(option.key)} 
                style={{ 
                  flex: 1, 
                  alignItems: 'center', 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: language === option.key 
                    ? colors.primary[500] 
                    : (isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
                  borderWidth: 1,
                  borderColor: language === option.key 
                    ? colors.primary[500] 
                    : (isDarkMode ? colors.dark.border : colors.light.border),
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={language === option.key ? 'white' : colors.primary[500]} 
                />
                <Text style={{ 
                  color: language === option.key ? 'white' : (isDarkMode ? colors.dark.text : colors.light.text), 
                  fontWeight: '600', 
                  marginTop: 8,
                  fontSize: 14,
                }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notificaciones */}
        {renderSectionHeader(t('notifications'))}
        <View style={styles.cardCompact}>
          {renderSettingItem({
            icon: 'notifications-outline',
            title: t('notifications'),
            subtitle: t('notificationsSubtitle'),
            rightElement: (
              <Switch
                value={notifications}
                onValueChange={handlePushNotifications}
                thumbColor={notifications ? colors.primary[500] : (isDarkMode ? colors.dark.border : colors.light.border)}
                trackColor={{ 
                  false: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary, 
                  true: colors.primary[200] 
                }}
              />
            ),
            onPress: handlePushNotifications,
          })}
          {renderSettingItem({
            icon: 'push-outline',
            title: 'Notificaciones Push',
            subtitle: 'Recibir notificaciones de actividad del grupo',
            rightElement: <Ionicons name="chevron-forward" size={16} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />,
            onPress: handlePushNotifications,
            showBorder: false,
          })}
        </View>

        {/* Información de la app */}
        {renderSectionHeader('App Info')}
        <View style={styles.cardCompact}>
          {renderSettingItem({
            icon: 'information-circle-outline',
            title: 'Versión',
            subtitle: '1.0.0',
            rightElement: <Ionicons name="chevron-forward" size={16} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />,
            onPress: () => {},
          })}
          {renderSettingItem({
            icon: 'shield-checkmark-outline',
            title: 'Privacidad',
            subtitle: 'Política de privacidad',
            rightElement: <Ionicons name="chevron-forward" size={16} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />,
            onPress: () => {},
            showBorder: false,
          })}
        </View>

        {/* Cerrar sesión */}
        {renderSectionHeader('Cuenta')}
        <View style={styles.cardCompact}>
          {renderSettingItem({
            icon: 'log-out-outline',
            title: 'Cerrar Sesión',
            subtitle: 'Salir de tu cuenta',
            rightElement: <Ionicons name="chevron-forward" size={16} color={colors.error[500]} />,
            onPress: handleLogout,
            showBorder: false,
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen; 