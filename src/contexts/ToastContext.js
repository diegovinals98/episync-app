import React, { createContext, useContext } from 'react';
import Toast from 'react-native-toast-message';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const showToast = (type, title, message, duration = 3000) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: duration,
      autoHide: true,
      topOffset: 60,
      onShow: () => {},
      onHide: () => {},
    });
  };

  const success = (title, message, duration) => {
    showToast('success', title, message, duration);
  };

  const error = (title, message, duration) => {
    showToast('error', title, message, duration);
  };

  const info = (title, message, duration) => {
    showToast('info', title, message, duration);
  };

  const warning = (title, message, duration) => {
    showToast('warning', title, message, duration);
  };

  const toastContext = {
    success,
    error,
    info,
    warning,
    showToast,
  };

  return (
    <ToastContext.Provider value={toastContext}>
      {children}
    </ToastContext.Provider>
  );
}; 