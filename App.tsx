import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { getAuth, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { Colors } from './src/utils/colors';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { requestUserPermission, notificationListener } from './src/firebase';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ToastConfig';
import messaging from '@react-native-firebase/messaging';

const auth = getAuth();

function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async u => {
      setUser(u);
      
      if (u) {
        const { getProfile, upsertProfile } = await import('./src/services/userService');
        const profile = await getProfile();
        if (profile) setRole(profile.role);

        // Sync FCM Token
        const token = await requestUserPermission();
        if (token) {
          await upsertProfile({ fcmToken: token });
        }
      }
      
      if (initializing) setInitializing(false);
    });

    // Foreground Push Notifications with Toasts
    const notificationUnsub = messaging().onMessage(async remoteMessage => {
      const { toast } = await import('./src/utils/toast');
      if (remoteMessage.notification) {
        toast.info(
          remoteMessage.notification.title || 'New Notification',
          remoteMessage.notification.body || ''
        );
      }
    });

    return () => {
      if (subscriber) subscriber();
      if (notificationUnsub) notificationUnsub();
    };
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.splashLogo}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <NavigationContainer>
        {user ? <MainNavigator role={role} /> : <AuthNavigator />}
      </NavigationContainer>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
