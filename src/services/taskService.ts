import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

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

const tasksRef = () => firestore().collection('tasks');

/**
 * Fetch all tasks assigned to the current user.
 */
export const getMyTasks = async (): Promise<Task[]> => {
  const uid = auth().currentUser?.uid;
  if (!uid) return [];

  const snap = await tasksRef()
    .where('assignedTo', '==', uid)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
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
  onError?: (error: Error) => void,
) => {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  return tasksRef()
    .where('assignedTo', '==', uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => {
        const tasks = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
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
      },
      error => {
        console.error('Tasks subscription error:', error);
        onError?.(error);
      },
    );
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
    updates.completedAt = firestore.FieldValue.serverTimestamp();
  }
  await tasksRef().doc(taskId).update(updates);
};

/**
 * Upload a proof image and attach it to a task.
 */
export const uploadTaskProof = async (
  taskId: string,
  imageUri: string,
): Promise<string> => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  const filename = `proofs/${uid}/${taskId}_${Date.now()}.jpg`;
  const ref = storage().ref(filename);
  await ref.putFile(imageUri);
  const downloadUrl = await ref.getDownloadURL();

  await tasksRef().doc(taskId).update({ proofImageUrl: downloadUrl });
  return downloadUrl;
};

/**
 * Get count of completed tasks for today.
 */
export const getTodayCompletedCount = async (): Promise<number> => {
  const uid = auth().currentUser?.uid;
  if (!uid) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snap = await tasksRef()
    .where('assignedTo', '==', uid)
    .where('status', '==', 'done')
    .where('completedAt', '>=', firestore.Timestamp.fromDate(today))
    .get();

  return snap.size;
};
