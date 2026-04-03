import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async set(key: string, value: any) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },
};

export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  FCM_TOKEN: 'fcm_token',
  ONBOARDING_DONE: 'onboarding_done',
};
