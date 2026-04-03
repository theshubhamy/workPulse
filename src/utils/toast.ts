import Toast from 'react-native-toast-message';

/**
 * Easy-to-use utility for showing premium toasts.
 */
export const toast = {
  success: (title: string, sub?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: sub,
      visibilityTime: 4000,
    });
  },
  error: (title: string, sub?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: sub,
      visibilityTime: 5000,
    });
  },
  info: (title: string, sub?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: sub,
      visibilityTime: 4000,
    });
  },
};
