import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import auth from '@react-native-firebase/auth';
import { Colors } from '../utils/colors';
import { logout } from '../firebase';
import {
  getTodayRecord,
  checkIn as firestoreCheckIn,
  checkOut as firestoreCheckOut,
  AttendanceRecord,
} from '../services/attendanceService';
import { getTodayCompletedCount } from '../services/taskService';
import {
  requestLocationPermission,
  getCurrentPosition,
  logLocation,
  startLocationTracking,
} from '../services/locationService';
import { MainTabParamList } from '../navigation/MainNavigator';

type HomeNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.qaIcon, { backgroundColor: `${color}20` }]}>
      <Text style={styles.qaEmoji}>{icon}</Text>
    </View>
    <Text style={styles.qaLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const HomeScreen = () => {
  const navigation = useNavigation<HomeNav>();
  const user = auth().currentUser;

  const [refreshing, setRefreshing] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [tasksDone, setTasksDone] = useState(0);
  const [stopTracking, setStopTracking] = useState<(() => void) | null>(null);

  const checkedIn = todayRecord !== null && todayRecord.checkOutTime === null;

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadData = useCallback(async () => {
    try {
      const [record, doneCount] = await Promise.all([
        getTodayRecord(),
        getTodayCompletedCount(),
      ]);
      setTodayRecord(record);
      setTasksDone(doneCount);
    } catch (err) {
      console.warn('Home data load error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clean up location tracking on unmount
  useEffect(() => {
    return () => {
      stopTracking?.();
    };
  }, [stopTracking]);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);

    try {
      const hasPermission = await requestLocationPermission();
      let location: { lat: number; lng: number } | null = null;
      if (hasPermission) {
        try {
          location = await getCurrentPosition();
        } catch (_) {}
      }

      if (checkedIn) {
        Alert.alert('Check Out', 'Are you sure you want to check out?', [
          { text: 'Cancel', style: 'cancel', onPress: () => setCheckingIn(false) },
          {
            text: 'Check Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await firestoreCheckOut(location);
                stopTracking?.();
                setStopTracking(null);
                await loadData();
                Alert.alert('✅ Checked Out', 'Have a great evening!');
              } catch (e: any) {
                Alert.alert('Error', e.message);
              } finally {
                setCheckingIn(false);
              }
            },
          },
        ]);
      } else {
        await firestoreCheckIn(location);
        // Start background location tracking after check-in
        if (hasPermission) {
          const cleanup = startLocationTracking(5 * 60 * 1000);
          setStopTracking(() => cleanup);
        }
        await loadData();
        Alert.alert('✅ Checked In', `Recorded at ${new Date().toLocaleTimeString()}`);
        setCheckingIn(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setCheckingIn(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const hoursWorked = () => {
    if (!todayRecord) return '0';
    if (todayRecord.totalHours !== null) return `${todayRecord.totalHours}`;
    // Still checked in — compute live
    const diff = Date.now() - todayRecord.checkInTime.getTime();
    const hrs = Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
    return `${hrs}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{displayName} 👋</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          { backgroundColor: checkedIn ? `${Colors.success}15` : `${Colors.danger}15` },
        ]}>
        <View
          style={[styles.statusDot, { backgroundColor: checkedIn ? Colors.success : Colors.danger }]}
        />
        <View style={styles.statusInfo}>
          <Text style={[styles.statusTitle, { color: checkedIn ? Colors.success : Colors.danger }]}>
            {checkedIn ? 'Checked In' : todayRecord?.checkOutTime ? 'Checked Out' : 'Not Checked In'}
          </Text>
          {todayRecord?.checkInTime && (
            <Text style={styles.statusSub}>
              {checkedIn
                ? `Since ${todayRecord.checkInTime.toLocaleTimeString()}`
                : `${todayRecord.checkInTime.toLocaleTimeString()} – ${todayRecord.checkOutTime?.toLocaleTimeString() ?? ''}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.checkBtn, { backgroundColor: checkedIn ? Colors.danger : Colors.success }]}
          onPress={handleCheckIn}
          disabled={checkingIn || (todayRecord?.checkOutTime !== undefined && todayRecord?.checkOutTime !== null)}>
          <Text style={styles.checkBtnText}>
            {checkingIn ? '...' : checkedIn ? 'Check Out' : todayRecord?.checkOutTime ? 'Done' : 'Check In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <Text style={styles.sectionTitle}>Today's Summary</Text>
      <View style={styles.statsRow}>
        <StatCard icon="⏱" label="Hours" value={hoursWorked()} color={Colors.primary} />
        <StatCard icon="✅" label="Tasks Done" value={`${tasksDone}`} color={Colors.success} />
        <StatCard icon="📍" label="Status" value={todayRecord?.status ?? '–'} color={Colors.secondary} />
        <StatCard icon="🔥" label="Streak" value="–" color={Colors.accent} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <QuickAction
          icon="📋"
          label="My Tasks"
          color={Colors.primary}
          onPress={() => navigation.navigate('Tasks')}
        />
        <QuickAction
          icon="📊"
          label="Attendance"
          color={Colors.success}
          onPress={() => navigation.navigate('Attendance')}
        />
        <QuickAction
          icon="👤"
          label="Profile"
          color={Colors.secondary}
          onPress={() => navigation.navigate('Profile')}
        />
        <QuickAction
          icon="📸"
          label="Upload Proof"
          color={Colors.warning}
          onPress={() => Alert.alert('Upload Proof', 'Navigate to a task and attach proof.')}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  name: { color: Colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  checkBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  checkBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  quickAction: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qaIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  qaEmoji: { fontSize: 24 },
  qaLabel: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  bottomSpacer: { height: 20 },
});

export default HomeScreen;
