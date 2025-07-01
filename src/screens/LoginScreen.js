import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../components/Skeleton';
import RegisterScreen from './RegisterScreen';

const LoginScreen = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const styles = createComponentStyles(isDarkMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Error', t('pleaseCompleteFields'));
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await loginWithEmail(email.trim(), password);
      if (!result.success) {
        showError('Error de Login', result.error);
      } else {
        showSuccess('¡Bienvenido!', 'Sesión iniciada correctamente');
      }
    } catch (error) {
      showError('Error', 'Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (!result?.success) {
        showError('Error de Google', result?.error || 'Error con Google Sign-In');
      } else {
        showSuccess('¡Bienvenido!', 'Sesión iniciada con Google');
      }
    } catch (error) {
      showError('Error', 'Error con Google Sign-In');
    }
  };

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleBackFromRegister = () => {
    setShowRegister(false);
  };

  if (showRegister) {
    return <RegisterScreen onBack={handleBackFromRegister} />;
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 60 }}>
            <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 24 }} />
            <Skeleton width={200} height={32} style={{ marginBottom: 12 }} />
            <Skeleton width={160} height={18} />
          </View>
          <View style={styles.cardCompact}>
            <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 20 }} />
            <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 16 }} />
            <Skeleton width={120} height={16} style={{ alignSelf: 'flex-end', marginBottom: 24 }} />
            <Skeleton width="100%" height={48} borderRadius={12} style={{ marginBottom: 20 }} />
            <View style={styles.separator}>
              <Skeleton width="40%" height={1} />
              <Skeleton width={100} height={16} style={{ marginHorizontal: 16 }} />
              <Skeleton width="40%" height={1} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <Skeleton width="48%" height={48} borderRadius={12} />
              <Skeleton width="48%" height={48} borderRadius={12} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
    

      {/* Contenido principal */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
        {/* Logo y título */}
        <View style={{ alignItems: 'center', marginBottom: 60 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary[500],
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <Ionicons name="people" size={32} color="white" />
          </View>
          <Text style={[styles.headerTitle, { fontSize: 32, color: colors.primary[500], marginBottom: 8 }]}>{t('appName')}</Text>
          <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
        </View>

        {/* Formulario */}
        <View style={styles.cardCompact}>
          <Text style={styles.inputLabel}>{t('email')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
            />
          </View>
          
          <View style={{ height: 20 }} />
          
          <Text style={styles.inputLabel}>{t('password')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 12, marginBottom: 24 }}>
            <Text style={styles.textLink}>{t('forgotPassword')}</Text>
          </TouchableOpacity>
          
          {/* Botón de login */}
          <TouchableOpacity 
            onPress={handleLogin} 
            style={[styles.button, { opacity: isLoggingIn ? 0.7 : 1 }]}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Iniciando...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('loginButton')}</Text>
            )}
          </TouchableOpacity>
          
          {/* Separador */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{t('orContinueWith')}</Text>
            <View style={styles.separatorLine} />
          </View>
          
          {/* Botones sociales */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={[styles.buttonSecondary, { flex: 1 }]}
              onPress={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              <Ionicons name="logo-google" size={18} color={isDarkMode ? colors.dark.text : colors.light.text} />
              <Text style={styles.buttonSecondaryText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.buttonSecondary, { flex: 1 }]}
              disabled={isLoggingIn}
            >
              <Ionicons name="logo-apple" size={18} color={isDarkMode ? colors.dark.text : colors.light.text} />
              <Text style={styles.buttonSecondaryText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Registro */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={styles.textSecondary}>{t('noAccount')} </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.textLink}>{t('registerHere')}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Botón de tema */}
        <TouchableOpacity 
          onPress={toggleTheme} 
          style={{ 
            position: 'absolute', 
            top: 50, 
            right: 20, 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color={isDarkMode ? colors.dark.text : colors.light.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen; 