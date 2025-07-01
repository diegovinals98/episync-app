import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const CustomToast = ({ text1, text2, type, props }) => {
  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success[500],
          borderLeftColor: colors.success[600],
        };
      case 'error':
        return {
          backgroundColor: colors.error[500],
          borderLeftColor: colors.error[600],
        };
      case 'warning':
        return {
          backgroundColor: colors.warning[500],
          borderLeftColor: colors.warning[600],
        };
      case 'info':
        return {
          backgroundColor: colors.primary[500],
          borderLeftColor: colors.primary[600],
        };
      default:
        return {
          backgroundColor: colors.primary[500],
          borderLeftColor: colors.primary[600],
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={[styles.container, getToastStyle()]}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon()} size={24} color="white" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 18,
  },
});

export default CustomToast; 