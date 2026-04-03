import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import messaging from '@react-native-firebase/messaging';

// Configure Google Sign-In — replace WEB_CLIENT_ID with your Firebase console value
GoogleSignin.configure({
  webClientId: '483626410386-kdj8it18j5hkif36h4gvkoohmqjm3v83.apps.googleusercontent.com',
});

// ─── Google Sign-In ──────────────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  const userCredential = await auth().signInWithCredential(googleCredential);

  // Ensure a Firestore profile exists for Google-sign-in users
  const { ensureProfileExists } = await import('../services/userService');
  await ensureProfileExists();

  return userCredential;
};

// ─── Email / Password Sign-In ─────────────────────────────────────────────────
export const signInWithEmail = async (email: string, password: string) => {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  return userCredential;
};

// ─── Email / Password Sign-Up (stores name & phone in displayName & metadata) ─
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  phone: string,
) => {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  // Save displayName
  await user.updateProfile({ displayName: name });

  // Store phone & name in Firestore user document (metadata)
  // This is the standard pattern when Firebase Auth doesn't provide a phone field directly
  const { default: firestore } = await import('@react-native-firebase/firestore');
  await firestore().collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      name,
      phone,
      email,
      role: 'employee',
      createdAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return userCredential;
};

// ─── Password Reset ───────────────────────────────────────────────────────────
export const sendPasswordReset = async (email: string) => {
  await auth().sendPasswordResetEmail(email);
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    const googleUser = await GoogleSignin.getCurrentUser();
    if (googleUser) {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }
    await auth().signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// ─── FCM Notifications ────────────────────────────────────────────────────────
export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  }
  return null;
};

export const notificationListener = () => {
  messaging().onMessage(async remoteMessage => {
    console.log('FCM message arrived:', JSON.stringify(remoteMessage));
  });
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app from background:', remoteMessage.notification);
  });
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification opened app from quit:', remoteMessage.notification);
      }
    });
};
