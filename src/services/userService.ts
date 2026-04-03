import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from '@react-native-firebase/firestore';
import { getAuth, updateProfile as updateAuthProfile } from '@react-native-firebase/auth';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'employee';
  companyId?: string;
  photoUrl?: string;
  fcmToken?: string;
  createdAt?: any;
}

import { getStorage, ref, getDownloadURL } from '@react-native-firebase/storage';

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const usersColl = collection(db, 'users');

/**
 * Get the current user's Firestore profile.
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const userDoc = doc(db, 'users', user.uid);
  const snap = await getDoc(userDoc);

  if (!snap.exists()) return null;

  const d = snap.data()!;
  return {
    uid: d.uid || user.uid,
    name: d.name || user.displayName || '',
    phone: d.phone || '',
    email: d.email || user.email || '',
    role: (d.role || 'employee') as UserProfile['role'],
    companyId: d.companyId,
    photoUrl: d.photoUrl,
    createdAt: d.createdAt?.toDate(),
  };
};

/**
 * Create or update the user's Firestore profile.
 */
export const upsertProfile = async (
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const userDoc = doc(db, 'users', user.uid);
  await setDoc(userDoc, {
    uid: user.uid,
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (data.name) {
    await updateAuthProfile(user, { displayName: data.name });
  }

  if (data.photoUrl) {
    await updateAuthProfile(user, { photoURL: data.photoUrl });
  }
};

/**
 * Upload a profile picture to Storage and update the profile URL.
 */
export const uploadProfilePicture = async (
  imageUri: string,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const filename = `profile_pics/${user.uid}.jpg`;
  const storageRef = ref(storage, filename);

  const task = storageRef.putFile(imageUri);
  await task;

  const downloadUrl = await getDownloadURL(storageRef);
  await upsertProfile({ photoUrl: downloadUrl });

  return downloadUrl;
};

/**
 * Ensure a Firestore user doc exists for the current user.
 */
export const ensureProfileExists = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const userDoc = doc(db, 'users', user.uid);
  const snap = await getDoc(userDoc);

  if (!snap.exists()) {
    await setDoc(userDoc, {
      uid: user.uid,
      name: user.displayName ?? '',
      email: user.email ?? '',
      phone: '',
      role: 'employee',
      createdAt: serverTimestamp(),
    });
  }
};

/**
 * Fetch all employee profiles (Admin only).
 */
export const getEmployees = async (): Promise<UserProfile[]> => {
  const q = query(usersColl, where('role', '==', 'employee'));
  const snap = await getDocs(q);
  return snap.docs.map(docSnap => {
    const d = docSnap.data();
    return {
      uid: d.uid,
      name: d.name || 'Anonymous',
      phone: d.phone || '',
      email: d.email || '',
      role: d.role,
      photoUrl: d.photoUrl,
    };
  });
};

/**
 * Listen to real-time profile changes.
 */
export const subscribeToProfile = (
  onUpdate: (profile: UserProfile | null) => void,
) => {
  const user = auth.currentUser;
  if (!user) {
    onUpdate(null);
    return () => { };
  }

  const currentUserUid = user.uid;
  const currentDisplayName = user.displayName;
  const currentEmail = user.email;

  const userDoc = doc(db, 'users', currentUserUid);
  return onSnapshot(userDoc, snap => {
    if (!snap.exists()) {
      onUpdate(null);
      return;
    }
    const d = snap.data()!;

    // Debug log to see exactly what Firestore is returning

    onUpdate({
      uid: d.uid || currentUserUid, // Ensure we use the stable auth UID
      name: d.name || currentDisplayName || 'User',
      phone: d.phone || '',
      email: d.email || currentEmail || '',
      role: (d.role || 'employee') as UserProfile['role'],
      companyId: d.companyId,
      photoUrl: d.photoUrl,
      createdAt: d.createdAt ? (typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate() : d.createdAt) : null,
    });
  }, error => {
    console.error('Profile subscription error:', error);
    onUpdate(null);
  });
};
