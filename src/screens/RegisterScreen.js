import React, { useState } from 'react';
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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import Loader from '../components/Loader';

const RegisterScreen = ({ onBack }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { register } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const styles = createComponentStyles(isDarkMode);
  
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Validación de formulario
  const validateForm = () => {
    if (!username.trim()) {
      showError('Error', 'Por favor ingresa un nombre de usuario');
      return false;
    }
    if (!name.trim()) {
      showError('Error', 'Por favor ingresa tu nombre');
      return false;
    }
    if (!lastname.trim()) {
      showError('Error', 'Por favor ingresa tu apellido');
      return false;
    }
    if (!email.trim()) {
      showError('Error', 'Por favor ingresa tu email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showError('Error', 'Por favor ingresa un email válido');
      return false;
    }
    if (!password.trim() || password.length < 6) {
      showError('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      showError('Error', 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      const result = await register(name, lastname, username, email, password);
      if (!result.success) {
        showError('Error de Registro', result.error);
      } else {
        showSuccess('¡Cuenta Creada!', 'Tu cuenta ha sido creada correctamente');
        // El AuthContext ya maneja la autenticación automáticamente después del registro exitoso
      }
    } catch (error) {
      showError('Error', 'Error inesperado. Inténtalo de nuevo.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={20} color={isDarkMode ? colors.dark.text : colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('register')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo y título */}
        <View style={{ alignItems: 'center', marginVertical: 30 }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary[500],
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            shadowColor: colors.primary[500],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <Ionicons name="person-add" size={24} color="white" />
          </View>
          <Text style={[styles.headerTitle, { fontSize: 24, color: colors.primary[500], marginBottom: 8 }]}>{t('createAccount')}</Text>
          <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>
        </View>

        {/* Formulario */}
        <View style={styles.cardCompact}>
          {/* Username */}
          <Text style={styles.inputLabel}>{t('username')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="at" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholder={t('usernamePlaceholder')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
            />
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Nombre */}
          <Text style={styles.inputLabel}>{t('name')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder={t('namePlaceholder')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              autoCapitalize="words"
              editable={!isRegistering}
            />
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Apellido */}
          <Text style={styles.inputLabel}>{t('lastname')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={lastname}
              onChangeText={setLastname}
              style={styles.input}
              placeholder={t('lastnamePlaceholder')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              autoCapitalize="words"
              editable={!isRegistering}
            />
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Email */}
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
              editable={!isRegistering}
            />
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Contraseña */}
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
              editable={!isRegistering}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Confirmar Contraseña */}
          <Text style={styles.inputLabel}>{t('confirmPassword')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
            />
          </View>
          
          <View style={{ height: 24 }} />
          
          {/* Botón de registro */}
          <TouchableOpacity 
            onPress={handleRegister} 
            style={[styles.button, { opacity: isRegistering ? 0.7 : 1 }]}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>{t('registering')}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('registerButton')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Ya tienes cuenta */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={styles.textSecondary}>{t('alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.textLink}>{t('loginHere')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen; 