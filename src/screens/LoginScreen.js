import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
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
import Loader from '../components/Loader';
import biometricService from '../services/biometric.service';

const LoginScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { loginWithEmail, loginWithGoogle, loginWithBiometric, isLoading } = useAuth();
  const { success, error } = useToast();
  const styles = createComponentStyles(isDarkMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const scrollViewRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Verificar disponibilidad de biometría al cargar
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Manejar el enfoque de inputs para hacer scroll
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Hacer scroll cuando aparece el teclado
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Opcional: hacer scroll al inicio cuando se oculta el teclado
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleInputFocus = () => {
    // El scroll se maneja automáticamente con los listeners del teclado
  };

  const checkBiometricAvailability = async () => {
    try {
      const { supported, types } = await biometricService.checkBiometricSupport();
      const hasCredentials = await biometricService.hasStoredCredentials();
      const isEnabled = await biometricService.isBiometricEnabled();
      
      if (supported && hasCredentials && isEnabled) {
        setBiometricAvailable(true);
        setBiometricType(types[0] || 'Biometría');
      }
    } catch (err) {
      console.error('Error checking biometric:', err);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      error('Error', t('pleaseCompleteFields'));
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await loginWithEmail(email.trim(), password);
      if (result.success) {
        success('¡Bienvenido!', 'Sesión iniciada correctamente');
      } else {
        // En caso de error, limpiar solo la contraseña, mantener el correo
        setPassword('');
      }
      // Los errores ya se manejan en el AuthContext con toasts específicos
    } catch (error) {
      error('Error', 'Error inesperado. Inténtalo de nuevo.');
      // En caso de error, limpiar solo la contraseña, mantener el correo
      setPassword('');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await loginWithGoogle();
      if (!result?.success) {
        error('Error de Google', result?.error || 'Error con Google Sign-In');
      } else {
        success('¡Bienvenido!', 'Sesión iniciada con Google');
      }
    } catch (error) {
      error('Error', 'Error con Google Sign-In');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleBiometricLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await loginWithBiometric();
      if (result.success) {
        success('¡Bienvenido!', 'Sesión iniciada con biometría');
      }
      // Los errores ya se manejan en el AuthContext
    } catch (err) {
      error('Error', 'Error con la autenticación biométrica');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Solo mostrar skeleton en la carga inicial, no durante el login
  // El isLoading del AuthContext se usa para verificar tokens al iniciar la app
  // No queremos que muestre skeleton cuando el usuario está haciendo login
  if (isLoading && !isLoggingIn) {
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Contenido principal */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
              ref={emailInputRef}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
              onFocus={() => handleInputFocus(emailInputRef)}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />
          </View>
          
          <View style={{ height: 20 }} />
          
          <Text style={styles.inputLabel}>{t('password')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              ref={passwordInputRef}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn}
              onFocus={() => handleInputFocus(passwordInputRef)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
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
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('loginButton')}</Text>
            )}
          </TouchableOpacity>

          {/* Botón de Face ID / Touch ID */}
          {/*{biometricAvailable && (
            <TouchableOpacity 
              onPress={handleBiometricLogin} 
              style={[
                styles.button, 
                { 
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.primary[500],
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isLoggingIn ? 0.7 : 1
                }
              ]} 
              disabled={isLoggingIn}
            >
              <Ionicons 
                name={biometricType === 'Face ID' ? 'face-recognition' : 'finger-print'} 
                size={20} 
                color={colors.primary[500]} 
                style={{ marginRight: 8 }} 
              />
              <Text style={[styles.buttonText, { color: colors.primary[500] }]}>
                {t('loginWithBiometric', { type: biometricType })}
              </Text>
            </TouchableOpacity>
          )}*/}
          
          
          {/* Separador */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{t('orContinueWith')}</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Botón de Google */}
          <TouchableOpacity 
            onPress={handleGoogleLogin} 
            style={[styles.button, { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary[500], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }]} 
            disabled={isLoggingIn}
          >
            <Ionicons name="logo-google" size={20} color={colors.primary[500]} style={{ marginRight: 8 }} />
            <Text style={[styles.buttonText, { color: colors.primary[500] }]}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Registro */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, marginBottom: 20 }}>
          <Text style={styles.textSecondary}>{t('noAccount')} </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.textLink}>{t('registerHere')}</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen; 