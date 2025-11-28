import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Switch,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api.service';
import * as ImagePicker from 'expo-image-picker';
import { ColorSchemeStore } from 'nativewind/dist/style-sheet/color-scheme';

const CreateGroupScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user, getAuthHeaders } = useAuth();
  const { success, error, info } = useToast();
  const styles = createComponentStyles(isDarkMode);
  
  // Estados para el formulario
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const scrollViewRef = useRef(null);
  const groupNameInputRef = useRef(null);
  const groupDescriptionInputRef = useRef(null);

  // Manejar el teclado para hacer scroll automático
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, []);
  
  // Datos simulados para usuarios
  const mockUsers = [
    { id: 1, username: 'mariavinals', name: 'María', lastname: 'Viñals', avatar_url: null },
    { id: 2, username: 'carlos', name: 'Carlos', lastname: 'Rodríguez', avatar_url: null },
    { id: 3, username: 'laura', name: 'Laura', lastname: 'Gómez', avatar_url: null },
    { id: 4, username: 'alex', name: 'Alex', lastname: 'Martínez', avatar_url: null },
    { id: 5, username: 'sofia', name: 'Sofía', lastname: 'López', avatar_url: null },
  ];

  // Buscar usuarios cuando cambia la consulta
  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Debounce para evitar demasiadas llamadas a la API
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Función para buscar usuarios
  const searchUsers = async (query) => {
    try {
      setIsLoadingUsers(true);
      setHasSearched(true);
      
      // Llamar al endpoint real de la API
      const headers = getAuthHeaders();
      const response = await apiService.searchUsers(query, headers);
      
      if (response.success && response.normalizedData && response.normalizedData.data) {
        // Filtrar el usuario actual de los resultados
        const filteredUsers = response.normalizedData.data.filter(userItem => 
          userItem.id !== user?.id // Excluir al usuario actual
        );
        console.log('Usuarios encontrados:', filteredUsers.length);
        setSearchResults(filteredUsers);
      } else {
        console.error('Error en la respuesta de búsqueda:', response);
        setSearchResults([]);
        error('Error', t('loadUsersError'));
      }
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      setSearchResults([]);
      error('Error', t('searchConnectionError'));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Función para alternar la selección de un miembro
  const toggleMemberSelection = (member) => {
    const isSelected = selectedMembers.some(m => m.id === member.id);
    
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Función para seleccionar todos los usuarios encontrados
  const selectAllUsers = () => {
    const newMembers = [...selectedMembers];
    searchResults.forEach(user => {
      if (!selectedMembers.some(m => m.id === user.id)) {
        newMembers.push(user);
      }
    });
    setSelectedMembers(newMembers);
  };

  // Función para deseleccionar todos los usuarios
  const deselectAllUsers = () => {
    setSelectedMembers([]);
  };

  // Función para eliminar un miembro específico
  const removeMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== memberId));
  };

  // Función para seleccionar imagen
  const pickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        error('Permisos', t('permissionsRequired'));
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setGroupImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      error('Error', t('imageSelectionError'));
    }
  };

  // Función para tomar foto con la cámara
  const takePhoto = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        error('Permisos', t('cameraPermissionsRequired'));
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setGroupImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      error('Error', t('photoError'));
    }
  };

  // Función para mostrar opciones de imagen
  const showImageOptions = () => {
    Alert.alert(
      t('groupPhoto'),
      t('photoOptions'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('gallery'),
          onPress: pickImage,
        },
        {
          text: t('camera'),
          onPress: takePhoto,
        },
      ]
    );
  };

  // Función para eliminar imagen
  const removeImage = () => {
    setGroupImage(null);
  };

  // Función para crear el grupo
  const handleCreateGroup = async () => {
    // Validar campos
    if (!groupName.trim()) {
      error('Error', t('groupNameRequired'));
      return;
    }

    try {
      setIsCreating(true);
      
      // Datos para enviar al servidor
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedMembers.map(member => member.id)
      };
      
      console.log('Creando grupo con datos:', groupData);
      console.log('Miembros seleccionados:', selectedMembers);
      
      // Si hay imagen, subirla primero
      if (groupImage) {
        setIsUploadingImage(true);
        try {
          const headers = getAuthHeaders();
          const uploadResponse = await apiService.uploadImage(groupImage, headers);
          
          if (uploadResponse.success && uploadResponse.data && uploadResponse.data.image_url) {
            groupData.image_url = uploadResponse.data.image_url;
          } else {
            console.warn('No se pudo obtener la URL de la imagen subida');
          }
        } catch (uploadError) {
          console.error('Error al subir imagen:', uploadError);
          error('Error', t('imageUploadError'));
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      // Crear el grupo usando el endpoint real
      const headers = getAuthHeaders();
      const response = await apiService.createGroup(groupData, headers);
      
      if (response.success) {
        success(t('groupCreated'), t('groupCreatedSuccess'));
        
        // Llamar al callback de éxito para volver a la pantalla anterior
        navigation.navigate('Home');
      } else {
        console.error('Error al crear grupo:', response);
        error('Error', response.message || t('groupCreationError'));
      }
    } catch (error) {
      console.error('Error al crear grupo:', error);
      error('Error', t('groupCreationError'));
    } finally {
      setIsCreating(false);
      setIsUploadingImage(false);
    }
  };

  // Renderizar un elemento de la lista de resultados de búsqueda
  const renderUserItem = ({ item }) => {
    const isSelected = selectedMembers.some(member => member.id === item.id);
    
    return (
      <TouchableOpacity
        onPress={() => toggleMemberSelection(item)}
        style={[
          styles.listItem,
          {
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 8,
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }
        ]}
      >
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
            <Text style={styles.listItemTitle}>{item.name} {item.lastname}</Text>
            <Text style={styles.listItemSubtitle}>@{item.username}</Text>
          </View>
        </View>
        
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: isSelected ? colors.success[500] : 'transparent',
          borderWidth: isSelected ? 0 : 1,
          borderColor: isDarkMode ? colors.dark.border : colors.light.border,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
       
        {/* Formulario */}
        <View style={styles.cardCompact}>
          {/* Foto del grupo */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity 
              onPress={showImageOptions}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: isDarkMode ? colors.dark.border : colors.light.border,
                borderStyle: 'dashed',
                overflow: 'hidden',
              }}
              disabled={isUploadingImage}
            >
              {groupImage ? (
                <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image 
                    source={{ uri: groupImage.uri }} 
                    style={{ width: '100%', height: '100%', borderRadius: 48 }}
                  />
                  <TouchableOpacity 
                    onPress={removeImage}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {isUploadingImage ? (
                    <ActivityIndicator size="large" color={colors.primary[500]} />
                  ) : (
                    <>
                      <Ionicons name="camera" size={32} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
                      <Text style={[styles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                        {t('addPhoto')}
                      </Text>
                    </>
                  )}
                </>
              )}
            </TouchableOpacity>
            <Text style={[styles.textSecondary, { fontSize: 12, marginTop: 8, textAlign: 'center' }]}>
              {groupImage ? t('changePhoto') : t('optionalPhoto')}
            </Text>
          </View>
          
          {/* Nombre del grupo */}
          <Text style={styles.inputLabel}>{t('groupName')}*</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="people-outline" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              ref={groupNameInputRef}
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
              placeholder="Ej: Familia Viñals"
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              autoCapitalize="words"
              editable={!isCreating}
              maxLength={50}
              returnKeyType="next"
              onSubmitEditing={() => groupDescriptionInputRef.current?.focus()}
            />
          </View>
          
          <View style={{ height: 16 }} />
          
          {/* Descripción del grupo */}
          <Text style={styles.inputLabel}>{t('groupDescription')}</Text>
          <View style={[styles.inputContainer, { minHeight: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
            <Ionicons 
              name="document-text-outline" 
              size={18} 
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              style={{ marginTop: 4 }}
            />
            <TextInput
              ref={groupDescriptionInputRef}
              value={groupDescription}
              onChangeText={setGroupDescription}
              style={[styles.input, { textAlignVertical: 'top', height: 80 }]}
              placeholder={t('groupDescriptionPlaceholder')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              multiline={true}
              numberOfLines={4}
              editable={!isCreating}
              maxLength={200}
              returnKeyType="done"
            />
          </View>
          
          <View style={{ height: 24 }} />
          
          {/* Sección de miembros */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>{t('addMembers')}</Text>
            {selectedMembers.length > 0 && (
              <View style={{
                backgroundColor: colors.primary[500],
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  {selectedMembers.length} {selectedMembers.length === 1 ? t('selectedCount') : t('selectedCountPlural')}
                </Text>
              </View>
            )}
          </View>
          
          {/* Buscador de usuarios */}
          <View style={styles.inputContainer}>
            <Ionicons name="search" size={18} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
              placeholder={t('searchUsers')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              autoCapitalize="none"
              editable={!isCreating}
            />
            {isLoadingUsers && (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            )}
          </View>
          
          {/* Resultados de búsqueda */}
          {searchQuery.length >= 2 && (
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.textSecondary, { flex: 1 }]}>
                  {isLoadingUsers 
                    ? t('searchingUsers') 
                    : hasSearched && searchResults.length === 0
                      ? t('noUsersFound')
                      : searchResults.length > 0 
                        ? `${searchResults.length} ${t('usersFound')}` 
                        : ''
                  }
                </Text>
                {searchResults.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      onPress={selectAllUsers}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: colors.primary[500],
                        borderRadius: 16,
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        {t('selectAll')}
                      </Text>
                    </TouchableOpacity>
                    {selectedMembers.length > 0 && (
                      <TouchableOpacity 
                        onPress={deselectAllUsers}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          backgroundColor: colors.error[500],
                          borderRadius: 16,
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                          {t('clear')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              
              {isLoadingUsers ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="large" color={colors.primary[500]} />
                  <Text style={[styles.textSecondary, { marginTop: 8 }]}>
                    {t('searchingUsers')}
                  </Text>
                </View>
              ) : hasSearched && searchResults.length === 0 ? (
                <View style={{ 
                  alignItems: 'center', 
                  paddingVertical: 20,
                  backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                  borderRadius: 12,
                }}>
                  <Ionicons name="search" size={32} color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} />
                  <Text style={[styles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
                    {t('noUsersFound')}
                  </Text>
                  <Text style={[styles.textSecondary, { fontSize: 12, marginTop: 4, textAlign: 'center' }]}>
                    {t('tryDifferentSearch')}
                  </Text>
                </View>
              ) : (
                searchResults.map((user) => (
                  renderUserItem({ item: user })
                ))
              )}
            </View>
          )}
          
          {/* Miembros seleccionados */}
          {selectedMembers.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  {t('selectedMembers')} ({selectedMembers.length})
                </Text>
                <TouchableOpacity 
                  onPress={deselectAllUsers}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: colors.error[500],
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                    {t('clearAll')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {selectedMembers.map((member) => (
                <View 
                  key={member.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                    borderRadius: 12,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.primary[500],
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary[500],
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons name="person" size={16} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listItemTitle}>{member.name} {member.lastname}</Text>
                      <Text style={styles.listItemSubtitle}>@{member.username}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={() => removeMember(member.id)}
                    style={{
                      padding: 4,
                      borderRadius: 12,
                      backgroundColor: colors.error[100],
                    }}
                  >
                    <Ionicons name="close" size={16} color={colors.error[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Botón de crear */}
        <TouchableOpacity 
          onPress={handleCreateGroup} 
          style={[styles.button, { marginTop: 24, opacity: isCreating ? 0.7 : 1 }]}
          disabled={isCreating}
        >
          {isCreating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>
                {isUploadingImage ? t('uploadingImage') : t('creatingGroup')}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>{t('createGroup')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateGroupScreen; 