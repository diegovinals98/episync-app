# Sistema de Loading - Documentación

## 📚 Librerías Utilizadas

### 1. **react-native-skeleton-placeholder**
- **Instalación**: `npm install react-native-skeleton-placeholder`
- **Propósito**: Skeletons profesionales y elegantes para estados de carga
- **Ventajas**: Animaciones suaves, fácil de usar, altamente personalizable

### 2. **react-native-reanimated** (ya instalado)
- **Propósito**: Animaciones de alto rendimiento para el overlay de loading
- **Uso**: Animaciones del icono rotatorio y efectos de escala

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **LoadingContext** (`src/contexts/LoadingContext.js`)
   - Contexto global para manejar estados de loading
   - Soporta múltiples loadings simultáneos con claves únicas
   - Loading global con overlay modal

2. **LoadingButton** (`src/components/LoadingButton.js`)
   - Botón con estado de loading integrado
   - Variantes: primary, secondary, outline, danger
   - Tamaños: small, medium, large

3. **EnhancedSkeleton** (`src/components/EnhancedSkeleton.js`)
   - Skeletons predefinidos para diferentes componentes
   - GroupCardSkeleton, SeriesCardSkeleton, EpisodeListSkeleton, HeaderSkeleton

### Hooks Personalizados

1. **useApiLoading** (`src/hooks/useApiLoading.js`)
   - Hook para manejar loading en llamadas a la API
   - Ejecuta funciones async y maneja automáticamente el estado

2. **useSocketLoading** (`src/hooks/useSocketLoading.js`)
   - Hook para manejar loading durante eventos de socket
   - Monitorea estado de conexión

## 📖 Guía de Uso

### 1. Loading en Llamadas a la API

```javascript
import { useApiLoading } from '../hooks/useApiLoading';
import { apiService } from '../services/api.service';

const MyScreen = () => {
  const { loading, execute } = useApiLoading('fetchUserGroups');

  const fetchData = async () => {
    try {
      await execute(async () => {
        const response = await apiService.getUserGroups(headers);
        // Procesar respuesta
        setUserGroups(response.data);
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View>
      {loading && <ActivityIndicator />}
      {/* Contenido */}
    </View>
  );
};
```

### 2. Loading Global (Overlay)

```javascript
import { useLoading } from '../contexts/LoadingContext';

const MyComponent = () => {
  const { setGlobalLoading } = useLoading();

  const handleAction = async () => {
    setGlobalLoading(true, 'Procesando...');
    try {
      // Operación
      await someAsyncOperation();
    } finally {
      setGlobalLoading(false);
    }
  };
};
```

### 3. Loading con Clave Específica

```javascript
import { useLoading } from '../contexts/LoadingContext';

const MyComponent = () => {
  const { startLoading, stopLoading, isLoading } = useLoading();

  const handleAction = async () => {
    startLoading('myAction', 'Cargando datos...');
    try {
      // Operación
      await someOperation();
    } finally {
      stopLoading('myAction');
    }
  };

  const isMyActionLoading = isLoading('myAction');
};
```

### 4. LoadingButton

```javascript
import LoadingButton from '../components/LoadingButton';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      title="Enviar"
      loading={loading}
      onPress={handleSubmit}
      variant="primary"
      size="medium"
      icon="send"
      iconPosition="right"
    />
  );
};
```

### 5. Skeletons

```javascript
import { GroupCardSkeleton, SeriesCardSkeleton } from '../components/EnhancedSkeleton';

const MyScreen = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <View>
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </View>
    );
  }

  return (
    // Contenido real
  );
};
```

### 6. Loading para Eventos de Socket

```javascript
import { useSocketLoading } from '../hooks/useSocketLoading';

const MyComponent = () => {
  const { loading, connectionStatus } = useSocketLoading(
    'series-added-to-group',
    'addingSeries',
    (data) => {
      // Manejar evento
      console.log('Serie añadida:', data);
    }
  );

  const handleAddSeries = () => {
    // Emitir evento de socket
    socketService.addSeriesToGroup(groupId, seriesData);
  };

  return (
    <View>
      {!connectionStatus && <Text>Reconectando...</Text>}
      {loading && <ActivityIndicator />}
    </View>
  );
};
```

## 🎨 Personalización

### Colores del Loading Overlay

Los colores se adaptan automáticamente al tema (claro/oscuro) usando `ThemeContext`.

### Velocidad de Animación

En `EnhancedSkeleton`, puedes ajustar la velocidad:
```javascript
<SkeletonPlaceholder speed={1200} /> // Más rápido
<SkeletonPlaceholder speed={2000} /> // Más lento
```

## ✅ Mejores Prácticas

1. **Usa claves únicas** para cada operación de loading
2. **Siempre limpia** el loading en el bloque `finally`
3. **Usa skeletons** para la primera carga de datos
4. **Usa ActivityIndicator** para acciones rápidas
5. **Usa LoadingOverlay** para operaciones críticas que bloquean la UI
6. **Muestra mensajes descriptivos** al usuario

## 🔄 Integración en Pantallas Existentes

Para integrar en una pantalla existente:

1. Importa el hook necesario:
```javascript
import { useApiLoading } from '../hooks/useApiLoading';
```

2. Reemplaza estados locales de loading:
```javascript
// Antes
const [loading, setLoading] = useState(false);

// Después
const { loading, execute } = useApiLoading('fetchData');
```

3. Usa `execute` para envolver llamadas a la API:
```javascript
// Antes
setLoading(true);
const response = await apiService.getData();
setLoading(false);

// Después
await execute(async () => {
  const response = await apiService.getData();
  // Procesar
});
```

## 📝 Notas

- El sistema es completamente compatible con el código existente
- Los skeletons antiguos siguen funcionando
- El LoadingContext es opcional - puedes seguir usando estados locales si prefieres
- Todos los componentes respetan el tema claro/oscuro automáticamente

