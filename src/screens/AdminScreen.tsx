import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../utils/colors';
import { toast } from '../utils/toast';
import { getEmployees, UserProfile } from '../services/userService';
import { createTask, TaskStatus, TaskPriority } from '../services/taskService';
import Input from '../components/Input';
import Button from '../components/Button';

const AdminScreen = () => {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<UserProfile | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const emps = await getEmployees();
      setEmployees(emps);
    } catch (e: any) {
      toast.error('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedEmp || !title) {
      toast.error('Required', 'Title and Employee are required');
      return;
    }
    setSubmitting(true);
    try {
      await createTask({
        title,
        description,
        location,
        priority,
        assignedTo: selectedEmp.uid,
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000), // Default to tomorrow
      });
      toast.success('Task Assigned', `Assigned to ${selectedEmp.name}`);
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setLocation('');
    } catch (e: any) {
      toast.error('Failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Assign tasks to your field team</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Field Employees ({employees.length})</Text>
        {employees.map(emp => (
          <TouchableOpacity
            key={emp.uid}
            style={styles.empCard}
            onPress={() => {
              setSelectedEmp(emp);
              setModalVisible(true);
            }}>
            <View style={styles.empAvatar}>
              <Text style={styles.avatarText}>{emp.name[0]}</Text>
            </View>
            <View style={styles.empInfo}>
              <Text style={styles.empName}>{emp.name}</Text>
              <Text style={styles.empEmail}>{emp.email}</Text>
            </View>
            <View style={styles.assignPill}>
              <Text style={styles.assignText}>+ Assign</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task Creation Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task for {selectedEmp?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtnArea}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Task Title" value={title} onChangeText={setTitle} placeholder="e.g. Site Inspection" />
              <Input label="Description" value={description} onChangeText={setDescription} placeholder="Instructions..." />
              <Input label="Location" value={location} onChangeText={setLocation} placeholder="City or Office name" />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityGrid}>
                {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pPill, priority === p && styles.pActive, { borderColor: p === 'high' ? Colors.danger : p === 'medium' ? Colors.warning : Colors.success }]}
                    onPress={() => setPriority(p)}>
                    <Text style={[styles.pText, priority === p && { color: Colors.white }]}>{p.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title="Assign Task" onPress={handleCreateTask} loading={submitting} style={styles.mainBtn} />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 60, backgroundColor: Colors.surface, borderBottomWidth: 1.5, borderBottomColor: Colors.border },
  title: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  scroll: { padding: 20 },
  sectionTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', marginBottom: 16 },
  empCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  empAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 18 },
  empInfo: { flex: 1 },
  empName: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  empEmail: { color: Colors.textMuted, fontSize: 12 },
  assignPill: { backgroundColor: `${Colors.primary}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  assignText: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '85%', borderWidth: 1, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', flex: 1 },
  closeBtnArea: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  closeBtn: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 12 },
  priorityGrid: { flexDirection: 'row', gap: 10 },
  pPill: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  pActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pText: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary },
  mainBtn: { marginTop: 24 },
});

export default AdminScreen;
