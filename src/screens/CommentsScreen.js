import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ENV } from '../config/env';
import { createComponentStyles } from '../styles/components';
import { colors } from '../styles/colors';
import Skeleton from '../components/Skeleton';
import socketService from '../services/socket.service';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CommentsScreen = ({ navigation, route }) => {
  const { group, series } = route?.params || {};
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user, accessToken } = useAuth();
  const { success, error, info } = useToast();
  const styles = createComponentStyles(isDarkMode);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  // Generar room ID: comentario_idgrupo_idserie
  const roomId = `comentario_${group?.id}_${series?.id}`;

  // Configurar el header de navegación
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        title: t('comments'),
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
      });
    }
  }, [navigation, isDarkMode, t]);

  // Conectar al room de comentarios inmediatamente al entrar
  useEffect(() => {
    const connectToCommentsRoom = async () => {
      if (!group?.id || !series?.id) {
        console.log('❌ Faltan datos para conectar al room de comentarios');
        console.log('📊 Datos disponibles:', {
          groupId: group?.id,
          seriesId: series?.id
        });
        return;
      }

      try {
        console.log('🚪 Uniéndose al room de comentarios:', roomId);
        if (socketService.socket && typeof socketService.socket.emit === 'function') {
          socketService.socket.emit('join_comments_room', { groupId: group.id, seriesId: series.id });
        }
        setSocketConnected(true);
        console.log('✅ Unido exitosamente al room de comentarios');
      } catch (error) {
        console.error('❌ Error uniéndose al room de comentarios:', error);
        setSocketConnected(false);
        error('Error de conexión', 'No se pudo unir al room de comentarios');
      }
    };

    // Conectar inmediatamente cuando se monta el componente
    connectToCommentsRoom();

    // Cleanup al desmontar
    return () => {
      if (socketConnected && socketService.socket && typeof socketService.socket.emit === 'function') {
        console.log('🚪 Saliendo del room de comentarios al salir');
        socketService.socket.emit('leave_comments_room', { groupId: group?.id, seriesId: series?.id });
        setSocketConnected(false);
      }
    };
  }, [group?.id, series?.id]); // Removido roomId de las dependencias para evitar reconexiones innecesarias

  // Configurar listeners de socket para comentarios inmediatamente
  useEffect(() => {
    const handleNewComment = (data) => {
      console.log('💬 Nuevo comentario recibido:', data);
      if (data && data.success) {
        // Aquí procesarías el nuevo comentario cuando tengas el backend
        info('En desarrollo', t('commentsInProgress'));
      }
    };

    const handleCommentDeleted = (data) => {
      console.log('🗑️ Comentario eliminado:', data);
      if (data && data.success) {
        // Aquí procesarías la eliminación cuando tengas el backend
        info('En desarrollo', t('commentsInProgress'));
      }
    };

    const handleCommentEdited = (data) => {
      console.log('✏️ Comentario editado:', data);
      if (data && data.success) {
        // Aquí procesarías la edición cuando tengas el backend
        info('En desarrollo', t('commentsInProgress'));
      }
    };

    const handleGenericError = (errorData) => {
      console.log('❌ Error genérico en comentarios:', errorData);
      error('Error', errorData.message || 'Error en comentarios');
    };

    // Registrar listeners inmediatamente
    console.log('🔧 Registrando listeners de socket para CommentsScreen');
    socketService.on('new-comment', handleNewComment);
    socketService.on('comment-deleted', handleCommentDeleted);
    socketService.on('comment-edited', handleCommentEdited);
    socketService.on('error', handleGenericError);
    console.log('✅ Listeners registrados correctamente');

    // Cleanup listeners
    return () => {
      socketService.off('new-comment', handleNewComment);
      socketService.off('comment-deleted', handleCommentDeleted);
      socketService.off('comment-edited', handleCommentEdited);
      socketService.off('error', handleGenericError);
    };
  }, []); // Sin dependencias para que se ejecute solo una vez al montar

  // Cargar comentarios reales desde el endpoint al montar
  useEffect(() => {
    const fetchComments = async () => {
      if (!group?.id || !series?.id) return;
      setLoading(true);
      try {
        const response = await fetch(`${ENV.API_URL}/api/v1/groups/${group.id}/series/${series.id}/comments`);
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          // Convertir los comentarios al formato usado en la UI
          const loadedComments = json.data.map(c => ({
            id: c.id,
            user: {
              id: c.userId,
              name: c.name || '',
              username: c.username || '',
              avatar: null,
            },
            content: c.message,
            created_at: new Date(c.timestamp),
            replies: [], // Puedes mapear replies si tu backend los soporta
          }));
          setComments(loadedComments);
        } else {
          setComments([]);
        }
      } catch (err) {
        setComments([]);
        error('Error', 'No se pudieron cargar los comentarios');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [group?.id, series?.id]);

  // Listener para cuando se sale de la pantalla
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (socketConnected && socketService.socket && typeof socketService.socket.emit === 'function') {
        console.log('🚪 Saliendo del room de comentarios al salir de la pantalla');
        socketService.socket.emit('leave_comments_room', { groupId: group?.id, seriesId: series?.id });
        setSocketConnected(false);
      }
    });
    return unsubscribe;
  }, [navigation, socketConnected, group?.id, series?.id]);

  // Función para formatear tiempo relativo
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('minutes') + ' 1';
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('minutes')}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${t('hours')}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ${t('days')}`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} ${t('weeks')}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} ${t('months')}`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${t('years')}`;
  };

  // Función para publicar comentario
  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setPosting(true);

    // Construir el payload para el socket
    const payload = {
      groupId: group?.id,
      seriesId: series?.id,
      message: newComment.trim(),
      token: accessToken ? `Bearer ${accessToken}` : null,
      replyTo: null // Por ahora, solo comentarios raíz
    };

    // Emitir el evento al socket (si está conectado)
    if (socketService.socket && socketService.isConnected) {
      socketService.socket.emit('add_comment', payload);
      console.log('🟢 Evento add_comment emitido:', payload);
      

    } else {
      console.warn('⚠️ Socket no conectado, no se pudo emitir add_comment');
    }

    setNewComment('');
    setPosting(false);
  };

  // Listener para comentarios nuevos desde el socket real
  useEffect(() => {
    const handleNewComment = (data) => {
      if (data && data.groupId === group?.id && data.seriesId === series?.id) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newCommentObj = {
          id: Date.now(), // Generar un ID único para el comentario nuevo
          user: {
            id: data.userId,
            name: data.name || '',
            username: data.username || '',
            avatar: null,
          },
          content: data.message,
          created_at: new Date(data.timestamp),
          replies: [],
        };
        setComments(prev => [newCommentObj, ...prev]);
      }
    };

    if (socketService.socket) {
      socketService.socket.on('new_comment', handleNewComment);
    }
    return () => {
      if (socketService.socket) {
        socketService.socket.off('new_comment', handleNewComment);
      }
    };
  }, [group?.id, series?.id]);

  // Función para responder
  const handleReply = (commentId) => {
    info('En desarrollo', t('commentsInProgress'));
  };

  // Función para editar comentario
  const handleEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  // Función para guardar edición
  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    
    setComments(prev => 
      prev.map(comment => 
        comment.id === editingComment 
          ? { ...comment, content: editText.trim() }
          : comment
      )
    );
    
    setEditingComment(null);
    setEditText('');
    info('En desarrollo', t('commentsInProgress'));
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  // Función para eliminar comentario
  const handleDelete = (commentId) => {
    Alert.alert(
      t('deleteComment'),
      '¿Estás seguro de que quieres eliminar este comentario?',
      [
        { text: t('cancelEdit'), style: 'cancel' },
        { 
          text: t('deleteComment'), 
          style: 'destructive',
          onPress: () => {
            setComments(prev => prev.filter(comment => comment.id !== commentId));
            info('En desarrollo', t('commentsInProgress'));
          }
        }
      ]
    );
  };

  // Renderizar avatar de usuario
  const renderAvatar = (user) => (
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    }}>
      {user.avatar ? (
        <Image 
          source={{ uri: user.avatar }} 
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
      ) : (
        <Ionicons name="person" size={20} color="white" />
      )}
    </View>
  );

  // Renderizar un comentario
  const renderComment = ({ item: comment }) => (
    <View style={{
      backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {renderAvatar(comment.user)}
        <View style={{ flex: 1 }}>
          <Text style={[styles.listItemTitle, { fontSize: 14 }]}>
            {comment.user.name}
          </Text>
          <Text style={[styles.textSecondary, { fontSize: 12 }]}>
            @{comment.user.username} • {formatTimeAgo(comment.created_at)} {t('ago')}
          </Text>
        </View>
        {comment.user.id === user?.id && (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              onPress={() => handleEdit(comment)}
              style={{ marginRight: 8 }}
            >
              <Ionicons 
                name="pencil" 
                size={16} 
                color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(comment.id)}>
              <Ionicons 
                name="trash" 
                size={16} 
                color={colors.error[500]} 
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {editingComment === comment.id ? (
        <View style={{ marginBottom: 8 }}>
          <TextInput
            style={[styles.input, { marginBottom: 8 }]}
            value={editText}
            onChangeText={setEditText}
            placeholder={t('commentPlaceholder')}
            placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
            multiline
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity 
              onPress={handleCancelEdit}
              style={{ marginRight: 8 }}
            >
              <Text style={{ color: colors.error[500], fontWeight: '600' }}>
                {t('cancelEdit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={{ color: colors.primary[500], fontWeight: '600' }}>
                {t('saveEdit')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={[styles.text, { marginBottom: 8 }]}>
          {comment.content}
        </Text>
      )}
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        
        <TouchableOpacity 
          onPress={() => handleReply(comment.id)}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={16} 
            color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
          />
          <Text style={[styles.textSecondary, { marginLeft: 4, fontSize: 12 }]}>
            {t('reply')}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Respuestas */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={{ marginTop: 12, marginLeft: 20 }}>
          {comment.replies.map(reply => (
            <View key={reply.id} style={{
              backgroundColor: isDarkMode ? colors.dark.surfaceTertiary : colors.light.surfaceTertiary,
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
            }}>
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                {renderAvatar(reply.user)}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listItemTitle, { fontSize: 13 }]}>
                    {reply.user.name}
                  </Text>
                  <Text style={[styles.textSecondary, { fontSize: 11 }]}>
                    @{reply.user.username} • {formatTimeAgo(reply.created_at)} {t('ago')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.text, { fontSize: 13 }]}>
                {reply.content}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Renderizar skeleton mientras carga
  const renderSkeleton = () => (
    <View>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={{
          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        }}>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Skeleton width={120} height={16} borderRadius={8} style={{ marginBottom: 4 }} />
              <Skeleton width={80} height={12} borderRadius={6} />
            </View>
          </View>
          <Skeleton width="100%" height={16} borderRadius={8} style={{ marginBottom: 4 }} />
          <Skeleton width="70%" height={16} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width={60} height={12} borderRadius={6} />
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDarkMode ? colors.dark.background : colors.light.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {/* Header de la serie */}
        <View style={[styles.card, { marginBottom: 20, alignItems: 'center' }]}>
          <Text style={[styles.cardTitle, { fontSize: 18, marginBottom: 8, textAlign: 'center' }]}>
            {series?.name || t('series')}
          </Text>
          <Text style={[styles.textSecondary, { textAlign: 'center' }]}>
            {t('comments')} • {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </Text>
        </View>

        {/* Lista de comentarios */}
        {loading ? (
          renderSkeleton()
        ) : comments.length > 0 ? (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderComment}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={{ 
                backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                borderRadius: 12,
                padding: 32,
                alignItems: 'center',
              }}>
                <Ionicons 
                  name="chatbubble-outline" 
                  size={48} 
                  color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
                  style={{ marginBottom: 16 }}
                />
                <Text style={[styles.cardTitle, { marginBottom: 8, textAlign: 'center' }]}>
                  {t('noComments')}
                </Text>
                <Text style={[styles.textSecondary, { textAlign: 'center' }]}>
                  {t('noCommentsSubtitle')}
                </Text>
              </View>
            }
          />
        ) : (
          <View style={{ 
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
          }}>
            <Ionicons 
              name="chatbubble-outline" 
              size={48} 
              color={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary} 
              style={{ marginBottom: 16 }}
            />
            <Text style={[styles.cardTitle, { marginBottom: 8, textAlign: 'center' }]}>
              {t('noComments')}
            </Text>
            <Text style={[styles.textSecondary, { textAlign: 'center' }]}>
              {t('noCommentsSubtitle')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input para nuevo comentario */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface,
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? colors.dark.border : colors.light.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
      }}>
        <View style={{
          flex: 1,
          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginRight: 8,
        }}>
          <TextInput
            style={{
              color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary,
              fontSize: 16,
            }}
            placeholder={t('commentPlaceholder')}
            placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity 
          onPress={handlePostComment}
          disabled={!newComment.trim() || posting}
          style={{
            backgroundColor: newComment.trim() ? colors.primary[500] : colors.primary[300],
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            minWidth: 60,
            alignItems: 'center',
          }}
        >
          {posting ? (
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {t('postingComment')}
            </Text>
          ) : (
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {t('postComment')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentsScreen;
