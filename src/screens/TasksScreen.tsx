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
import {
  Task,
  TaskStatus,
  subscribeToMyTasks,
  updateTaskStatus,
  uploadTaskProof,
} from '../services/taskService';

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
}> = ({ task, onStatusChange }) => {
  const priorityC = priorityColor[task.priority];
  const statusC = statusColor[task.status];

  return (
    <View style={[styles.taskCard, task.status === 'done' && styles.taskCardDone]}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: `${priorityC}20` }]}>
          <Text style={[styles.priorityText, { color: priorityC }]}>
            {task.priority.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusC}20` }]}>
          <Text style={[styles.statusText, { color: statusC }]}>
            {statusLabel[task.status]}
          </Text>
        </View>
      </View>
      <Text style={[styles.taskTitle, task.status === 'done' && styles.doneTitle]}>
        {task.title}
      </Text>
      {task.description ? (
        <Text style={styles.taskDesc}>{task.description}</Text>
      ) : null}
      {task.location && (
        <View style={styles.taskMeta}>
          <Text style={styles.metaIcon}>📍</Text>
          <Text style={styles.metaText}>{task.location}</Text>
        </View>
      )}
      <View style={styles.taskMeta}>
        <Text style={styles.metaIcon}>🕐</Text>
        <Text style={styles.metaText}>{formatDueDate(task.dueDate)}</Text>
      </View>

      {task.status !== 'done' && (
        <View style={styles.actionRow}>
          {task.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: `${Colors.primary}20` }]}
              onPress={() => onStatusChange(task.id, 'inprogress')}>
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>▶ Start</Text>
            </TouchableOpacity>
          )}
          {task.status === 'inprogress' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: `${Colors.success}20` }]}
                onPress={() => onStatusChange(task.id, 'done')}>
                <Text style={[styles.actionBtnText, { color: Colors.success }]}>✓ Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.proofBtn]}
                onPress={() => Alert.alert('Upload Proof', 'Camera integration coming soon.')}>
                <Text style={[styles.actionBtnText, { color: Colors.warning }]}>📸 Proof</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const TasksScreen = () => {
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Real-time subscription will update the list automatically
    } catch (e: any) {
      Alert.alert('Error', e.message);
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
            <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskCardDone: { opacity: 0.65 },
  taskHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  taskTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  doneTitle: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaIcon: { fontSize: 12, marginRight: 6 },
  metaText: { color: Colors.textMuted, fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  proofBtn: { backgroundColor: `${Colors.warning}20` },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 4 },
  emptySubtext: { color: Colors.textMuted, fontSize: 13 },
});

export default TasksScreen;
