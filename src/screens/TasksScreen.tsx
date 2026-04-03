import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../utils/colors';
import { toast } from '../utils/toast';
import {
  Task,
  TaskStatus,
  subscribeToMyTasks,
  updateTaskStatus,
  uploadTaskProof,
} from '../services/taskService';
import { launchCamera } from 'react-native-image-picker';

const priorityColor = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

const statusColor: Record<TaskStatus, string> = {
  pending: Colors.warning,
  inprogress: Colors.primary,
  done: Colors.success,
};

const statusLabel: Record<TaskStatus, string> = {
  pending: 'Pending',
  inprogress: 'In Progress',
  done: 'Done',
};

const formatDueDate = (d: Date | null): string => {
  if (!d) return '–';
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();
  if (isTomorrow) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${time}`;
};

// ─── TaskCard ────────────────────────────────────────────────────────────────

const TaskCard: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onProof: (id: string) => void;
  isUploading: boolean;
}> = ({ task, onStatusChange, onProof, isUploading }) => {
  const priorityC = priorityColor[task.priority];
  const statusC = statusColor[task.status];
  const isDone = task.status === 'done';

  return (
    <View style={[styles.taskCard, isDone && styles.taskCardDone]}>
      {/* Priority Indicator Dot */}
      <View style={[styles.priorityTab, { backgroundColor: priorityC }]} />

      <View style={styles.cardMain}>
        <View style={styles.cardHeader}>
          <Text style={[styles.taskTitle, isDone && styles.doneTitle]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusC}20` }]}>
            <Text style={[styles.statusLabel, { color: statusC }]}>{statusLabel[task.status]}</Text>
          </View>
        </View>

        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>🕒</Text>
            <Text style={styles.metaText}>{formatDueDate(task.dueDate)}</Text>
          </View>
          {task.location && (
            <View style={[styles.metaItem, { marginLeft: 12 }]}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText} numberOfLines={1}>{task.location}</Text>
            </View>
          )}
        </View>

        {!isDone ? (
          <View style={styles.actionRow}>
            {task.status === 'pending' ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: Colors.primary }]}
                onPress={() => onStatusChange(task.id, 'inprogress')}>
                <Text style={styles.primaryBtnText}>▶ Start Work</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: Colors.success, flex: 2 }]}
                  onPress={() => onStatusChange(task.id, 'done')}>
                  <Text style={styles.primaryBtnText}>✓ Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cameraBtn, isUploading && styles.btnDisabled]}
                  onPress={() => onProof(task.id)}
                  disabled={isUploading}>
                  <Text style={styles.cameraBtnText}>
                    {isUploading ? '...' : '📸 Proof'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.completedRow}>
            <Text style={styles.completedText}>🎉 Task Finished</Text>
            {task.proofImageUrl && (
              <View style={styles.proofPill}>
                <Text style={styles.proofPillText}>🖼️ Proof Attached</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const TasksScreen = () => {
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMyTasks(
      updatedTasks => {
        setTasks(updatedTasks);
        setLoading(false);
      },
      error => {
        console.warn('Task subscription error:', error);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(id, status);
      toast.success('Task Updated', `Status changed to ${statusLabel[status]}`);
    } catch (e: any) {
      toast.error('Update Failed', e.message);
    }
  };

  const handleTaskProof = async (taskId: string) => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.7,
        includeExtra: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) throw new Error(result.errorMessage);

      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('Could not get image URI');

      setUploading(taskId);
      await uploadTaskProof(taskId, asset.uri);
      toast.success('Proof Uploaded', 'Task proof has been saved.');
    } catch (e: any) {
      toast.error('Upload Failed', e.message);
    } finally {
      setUploading(null);
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const filters: Array<{ key: 'all' | TaskStatus; label: string }> = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'inprogress', label: `Active (${counts.inprogress})` },
    { key: 'done', label: `Done (${counts.done})` },
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Tasks</Text>
        <Text style={styles.pageSubtitle}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterActiveText]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{filter === 'done' ? '🎉' : '📋'}</Text>
            <Text style={styles.emptyText}>
              {filter === 'done' ? 'No completed tasks yet' : 'No tasks here!'}
            </Text>
            <Text style={styles.emptySubtext}>
              Tasks assigned by your admin will appear here.
            </Text>
          </View>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onProof={handleTaskProof}
              isUploading={uploading === task.id}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  pageHeader: { padding: 20, paddingBottom: 8 },
  pageTitle: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterActiveText: { color: Colors.white },
  list: { flex: 1 },
  listContent: { padding: 16, paddingTop: 4 },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  taskCardDone: { opacity: 0.6 },
  priorityTab: { width: 6, height: '100%' },
  cardMain: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  taskTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  doneTitle: { textDecorationLine: 'line-through', color: Colors.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  taskDesc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: { fontSize: 12, marginRight: 6 },
  metaText: { color: Colors.textMuted, fontSize: 13 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 3, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  cameraBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.warning,
  },
  cameraBtnText: { color: Colors.warning, fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.5, borderColor: Colors.textMuted },
  completedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  completedText: { color: Colors.success, fontSize: 13, fontWeight: '700' },
  proofPill: { backgroundColor: `${Colors.success}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  proofPillText: { color: Colors.success, fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 4 },
  emptySubtext: { color: Colors.textMuted, fontSize: 13 },
});

export default TasksScreen;
