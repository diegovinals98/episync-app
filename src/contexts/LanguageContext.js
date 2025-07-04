import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traducciones
export const translations = {
  es: {
    // Login
    welcome: 'Bienvenido a',
    appName: 'EPISYNC',
    loginSubtitle: 'Gestiona series con familia y amigos',
    email: 'Email',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    loginButton: 'Iniciar Sesión',
    orContinueWith: 'o continúa con',
    noAccount: '¿No tienes cuenta?',
    registerHere: 'Regístrate aquí',
    pleaseCompleteFields: 'Por favor completa todos los campos',
    error: 'Error',
    
    // Registro
    register: 'Registro',
    createAccount: 'Crear Cuenta',
    registerSubtitle: 'Únete a la comunidad de EPISYNC',
    username: 'Nombre de usuario',
    usernamePlaceholder: 'Elige un nombre de usuario único',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    lastname: 'Apellido',
    lastnamePlaceholder: 'Tu apellido',
    confirmPassword: 'Confirmar Contraseña',
    registerButton: 'Registrarse',
    registering: 'Registrando...',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    loginHere: 'Inicia sesión aquí',
    
    // Home
    hello: 'Hola',
    welcomeBack: '¡Bienvenido de vuelta!',
    yourStats: 'Tus Estadísticas',
    series: 'Series',
    episodes: 'Episodios',
    hours: 'Horas',
    yourGroups: 'Tus Grupos',
    join: 'Unirse',
    create: 'Crear',
    members: 'miembros',
    popularSeries: 'Series Populares',
    groups: 'Grupos',
    recentActivity: 'Actividad Reciente',
    upcomingEpisodes: 'Próximos Episodios',
    yourSeries: 'Tus Series',
    add: 'Añadir',
    lastWatched: 'Último visto',
    completed: 'completado',
    createNewGroup: 'Crear Nuevo Grupo',
    
    // Settings
    settings: 'Configuración',
    profile: 'Perfil',
    appTheme: 'Tema de la App',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    notifications: 'Notificaciones',
    notificationsSubtitle: 'Recibe notificaciones de actividad',
    tapToChangePhoto: 'Toca para cambiar foto',
    saved: 'Guardado',
    savedMessage: 'Tus cambios han sido guardados',
    
    // General
    myGroups: 'Mis Grupos',
    noGroups: 'No tienes grupos',
    noGroupsSubtitle: 'Crea o únete a un grupo para empezar',
    createGroup: 'Crear Grupo',
    joinGroup: 'Unirse a Grupo',
    
    // Crear Grupo
    groupName: 'Nombre del grupo',
    groupNameRequired: 'El nombre del grupo es obligatorio',
    groupDescription: 'Descripción',
    groupDescriptionPlaceholder: 'Describe el propósito del grupo...',
    addMembers: 'Añadir miembros',
    searchUsers: 'Buscar por nombre o @usuario',
    searchingUsers: 'Buscando usuarios...',
    usersFound: 'usuarios encontrados',
    noUsersFound: 'No se encontraron usuarios',
    selectedMembers: 'Miembros seleccionados',
    creatingGroup: 'Creando grupo...',
    groupCreated: 'Grupo creado',
    groupCreatedSuccess: 'El grupo ha sido creado exitosamente',
    createGroupDescription: 'Crea un grupo para compartir series con amigos y familia',
    
    // Foto de grupo
    groupPhoto: 'Foto de grupo',
    addPhoto: 'Añadir foto',
    changePhoto: 'Toca para cambiar la foto',
    optionalPhoto: 'Opcional - Toca para añadir una foto',
    photoOptions: '¿Cómo quieres añadir la foto?',
    gallery: 'Galería',
    camera: 'Cámara',
    cancel: 'Cancelar',
    uploadingImage: 'Subiendo imagen...',
    permissionsRequired: 'Se necesitan permisos para acceder a la galería',
    cameraPermissionsRequired: 'Se necesitan permisos para acceder a la cámara',
    imageSelectionError: 'No se pudo seleccionar la imagen',
    photoError: 'No se pudo tomar la foto',
    imageUploadError: 'No se pudo subir la imagen, pero el grupo se creará sin foto',
    groupCreationError: 'No se pudo crear el grupo',
    
    // Selección múltiple de usuarios
    selectAll: 'Seleccionar todos',
    clearAll: 'Limpiar todo',
    clear: 'Limpiar',
    searchConnectionError: 'Error de conexión al buscar usuarios',
    loadUsersError: 'No se pudieron cargar los usuarios',
    selectedCount: 'seleccionado',
    selectedCountPlural: 'seleccionados',
    tryDifferentSearch: 'Intenta con otro nombre o username',
    
    // Detalles del grupo
    group: 'Grupo',
    admin: 'Administrador',
    addSeries: 'Añadir Serie',
    addMember: 'Añadir Miembro',
    invite: 'Invitar',
    noSeries: 'No hay series',
    noSeriesInGroup: 'Este grupo no tiene series añadidas',
    addFirstSeries: 'Añadir Primera Serie',
    noMembers: 'No hay miembros',
    noMembersInGroup: 'Este grupo no tiene miembros',
    addFirstMember: 'Añadir Primer Miembro',
    inviteMembers: 'Invitar Miembros',
    errorLoadingGroupData: 'Error al cargar los datos del grupo',
    groupSettingsComingSoon: 'Configuración del grupo próximamente',
    seriesDetailsComingSoon: 'Detalles de la serie próximamente',
    memberProfileComingSoon: 'Perfil del miembro próximamente',
    addSeriesComingSoon: 'Añadir serie próximamente',
    addMemberComingSoon: 'Añadir miembro próximamente',
    inviteMembersComingSoon: 'Invitar miembros próximamente',
    unknown: 'Desconocido',
    lastEpisode: 'Último episodio',
    member: 'Miembro',
    
    // Añadir Series
    searchSeries: 'Buscar Series',
    searchSeriesPlaceholder: 'Escribe el nombre de la serie...',
    search: 'Buscar',
    searching: 'Buscando...',
    searchResults: 'Resultados de búsqueda',
    noSeriesFound: 'No se encontraron series',
    searchForSeries: 'Buscar Series',
    searchForSeriesDescription: 'Busca series en TheMovieDatabase para añadirlas a tu grupo',
    confirmAddSeries: 'Confirmar Añadir Serie',
    addSeriesToGroup: '¿Añadir esta serie al grupo?',
    addingSeries: 'Añadiendo serie...',
    seriesAdded: 'Serie añadida',
    seriesAddedSuccess: 'La serie ha sido añadida exitosamente al grupo',
    addSeriesError: 'No se pudo añadir la serie al grupo',
    searchError: 'Error al buscar series',
    groupIdRequired: 'ID del grupo requerido',
    votes: 'votos',
    
    // Eliminar Serie
    deleteSeries: 'Eliminar Serie',
    deleteSeriesConfirmation: '¿Eliminar esta serie del grupo?',
    deleteSeriesComingSoon: 'Función de eliminación en desarrollo',
    deleteSeriesInProgress: 'Eliminación en proceso de construcción',
    
    // Comentarios
    comments: 'Comentarios',
    noComments: 'No hay comentarios',
    noCommentsSubtitle: 'Sé el primero en comentar sobre esta serie',
    addComment: 'Añadir comentario',
    commentPlaceholder: 'Escribe tu comentario...',
    postComment: 'Publicar',
    postingComment: 'Publicando...',
    commentPosted: 'Comentario publicado',
    commentPostedSuccess: 'Tu comentario ha sido publicado',
    commentError: 'No se pudo publicar el comentario',
    commentsComingSoon: 'Sistema de comentarios en desarrollo',
    commentsInProgress: 'Comentarios en proceso de construcción',
    reply: 'Responder',
    deleteComment: 'Eliminar comentario',
    editComment: 'Editar comentario',
    saveEdit: 'Guardar',
    cancelEdit: 'Cancelar',
    commentDeleted: 'Comentario eliminado',
    commentEdited: 'Comentario editado',
    ago: 'hace',
    minutes: 'minutos',
    hours: 'horas',
    days: 'días',
    weeks: 'semanas',
    months: 'meses',
    years: 'años',
  },
  en: {
    // Login
    welcome: 'Welcome to',
    appName: 'EPISYNC',
    loginSubtitle: 'Manage series with family and friends',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    loginButton: 'Login',
    orContinueWith: 'or continue with',
    noAccount: "Don't have an account?",
    registerHere: 'Register here',
    pleaseCompleteFields: 'Please complete all fields',
    error: 'Error',
    
    // Registro
    register: 'Register',
    createAccount: 'Create Account',
    registerSubtitle: 'Join the EPISYNC community',
    username: 'Username',
    usernamePlaceholder: 'Choose a unique username',
    name: 'Name',
    namePlaceholder: 'Your name',
    lastname: 'Last name',
    lastnamePlaceholder: 'Your last name',
    confirmPassword: 'Confirm Password',
    registerButton: 'Register',
    registering: 'Registering...',
    alreadyHaveAccount: 'Already have an account?',
    loginHere: 'Login here',
    
    // Home
    hello: 'Hello',
    welcomeBack: 'Welcome back!',
    yourStats: 'Your Stats',
    series: 'Series',
    episodes: 'Episodes',
    hours: 'Hours',
    yourGroups: 'Your Groups',
    join: 'Join',
    create: 'Create',
    members: 'members',
    popularSeries: 'Popular Series',
    groups: 'Groups',
    recentActivity: 'Recent Activity',
    upcomingEpisodes: 'Upcoming Episodes',
    yourSeries: 'Your Series',
    add: 'Add',
    lastWatched: 'Last watched',
    completed: 'completed',
    createNewGroup: 'Create New Group',
    
    // Settings
    settings: 'Settings',
    profile: 'Profile',
    appTheme: 'App Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    notifications: 'Notifications',
    notificationsSubtitle: 'Receive activity notifications',
    tapToChangePhoto: 'Tap to change photo',
    saved: 'Saved',
    savedMessage: 'Your changes have been saved',
    
    // General
    myGroups: 'My Groups',
    noGroups: 'You have no groups',
    noGroupsSubtitle: 'Create or join a group to get started',
    createGroup: 'Create Group',
    joinGroup: 'Join Group',
    
    // Create Group
    groupName: 'Group name',
    groupNameRequired: 'Group name is required',
    groupDescription: 'Description',
    groupDescriptionPlaceholder: 'Describe the purpose of the group...',
    addMembers: 'Add members',
    searchUsers: 'Search by name or @username',
    searchingUsers: 'Searching users...',
    usersFound: 'users found',
    noUsersFound: 'No users found',
    selectedMembers: 'Selected members',
    creatingGroup: 'Creating group...',
    groupCreated: 'Group created',
    groupCreatedSuccess: 'The group has been successfully created',
    createGroupDescription: 'Create a group to share series with friends and family',
    
    // Group photo
    groupPhoto: 'Group photo',
    addPhoto: 'Add photo',
    changePhoto: 'Tap to change photo',
    optionalPhoto: 'Optional - Tap to add a photo',
    photoOptions: 'How do you want to add the photo?',
    gallery: 'Gallery',
    camera: 'Camera',
    cancel: 'Cancel',
    uploadingImage: 'Uploading image...',
    permissionsRequired: 'Permissions are required to access the gallery',
    cameraPermissionsRequired: 'Permissions are required to access the camera',
    imageSelectionError: 'Could not select image',
    photoError: 'Could not take photo',
    imageUploadError: 'Could not upload image, but the group will be created without photo',
    groupCreationError: 'Could not create group',
    
    // Multiple user selection
    selectAll: 'Select all',
    clearAll: 'Clear all',
    clear: 'Clear',
    searchConnectionError: 'Connection error while searching users',
    loadUsersError: 'Could not load users',
    selectedCount: 'selected',
    selectedCountPlural: 'selected',
    tryDifferentSearch: 'Try a different name or username',
    
    // Detalles del grupo
    group: 'Group',
    admin: 'Administrator',
    addSeries: 'Add Series',
    addMember: 'Add Member',
    invite: 'Invite',
    noSeries: 'No series',
    noSeriesInGroup: 'This group has no series added',
    addFirstSeries: 'Add First Series',
    noMembers: 'No members',
    noMembersInGroup: 'This group has no members',
    addFirstMember: 'Add First Member',
    inviteMembers: 'Invite Members',
    errorLoadingGroupData: 'Error loading group data',
    groupSettingsComingSoon: 'Group settings coming soon',
    seriesDetailsComingSoon: 'Series details coming soon',
    memberProfileComingSoon: 'Member profile coming soon',
    addSeriesComingSoon: 'Add series coming soon',
    addMemberComingSoon: 'Add member coming soon',
    inviteMembersComingSoon: 'Invite members coming soon',
    unknown: 'Unknown',
    lastEpisode: 'Last episode',
    member: 'Member',
    
    // Añadir Series
    searchSeries: 'Search Series',
    searchSeriesPlaceholder: 'Enter series name...',
    search: 'Search',
    searching: 'Searching...',
    searchResults: 'Search Results',
    noSeriesFound: 'No series found',
    searchForSeries: 'Search for Series',
    searchForSeriesDescription: 'Search for series on TheMovieDatabase to add to your group',
    confirmAddSeries: 'Confirm Add Series',
    addSeriesToGroup: 'Add this series to the group?',
    addingSeries: 'Adding series...',
    seriesAdded: 'Series added',
    seriesAddedSuccess: 'The series has been successfully added to the group',
    addSeriesError: 'Could not add series to group',
    searchError: 'Error searching series',
    groupIdRequired: 'Group ID required',
    votes: 'votes',
    
    // Delete Series
    deleteSeries: 'Delete Series',
    deleteSeriesConfirmation: 'Delete this series from the group?',
    deleteSeriesComingSoon: 'Delete function in development',
    deleteSeriesInProgress: 'Delete feature under construction',
    
    // Comments
    comments: 'Comments',
    noComments: 'No comments',
    noCommentsSubtitle: 'Be the first to comment on this series',
    addComment: 'Add comment',
    commentPlaceholder: 'Write your comment...',
    postComment: 'Post',
    postingComment: 'Posting...',
    commentPosted: 'Comment posted',
    commentPostedSuccess: 'Your comment has been posted',
    commentError: 'Could not post comment',
    commentsComingSoon: 'Comment system in development',
    commentsInProgress: 'Comments under construction',
    reply: 'Reply',
    deleteComment: 'Delete comment',
    editComment: 'Edit comment',
    saveEdit: 'Save',
    cancelEdit: 'Cancel',
    commentDeleted: 'Comment deleted',
    commentEdited: 'Comment edited',
    ago: 'ago',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem('language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const languageContext = {
    language,
    changeLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={languageContext}>
      {children}
    </LanguageContext.Provider>
  );
}; 