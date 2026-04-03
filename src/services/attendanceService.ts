import { 
  getFirestore, 
  collection, 
  doc, 
  query, 
  where, 
  limit, 
  getDocs, 
  addDoc, 
  updateDoc, 
  orderBy, 
  serverTimestamp, 
  Timestamp 
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

export interface AttendanceRecord {
  id: string;
  uid: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  checkInLocation: { lat: number; lng: number } | null;
  checkOutLocation: { lat: number; lng: number } | null;
  totalHours: number | null;
  status: 'present' | 'absent' | 'late' | 'halfday';
  date: string; // YYYY-MM-DD
}

const db = getFirestore();
const auth = getAuth();
const attendanceColl = collection(db, 'attendance');

/**
 * Get today's date key in YYYY-MM-DD format.
 */
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Get today's attendance record for the current user (if any).
 */
export const getTodayRecord = async (): Promise<AttendanceRecord | null> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const q = query(
    attendanceColl,
    where('uid', '==', uid),
    where('date', '==', todayKey()),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  return {
    id: docSnap.id,
    uid: data.uid,
    checkInTime: data.checkInTime?.toDate(),
    checkOutTime: data.checkOutTime?.toDate() ?? null,
    checkInLocation: data.checkInLocation ?? null,
    checkOutLocation: data.checkOutLocation ?? null,
    totalHours: data.totalHours ?? null,
    status: data.status,
    date: data.date,
  };
};

/**
 * Check in the current user. Creates a new attendance document for today.
 */
export const checkIn = async (
  location: { lat: number; lng: number } | null = null,
): Promise<AttendanceRecord> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  // Prevent double check-in
  const existing = await getTodayRecord();
  if (existing && !existing.checkOutTime) {
    throw new Error('Already checked in today');
  }

  const now = Timestamp.now();
  const date = todayKey();
  
  // Late if after 9:30 AM
  const nowTime = new Date();
  const hour = nowTime.getHours();
  const minute = nowTime.getMinutes();
  const status = hour > 9 || (hour === 9 && minute > 30) ? 'late' : 'present';

  const docRef = await addDoc(attendanceColl, {
    uid,
    checkInTime: now,
    checkOutTime: null,
    checkInLocation: location,
    checkOutLocation: null,
    totalHours: null,
    status,
    date,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    uid,
    checkInTime: now.toDate(),
    checkOutTime: null,
    checkInLocation: location,
    checkOutLocation: null,
    totalHours: null,
    status,
    date,
  };
};

/**
 * Check out the current user. Updates today's attendance record.
 */
export const checkOut = async (
  location: { lat: number; lng: number } | null = null,
): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const record = await getTodayRecord();
  if (!record) throw new Error('No check-in found for today');
  if (record.checkOutTime) throw new Error('Already checked out today');

  const now = new Date();
  const diffMs = now.getTime() - record.checkInTime.getTime();
  const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  let status = record.status;
  if (totalHours < 5) status = 'halfday';

  const docRef = doc(db, 'attendance', record.id);
  await updateDoc(docRef, {
    checkOutTime: Timestamp.fromDate(now),
    checkOutLocation: location,
    totalHours,
    status,
  });
};

/**
 * Get attendance history for the current user, ordered by most recent first.
 */
export const getHistory = async (count = 30): Promise<AttendanceRecord[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(
    attendanceColl,
    where('uid', '==', uid),
    orderBy('checkInTime', 'desc'),
    limit(count)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(docSnap => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      uid: d.uid,
      checkInTime: d.checkInTime?.toDate(),
      checkOutTime: d.checkOutTime?.toDate() ?? null,
      checkInLocation: d.checkInLocation ?? null,
      checkOutLocation: d.checkOutLocation ?? null,
      totalHours: d.totalHours ?? null,
      status: d.status,
      date: d.date,
    };
  });
};

/**
 * Get monthly stats for the current user.
 */
export const getMonthlyStats = async (month?: number, year?: number) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return { present: 0, absent: 0, late: 0, halfday: 0, total: 0, percentage: 0 };

  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();
  const prefix = `${y}-${String(m).padStart(2, '0')}`;

  const q = query(
    attendanceColl,
    where('uid', '==', uid),
    where('date', '>=', `${prefix}-01`),
    where('date', '<=', `${prefix}-31`)
  );
  
  const snap = await getDocs(q);
  const records = snap.docs.map(d => d.data());

  const present = records.filter(r => r.status === 'present').length;
  const late = records.filter(r => r.status === 'late').length;
  const halfday = records.filter(r => r.status === 'halfday').length;
  const absent = records.filter(r => r.status === 'absent').length;
  
  const total = records.length;
  const attendedCount = present + late + halfday;
  const percentage = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

  return { present, absent, late, halfday, total, percentage };
};
