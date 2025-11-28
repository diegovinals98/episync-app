import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/**
 * Servicio para manejar autenticación biométrica (Face ID / Touch ID)
 */
class BiometricService {
  /**
   * Verifica si el dispositivo soporta autenticación biométrica
   * @returns {Promise<{supported: boolean, types: string[]}>}
   */
  async checkBiometricSupport() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { supported: false, types: [] };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes = types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Touch ID';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biometric';
        }
      });

      return { supported: true, types: biometricTypes };
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return { supported: false, types: [] };
    }
  }

  /**
   * Verifica si hay credenciales guardadas de forma segura
   * @returns {Promise<boolean>}
   */
  async hasStoredCredentials() {
    try {
      const email = await SecureStore.getItemAsync('biometric_email');
      const password = await SecureStore.getItemAsync('biometric_password');
      return !!(email && password);
    } catch (error) {
      console.error('Error checking stored credentials:', error);
      return false;
    }
  }

  /**
   * Guarda las credenciales de forma segura
   * @param {string} email 
   * @param {string} password 
   */
  async saveCredentials(email, password) {
    try {
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_password', password);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      console.log('✅ Credenciales guardadas de forma segura');
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  /**
   * Obtiene las credenciales guardadas
   * @returns {Promise<{email: string, password: string} | null>}
   */
  async getStoredCredentials() {
    try {
      const email = await SecureStore.getItemAsync('biometric_email');
      const password = await SecureStore.getItemAsync('biometric_password');
      
      if (email && password) {
        return { email, password };
      }
      return null;
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  }

  /**
   * Elimina las credenciales guardadas
   */
  async removeStoredCredentials() {
    try {
      await SecureStore.deleteItemAsync('biometric_email');
      await SecureStore.deleteItemAsync('biometric_password');
      await SecureStore.deleteItemAsync('biometric_enabled');
      console.log('✅ Credenciales eliminadas');
    } catch (error) {
      console.error('Error removing credentials:', error);
    }
  }

  /**
   * Verifica si la autenticación biométrica está habilitada
   * @returns {Promise<boolean>}
   */
  async isBiometricEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  }

  /**
   * Autentica usando Face ID / Touch ID
   * @param {string} reason - Razón para la autenticación (mostrada al usuario)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async authenticate(reason = 'Autenticarse con biometría') {
    try {
      // Verificar si hay credenciales guardadas
      const hasCredentials = await this.hasStoredCredentials();
      if (!hasCredentials) {
        return { success: false, error: 'No hay credenciales guardadas' };
      }

      // Verificar si el dispositivo soporta biometría
      const { supported } = await this.checkBiometricSupport();
      if (!supported) {
        return { success: false, error: 'El dispositivo no soporta autenticación biométrica' };
      }

      // Verificar si hay biometría configurada
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { 
          success: false, 
          error: 'No hay biometría configurada en el dispositivo. Configúrala en Ajustes.' 
        };
      }

      // Realizar autenticación biométrica
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Permitir usar PIN/contraseña como fallback
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        // Obtener credenciales guardadas
        const credentials = await this.getStoredCredentials();
        return { 
          success: true, 
          credentials: credentials 
        };
      } else {
        if (result.error === 'user_cancel') {
          return { success: false, error: 'Autenticación cancelada' };
        }
        return { success: false, error: result.error || 'Error en la autenticación' };
      }
    } catch (error) {
      console.error('Error in biometric authentication:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }
}

export default new BiometricService();

