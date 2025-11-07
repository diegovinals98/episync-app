import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

const LoadingButton = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  icon,
  iconPosition = 'left', // 'left', 'right'
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { isDarkMode } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary[500],
          borderColor: colors.primary[500],
          textColor: '#ffffff',
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary[500],
          borderColor: colors.secondary[500],
          textColor: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary[500],
          textColor: colors.primary[500],
        };
      case 'danger':
        return {
          backgroundColor: colors.error[500],
          borderColor: colors.error[500],
          textColor: '#ffffff',
        };
      default:
        return {
          backgroundColor: colors.primary[500],
          borderColor: colors.primary[500],
          textColor: '#ffffff',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 16,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: 18,
          iconSize: 24,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          iconSize: 20,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: isDisabled 
            ? (isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary)
            : variantStyles.backgroundColor,
          borderColor: isDisabled
            ? (isDarkMode ? colors.dark.border : colors.light.border)
            : variantStyles.borderColor,
          borderWidth: variant === 'outline' ? 2 : 0,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: isDisabled ? 0.6 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'outline' ? colors.primary[500] : variantStyles.textColor}
            style={styles.loader}
          />
        ) : icon && iconPosition === 'left' ? (
          <Ionicons 
            name={icon} 
            size={sizeStyles.iconSize} 
            color={variant === 'outline' ? colors.primary[500] : variantStyles.textColor}
            style={styles.iconLeft}
          />
        ) : null}
        
        {!loading && (
          <Text
            style={[
              styles.text,
              {
                color: isDisabled
                  ? (isDarkMode ? colors.dark.textSecondary : colors.light.textSecondary)
                  : variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
        
        {!loading && icon && iconPosition === 'right' && (
          <Ionicons 
            name={icon} 
            size={sizeStyles.iconSize} 
            color={variant === 'outline' ? colors.primary[500] : variantStyles.textColor}
            style={styles.iconRight}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginRight: 0,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default LoadingButton;

