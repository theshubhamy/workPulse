import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

// Request authorization for notifications
export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
  }
};

// Sign out utility
export const logout = async () => {
  try {
    await auth().signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Listen for push notifications
export const notificationListener = () => {
  messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage.notification,
    );
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }
    });
};
