# EPISYNC

Aplicación móvil para gestionar series con familia y amigos.

## Configuración del entorno

### Desarrollo local

La aplicación está configurada para conectarse a un backend local en `https://episync.bodasofiaydiego.es`.

Para ejecutar la aplicación en modo desarrollo:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npx expo start
```

### Variables de entorno

Las variables de entorno se gestionan a través de los archivos de configuración en `src/config/`:

- `api.js`: Configuración de URLs de la API para desarrollo y producción
- `env.js`: Configuración de variables de entorno generales

### Estructura del proyecto

```
src/
  ├── components/        # Componentes reutilizables
  ├── config/            # Configuración de la aplicación
  │   ├── api.js         # Configuración de la API
  │   └── env.js         # Variables de entorno
  ├── contexts/          # Contextos de React
  │   ├── AuthContext.js # Autenticación
  │   ├── ThemeContext.js # Tema (claro/oscuro)
  │   └── LanguageContext.js # Internacionalización
  ├── screens/           # Pantallas de la aplicación
  ├── services/          # Servicios
  │   └── api.service.js # Servicio para la API
  └── styles/            # Estilos globales
```

## Características

- **Autenticación**: JWT con tokens de acceso y refresco
- **Temas**: Soporte para tema claro y oscuro
- **Idiomas**: Soporte para español e inglés
- **Notificaciones**: Sistema de toasts personalizado
- **API**: Conexión a backend mediante RESTful API

## Desarrollo

### Conexión al backend

La aplicación está configurada para conectarse a:

- **Desarrollo**: `https://episync.bodasofiaydiego.es`
- **Producción**: `https://api.episync.com` (URL ficticia por ahora)

Para cambiar la URL de la API, modifica el archivo `src/config/api.js`.

### Autenticación

Para probar la autenticación en desarrollo, puedes usar cualquier email que contenga "test" (ej: `test@example.com`) con cualquier contraseña.

## Licencia

Este proyecto es privado y confidencial. 