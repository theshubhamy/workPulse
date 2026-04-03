import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: 'admin' | 'employee';
  companyId?: string;
  photoUrl?: string;
  createdAt?: Date;
}

const usersRef = () => firestore().collection('users');

/**
 * Get the current user's Firestore profile.
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  const uid = auth().currentUser?.uid;
  if (!uid) return null;

  const doc = await usersRef().doc(uid).get();
  if (!doc.exists) return null;

  const d = doc.data()!;
  return {
    uid: d.uid ?? uid,                                  // fallback to auth uid
    name: d.name ?? auth().currentUser?.displayName ?? '',
    phone: d.phone ?? '',
    email: d.email ?? auth().currentUser?.email ?? '',
    role: (d.role ?? 'employee') as UserProfile['role'],
    companyId: d.companyId,
    photoUrl: d.photoUrl,
    createdAt: d.createdAt?.toDate(),
  };
};

/**
 * Create or update the user's Firestore profile.
 * Called automatically on signup; can also be used to update profile later.
 */
export const upsertProfile = async (
  data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
): Promise<void> => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  await usersRef().doc(uid).set(
    {
      uid,
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Keep Firebase Auth displayName in sync
  if (data.name) {
    await auth().currentUser?.updateProfile({ displayName: data.name });
  }
};

/**
 * Ensure a Firestore user doc exists for the current user.
 * Called after Google sign-in (which skips our signup flow).
 */
export const ensureProfileExists = async (): Promise<void> => {
  const user = auth().currentUser;
  if (!user) return;

  const doc = await usersRef().doc(user.uid).get();
  if (!doc.exists) {
    await usersRef().doc(user.uid).set({
      uid: user.uid,
      name: user.displayName ?? '',
      email: user.email ?? '',
      phone: '',
      role: 'employee',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  }
};

/**
 * Listen to real-time profile changes.
 */
export const subscribeToProfile = (
  onUpdate: (profile: UserProfile | null) => void,
) => {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    onUpdate(null);
    return () => {};
  }

  return usersRef().doc(uid).onSnapshot(
    doc => {
      if (!doc.exists) {
        onUpdate(null);
        return;
      }
      const d = doc.data()!;
      onUpdate({
        uid: d.uid ?? uid,                              // fallback to auth uid
        name: d.name ?? auth().currentUser?.displayName ?? '',
        phone: d.phone ?? '',
        email: d.email ?? auth().currentUser?.email ?? '',
        role: (d.role ?? 'employee') as UserProfile['role'],
        companyId: d.companyId,
        photoUrl: d.photoUrl,
        createdAt: d.createdAt?.toDate(),
      });
    },
    error => {
      console.error('Profile subscription error:', error);
      onUpdate(null);
    },
  );
};
