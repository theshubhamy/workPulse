import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { Colors } from '../utils/colors';
import { logout } from '../firebase';
import { UserProfile, subscribeToProfile, upsertProfile } from '../services/userService';
import { getMonthlyStats } from '../services/attendanceService';

interface SettingRow {
  icon: string;
  label: string;
  sub?: string;
  type: 'arrow' | 'toggle' | 'danger';
  onPress?: () => void;
  value?: boolean;
  onToggle?: (v: boolean) => void;
}

const ProfileScreen = () => {
  const user = auth().currentUser;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [monthStats, setMonthStats] = useState({ present: 0, late: 0, total: 0 });

  useEffect(() => {
    // Wait until auth resolves before subscribing to Firestore profile
    const authUnsub = auth().onAuthStateChanged(firebaseUser => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      const profileUnsub = subscribeToProfile(p => {
        setProfile(p);
        setLoading(false);
      });

      getMonthlyStats().then(s =>
        setMonthStats({ present: s.present, late: s.late, total: s.total }),
      );

      // Return inner cleanup — but since onAuthStateChanged fires once for
      // a stable session, we store the unsubscribe for effect cleanup
      authUnsub(); // stop listening for further auth changes inside this effect
      return profileUnsub;
    });

    return () => authUnsub();
  }, []);

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = profile?.email || user?.email || '–';
  const phone = profile?.phone || '–';
  const role = profile?.role || 'employee';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email associated with this account.');
      return;
    }
    try {
      await auth().sendPasswordResetEmail(user.email);
      Alert.alert('📧 Email Sent', `Password reset link sent to ${user.email}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const sections: Array<{ title: string; rows: SettingRow[] }> = [
    {
      title: 'Preferences',
      rows: [
        {
          icon: '🔔',
          label: 'Push Notifications',
          sub: 'Task & attendance alerts',
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          icon: '📍',
          label: 'Location Tracking',
          sub: 'Background GPS updates',
          type: 'toggle',
          value: locationEnabled,
          onToggle: setLocationEnabled,
        },
      ],
    },
    {
      title: 'Account',
      rows: [
        {
          icon: '🔒',
          label: 'Change Password',
          sub: 'Send a reset link to your email',
          type: 'arrow',
          onPress: handleChangePassword,
        },
        {
          icon: '📞',
          label: 'Phone',
          sub: phone !== '–' ? phone : 'Not set',
          type: 'arrow',
          onPress: () => Alert.alert('Coming Soon', 'Phone update will be available soon.'),
        },
        {
          icon: '🛡️',
          label: 'Privacy Policy',
          type: 'arrow',
          onPress: () => { },
        },
        {
          icon: '📄',
          label: 'Terms of Service',
          type: 'arrow',
          onPress: () => { },
        },
      ],
    },
    {
      title: 'Danger Zone',
      rows: [
        {
          icon: '🚪',
          label: 'Sign Out',
          type: 'danger',
          onPress: handleLogout,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Hero */}
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>
            {role === 'admin' ? '🛡️ Admin' : '👷 Field Employee'}
          </Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.miniStats}>
        {[
          { label: 'Days Present', value: `${monthStats.present}`, color: Colors.success },
          { label: 'Days Late', value: `${monthStats.late}`, color: Colors.warning },
          { label: 'Total Days', value: `${monthStats.total}`, color: Colors.secondary },
        ].map((s, i) => (
          <View key={i} style={styles.miniStat}>
            <Text style={[styles.miniStatVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.miniStatLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Settings Sections */}
      {sections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.rows.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                style={[styles.settingRow, i < section.rows.length - 1 && styles.settingBorder]}
                onPress={row.onPress}
                disabled={row.type === 'toggle'}
                activeOpacity={row.type === 'toggle' ? 1 : 0.7}>
                <Text style={styles.rowIcon}>{row.icon}</Text>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, row.type === 'danger' && { color: Colors.danger }]}>
                    {row.label}
                  </Text>
                  {row.sub && <Text style={styles.rowSub}>{row.sub}</Text>}
                </View>
                {row.type === 'toggle' && (
                  <Switch
                    value={row.value}
                    onValueChange={row.onToggle}
                    trackColor={{ false: Colors.border, true: `${Colors.primary}70` }}
                    thumbColor={row.value ? Colors.primary : Colors.surfaceLight}
                  />
                )}
                {row.type === 'arrow' && <Text style={styles.arrow}>›</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.version}>WorkPulse v1.0.0</Text>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  hero: { alignItems: 'center', marginBottom: 24 },
  avatarRing: {
    padding: 3,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: '800' },
  displayName: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  email: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  roleText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  miniStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  miniStat: { flex: 1, alignItems: 'center', padding: 16 },
  miniStatVal: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  miniStatLbl: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 22, marginRight: 14 },
  rowInfo: { flex: 1 },
  rowLabel: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  arrow: { color: Colors.textMuted, fontSize: 22 },
  version: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  bottomSpacer: { height: 20 },
});

export default ProfileScreen;
