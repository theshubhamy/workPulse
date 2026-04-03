import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors } from '../utils/colors';
import {
  getTodayRecord,
  checkIn as firestoreCheckIn,
  checkOut as firestoreCheckOut,
  getHistory,
  getMonthlyStats,
  AttendanceRecord,
} from '../services/attendanceService';
import { requestLocationPermission, getCurrentPosition } from '../services/locationService';

const statusConfig = {
  present: { color: Colors.success, label: 'Present', emoji: '✅' },
  absent: { color: Colors.danger, label: 'Absent', emoji: '❌' },
  late: { color: Colors.warning, label: 'Late', emoji: '⚠️' },
  halfday: { color: Colors.secondary, label: 'Half Day', emoji: '🌗' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatTime = (d: Date | null): string => {
  if (!d) return '–';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatHours = (h: number | null): string => {
  if (h === null) return '–';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
};

const AttendanceScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, halfday: 0, total: 0, percentage: 0 });
  const [checkingIn, setCheckingIn] = useState(false);

  const checkedIn = todayRecord !== null && todayRecord.checkOutTime === null;
  const alreadyCheckedOut = todayRecord !== null && todayRecord.checkOutTime !== null;

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const loadData = useCallback(async () => {
    try {
      const [record, hist, monthStats] = await Promise.all([
        getTodayRecord(),
        getHistory(30),
        getMonthlyStats(),
      ]);
      setTodayRecord(record);
      setHistory(hist);
      setStats(monthStats);
    } catch (err) {
      console.warn('Attendance load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        Alert.alert('Check Out', 'Confirm check-out?', [
          { text: 'Cancel', style: 'cancel', onPress: () => setCheckingIn(false) },
          {
            text: 'Check Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await firestoreCheckOut(location);
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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Attendance</Text>
        <Text style={styles.pageSubtitle}>{monthLabel}</Text>
      </View>

      {/* Check-In Card */}
      <View style={[styles.checkInCard, { borderColor: checkedIn ? Colors.success : Colors.primary }]}>
        <View>
          <Text style={styles.checkInLabel}>
            {checkedIn
              ? 'Currently Working'
              : alreadyCheckedOut
              ? 'Day Complete'
              : 'Not Checked In'}
          </Text>
          {todayRecord?.checkInTime ? (
            <Text style={styles.checkInTime}>
              {checkedIn
                ? `Since ${formatTime(todayRecord.checkInTime)}`
                : `${formatTime(todayRecord.checkInTime)} – ${formatTime(todayRecord.checkOutTime)} • ${formatHours(todayRecord.totalHours)}`}
            </Text>
          ) : (
            <Text style={styles.checkInTime}>
              {now.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.checkBtn,
            { backgroundColor: alreadyCheckedOut ? Colors.textMuted : checkedIn ? Colors.danger : Colors.success },
          ]}
          onPress={handleCheckIn}
          disabled={checkingIn || alreadyCheckedOut}>
          <Text style={styles.checkBtnText}>
            {checkingIn ? '...' : alreadyCheckedOut ? '✓ Done' : checkedIn ? '⏹ Out' : '▶ In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Stats */}
      <Text style={styles.sectionTitle}>This Month</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { borderTopColor: Colors.success }]}>
          <Text style={[styles.statNum, { color: Colors.success }]}>{stats.present}</Text>
          <Text style={styles.statLbl}>Present</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: Colors.danger }]}>
          <Text style={[styles.statNum, { color: Colors.danger }]}>{stats.absent}</Text>
          <Text style={styles.statLbl}>Absent</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: Colors.warning }]}>
          <Text style={[styles.statNum, { color: Colors.warning }]}>{stats.late}</Text>
          <Text style={styles.statLbl}>Late</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: Colors.primary }]}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{stats.percentage}%</Text>
          <Text style={styles.statLbl}>Rate</Text>
        </View>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>History</Text>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No attendance records yet</Text>
        </View>
      ) : (
        history.map(rec => {
          const d = new Date(rec.date + 'T00:00:00');
          const cfg = statusConfig[rec.status];
          return (
            <View key={rec.id} style={styles.recordRow}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{DAY_NAMES[d.getDay()]}</Text>
                <Text style={styles.dateDate}>{d.getDate()}</Text>
              </View>
              <View style={styles.recordInfo}>
                <View style={styles.recordTimes}>
                  <Text style={styles.timeLabel}>In: </Text>
                  <Text style={styles.timeValue}>{formatTime(rec.checkInTime)}</Text>
                  <Text style={[styles.timeLabel, { marginLeft: 16 }]}>Out: </Text>
                  <Text style={styles.timeValue}>{formatTime(rec.checkOutTime)}</Text>
                </View>
                <Text style={styles.hoursText}>
                  {rec.totalHours !== null ? `⏱ ${formatHours(rec.totalHours)}` : ''}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${cfg.color}20` }]}>
                <Text style={{ fontSize: 12 }}>{cfg.emoji}</Text>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  pageHeader: { marginBottom: 20 },
  pageTitle: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  checkInCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  checkInLabel: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  checkInTime: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  checkBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  checkBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLbl: { color: Colors.textMuted, fontSize: 11 },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateBadge: { alignItems: 'center', marginRight: 14, width: 36 },
  dateDay: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  dateDate: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  recordInfo: { flex: 1 },
  recordTimes: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  timeLabel: { color: Colors.textMuted, fontSize: 12 },
  timeValue: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  hoursText: { color: Colors.textSecondary, fontSize: 12 },
  statusPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  bottomSpacer: { height: 20 },
});

export default AttendanceScreen;
