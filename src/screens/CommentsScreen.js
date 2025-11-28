import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
  Keyboard,
  Animated,
  Dimensions,
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
  const [socketConnected, setSocketConnected] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

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

  // Listener para el teclado - scroll automático cuando aparece
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Scroll al final cuando aparece el teclado
        setTimeout(() => {
          if (flatListRef.current && comments.length > 0) {
            try {
              flatListRef.current.scrollToIndex({ index: 0, animated: true });
            } catch (e) {
              // Ignorar errores de scroll
            }
          }
        }, 300);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, [comments.length]);

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
    
    // Scroll al final después de publicar
    setTimeout(() => {
      if (flatListRef.current && comments.length > 0) {
        flatListRef.current.scrollToIndex({ index: 0, animated: true });
      }
    }, 100);
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

  // Renderizar avatar de usuario
  const renderAvatar = (user, isOwn = false) => {
    const avatarSize = 36;
    return (
      <View style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        backgroundColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: isOwn ? 8 : 0,
        marginLeft: isOwn ? 8 : 0,
        marginRight: isOwn ? 0 : 8,
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      }}>
        {user.avatar ? (
          <Image 
            source={{ uri: user.avatar }} 
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          />
        ) : (
          <Ionicons name="person" size={18} color="white" />
        )}
      </View>
    );
  };

  // Invertir los comentarios para que los más recientes estén abajo
  const reversedComments = [...comments].reverse();

  // Renderizar un comentario
  const renderComment = ({ item: comment, index }) => {
    const isOwn = comment.user.id === user?.id;
    // Como la lista está invertida, el índice 0 es el último elemento visualmente
    // Comparar con el siguiente elemento en el array (que visualmente está arriba)
    const nextIndex = index + 1;
    const showAvatar = index === reversedComments.length - 1 || reversedComments[nextIndex]?.user.id !== comment.user.id;
    
    return (
      <View style={{
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 16,
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
      }}>
        {!isOwn && (
          <View style={{ width: 36, marginRight: 8 }}>
            {showAvatar ? renderAvatar(comment.user, false) : <View style={{ width: 36 }} />}
          </View>
        )}
        
        <View style={{
          maxWidth: '75%',
          flexDirection: 'column',
        }}>
          {showAvatar && !isOwn && (
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
              marginBottom: 4,
              marginLeft: 4,
            }}>
              {comment.user.name}
            </Text>
          )}
          
          <View style={{
            backgroundColor: isOwn 
              ? colors.primary[500] 
              : (isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary),
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderTopLeftRadius: isOwn ? 18 : 4,
            borderTopRightRadius: isOwn ? 4 : 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <Text style={{
              color: isOwn ? 'white' : (isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary),
              fontSize: 15,
              lineHeight: 20,
            }}>
              {comment.content}
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginTop: 6,
              justifyContent: 'flex-end',
            }}>
              <Text style={{
                fontSize: 11,
                color: isOwn ? 'rgba(255, 255, 255, 0.7)' : (isDarkMode ? colors.dark.textTertiary : colors.light.textTertiary),
              }}>
                {formatTimeAgo(comment.created_at)}
              </Text>
            </View>
          </View>
        </View>
        
        {isOwn && (
          <View style={{ width: 36, marginLeft: 8 }}>
            {showAvatar ? renderAvatar(comment.user, true) : <View style={{ width: 36 }} />}
          </View>
        )}
      </View>
    );
  };

  // Renderizar skeleton mientras carga
  const renderSkeleton = () => {
    const screenWidth = Dimensions.get('window').width;
    
    return (
      <View style={{ paddingTop: 16 }}>
        {[1, 2, 3, 4, 5].map((_, index) => {
          const messageWidth = (screenWidth - 32 - 36 - 8) * (index % 2 === 0 ? 0.6 : 0.55);
          return (
            <View 
              key={index} 
              style={{ 
                flexDirection: 'row',
                paddingHorizontal: 16,
                marginBottom: 12,
                justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              {index % 2 === 0 && (
                <Skeleton 
                  width={36} 
                  height={36} 
                  borderRadius={18} 
                  style={{ marginRight: 8 }} 
                />
              )}
              <View style={{
                width: messageWidth,
                backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
                borderRadius: 18,
                borderTopLeftRadius: index % 2 === 0 ? 4 : 18,
                borderTopRightRadius: index % 2 === 0 ? 18 : 4,
                padding: 12,
              }}>
                <Skeleton width={messageWidth * 0.8} height={14} borderRadius={7} style={{ marginBottom: 6 }} />
                <Skeleton width={messageWidth * 0.6} height={14} borderRadius={7} style={{ marginBottom: 4 }} />
                <Skeleton width={messageWidth * 0.4} height={10} borderRadius={5} />
              </View>
              {index % 2 !== 0 && (
                <Skeleton 
                  width={36} 
                  height={36} 
                  borderRadius={18} 
                  style={{ marginLeft: 8 }} 
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? colors.dark.background : colors.light.background 
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header de la serie */}
      <View style={{
        backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary,
          marginBottom: 4,
        }}>
          {series?.name || t('series')}
        </Text>
        <Text style={{
          fontSize: 13,
          color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
        }}>
          {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
        </Text>
      </View>

      {/* Lista de comentarios */}
      {loading ? (
        <View style={{ flex: 1, paddingTop: 16 }}>
          {renderSkeleton()}
        </View>
      ) : comments.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={reversedComments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComment}
          inverted
          contentContainerStyle={{ 
            paddingTop: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (flatListRef.current && reversedComments.length > 0) {
              flatListRef.current.scrollToIndex({ index: 0, animated: false });
            }
          }}
          onLayout={() => {
            if (flatListRef.current && reversedComments.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 0, animated: false });
              }, 100);
            }
          }}
        />
      ) : (
        <View style={{ 
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Ionicons 
              name="chatbubble-outline" 
              size={40} 
              color={isDarkMode ? colors.dark.textTertiary : colors.light.textTertiary}
            />
          </View>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {t('noComments')}
          </Text>
          <Text style={{
            fontSize: 14,
            color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            {t('noCommentsSubtitle')}
          </Text>
        </View>
      )}

      {/* Input para nuevo comentario */}
      <View style={{
        backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface,
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? colors.dark.border : colors.light.border,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
          borderRadius: 24,
          paddingHorizontal: 4,
          paddingVertical: 4,
          marginBottom: 8,
        }}>
          <View style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 10,
            maxHeight: 100,
          }}>
            <TextInput
              ref={inputRef}
              style={{
                color: isDarkMode ? colors.dark.textPrimary : colors.light.textPrimary,
                fontSize: 15,
                lineHeight: 20,
                padding: 0,
              }}
              placeholder={t('commentPlaceholder')}
              placeholderTextColor={isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              returnKeyType="default"
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity 
            onPress={handlePostComment}
            disabled={!newComment.trim() || posting}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: newComment.trim() ? colors.primary[500] : (isDarkMode ? colors.dark.surfaceTertiary : colors.light.surfaceTertiary),
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 8,
              shadowColor: newComment.trim() ? colors.primary[500] : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: newComment.trim() ? 4 : 0,
            }}
          >
            {posting ? (
              <Ionicons name="hourglass-outline" size={20} color="white" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={newComment.trim() ? 'white' : (isDarkMode ? colors.dark.textTertiary : colors.light.textTertiary)} 
              />
            )}
          </TouchableOpacity>
        </View>
        {newComment.length > 0 && (
          <Text style={{
            fontSize: 11,
            color: isDarkMode ? colors.dark.textTertiary : colors.light.textTertiary,
            textAlign: 'right',
            paddingHorizontal: 4,
          }}>
            {newComment.length}/500
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentsScreen;
