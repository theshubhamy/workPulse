import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';

export interface LocationLog {
  id: string;
  uid: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

const locationRef = () => firestore().collection('locationLogs');

/**
 * Request location permission (needed on Android).
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'WorkPulse needs your location for attendance tracking.',
      buttonPositive: 'Allow',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * Get the current device position.
 */
export const getCurrentPosition = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });
};

/**
 * Log the current location to Firestore.
 */
export const logLocation = async (
  lat: number,
  lng: number,
): Promise<void> => {
  const uid = auth().currentUser?.uid;
  if (!uid) return;

  await locationRef().add({
    uid,
    lat,
    lng,
    timestamp: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Get location history for the current user.
 */
export const getLocationHistory = async (limit = 50): Promise<LocationLog[]> => {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];

  const snap = await locationRef()
    .where('uid', '==', uid)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      uid: d.uid,
      lat: d.lat,
      lng: d.lng,
      timestamp: d.timestamp?.toDate() ?? new Date(),
    };
  });
};

/**
 * Auto-update location and log to Firestore.
 * Call this after check-in and stop on check-out.
 * Returns a cleanup function to stop watching.
 */
export const startLocationTracking = (intervalMs = 5 * 60 * 1000): (() => void) => {
  const trackAndLog = async () => {
    try {
      const pos = await getCurrentPosition();
      await logLocation(pos.lat, pos.lng);
    } catch (err) {
      console.warn('Location tracking tick failed:', err);
    }
  };

  // Log immediately, then on interval
  trackAndLog();
  const timer = setInterval(trackAndLog, intervalMs);

  return () => clearInterval(timer);
};
