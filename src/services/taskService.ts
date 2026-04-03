import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from '@react-native-firebase/firestore';
import { getStorage, ref, getDownloadURL } from '@react-native-firebase/storage';
import { getAuth } from '@react-native-firebase/auth';

export type TaskStatus = 'pending' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string; // uid
  assignedBy?: string;
  dueDate: Date | null;
  location?: string;
  proofImageUrl?: string;
  completedAt?: Date;
  createdAt: Date;
}

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const tasksColl = collection(db, 'tasks');

/**
 * Fetch all tasks assigned to the current user.
 */
export const getMyTasks = async (): Promise<Task[]> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const q = query(
    tasksColl,
    where('assignedTo', '==', uid),
    orderBy('createdAt', 'desc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(docSnap => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      title: d.title,
      description: d.description ?? '',
      status: d.status,
      priority: d.priority ?? 'medium',
      assignedTo: d.assignedTo,
      assignedBy: d.assignedBy,
      dueDate: d.dueDate?.toDate() ?? null,
      location: d.location,
      proofImageUrl: d.proofImageUrl,
      completedAt: d.completedAt?.toDate(),
      createdAt: d.createdAt?.toDate() ?? new Date(),
    };
  });
};

/**
 * Listen to real-time task updates for the current user.
 */
export const subscribeToMyTasks = (
  onUpdate: (tasks: Task[]) => void,
  onError?: (error: any) => void,
) => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    onUpdate([]);
    return () => { };
  }

  const q = query(
    tasksColl,
    where('assignedTo', '==', uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, snap => {
    const tasks = snap.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        title: d.title,
        description: d.description ?? '',
        status: d.status as TaskStatus,
        priority: (d.priority ?? 'medium') as TaskPriority,
        assignedTo: d.assignedTo,
        assignedBy: d.assignedBy,
        dueDate: d.dueDate?.toDate() ?? null,
        location: d.location,
        proofImageUrl: d.proofImageUrl,
        completedAt: d.completedAt?.toDate(),
        createdAt: d.createdAt?.toDate() ?? new Date(),
      };
    });
    onUpdate(tasks);
  }, error => {
    console.error('Tasks subscription error:', error);
    onError?.(error);
  });
};

/**
 * Create a new task (Admin only).
 */
export const createTask = async (
  data: Omit<Task, 'id' | 'createdAt'>,
): Promise<string> => {
  const docRef = await addDoc(tasksColl, {
    ...data,
    createdAt: serverTimestamp(),
    status: 'pending',
  });
  return docRef.id;
};

/**
 * Update a task's status.
 */
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
): Promise<void> => {
  const updates: Record<string, any> = { status };
  if (status === 'done') {
    updates.completedAt = serverTimestamp();
  }
  const docRef = doc(db, 'tasks', taskId);
  await updateDoc(docRef, updates);
};

/**
 * Upload a proof image and attach it to a task.
 */
export const uploadTaskProof = async (
  taskId: string,
  imageUri: string,
): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const filename = `proofs/${uid}/${taskId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  // Note: RN Firebase modular SDK for storage uses putFile or uploadFile
  // In v24+, use the reference object directly if not using the static uploadFile
  const task = storageRef.putFile(imageUri);
  await task;

  const downloadUrl = await getDownloadURL(storageRef);
  const docRef = doc(db, 'tasks', taskId);
  await updateDoc(docRef, { proofImageUrl: downloadUrl });

  return downloadUrl;
};

/**
 * Get count of completed tasks for today.
 */
export const getTodayCompletedCount = async (): Promise<number> => {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    tasksColl,
    where('assignedTo', '==', uid),
    where('status', '==', 'done'),
    where('completedAt', '>=', Timestamp.fromDate(today))
  );

  const snap = await getDocs(q);
  return snap.size;
};
