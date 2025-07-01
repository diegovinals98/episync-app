import { colors } from './colors';
import { spacing } from './spacing';

export const createComponentStyles = (isDarkMode) => ({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? colors.dark.background : colors.light.background,
  },

  // Fondo con gradiente
  gradientBackground: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: isDarkMode ? colors.dark.text : colors.light.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
    marginTop: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: isDarkMode ? colors.dark.shadow : colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Cards
  card: {
    backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: isDarkMode ? colors.dark.shadow : colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardCompact: {
    backgroundColor: isDarkMode ? colors.dark.surface : colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: isDarkMode ? colors.dark.shadow : colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSmall: {
    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    shadowColor: isDarkMode ? colors.dark.shadow : colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Card con gradiente
  gradientCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  // Tipografía
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: isDarkMode ? colors.dark.text : colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
    lineHeight: 22,
  },
  text: {
    fontSize: 16,
    color: isDarkMode ? colors.dark.text : colors.light.text,
  },
  textSecondary: {
    fontSize: 14,
    color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
    lineHeight: 20,
  },
  textTertiary: {
    fontSize: 12,
    color: isDarkMode ? colors.dark.textTertiary : colors.light.textTertiary,
  },
  textLink: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '500',
  },

  // Inputs
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDarkMode ? colors.dark.text : colors.light.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.dark.border : colors.light.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: isDarkMode ? colors.dark.text : colors.light.text,
    marginLeft: 12,
  },
  iconSmall: {
    marginRight: 8,
  },

  // Botones
  button: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? colors.dark.border : colors.light.border,
    flex: 1,
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDarkMode ? colors.dark.text : colors.light.text,
  },
  buttonSmall: {
    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmallText: {
    fontSize: 12,
    fontWeight: '500',
    color: isDarkMode ? colors.dark.text : colors.light.text,
  },

  // Separador
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: isDarkMode ? colors.dark.border : colors.light.border,
  },
  separatorText: {
    fontSize: 14,
    color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
    marginHorizontal: 16,
    fontWeight: '500',
  },

  // Lista de elementos
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? colors.dark.border : colors.light.border,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: isDarkMode ? colors.dark.text : colors.light.text,
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary,
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  // Badge
  badge: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Progress bar
  progressContainer: {
    height: 6,
    backgroundColor: isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },

  // Status indicators
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: colors.success[500],
  },
  statusOffline: {
    backgroundColor: colors.secondary[400],
  },
  statusAway: {
    backgroundColor: colors.warning[500],
  },
}); 