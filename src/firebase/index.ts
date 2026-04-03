import { 
  getAuth, 
  signInWithCredential, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut, 
  updateProfile 
} from '@react-native-firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In — replace WEB_CLIENT_ID with your Firebase console value
GoogleSignin.configure({
  webClientId: '483626410386-kdj8it18j5hkif36h4gvkoohmqjm3v83.apps.googleusercontent.com',
});

const auth = getAuth();
const db = getFirestore();

// ─── Google Sign-In ──────────────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;
  
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, googleCredential);

  // Ensure a Firestore profile exists for Google-sign-in users
  const { ensureProfileExists } = await import('../services/userService');
  await ensureProfileExists();

  return userCredential;
};

// ─── Email / Password Sign-In ─────────────────────────────────────────────────
export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// ─── Email / Password Sign-Up (stores name & phone in Firestore user doc) ─────
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  phone: string,
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Save displayName in Auth
  await updateProfile(user, { displayName: name });

  // Create Firestore document
  const userDoc = doc(db, 'users', user.uid);
  await setDoc(userDoc, {
    uid: user.uid,
    name,
    phone,
    email,
    role: 'employee',
    createdAt: serverTimestamp(),
  }, { merge: true });

  return userCredential;
};

// ─── Password Reset ───────────────────────────────────────────────────────────
export const sendPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    const googleUser = await GoogleSignin.getCurrentUser();
    if (googleUser) {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }
    await firebaseSignOut(auth);
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
