import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import api from '../utils/api';
import { clearSession, getUser } from '../utils/auth';

const formatINR = (n) => {
  const v = Number(n || 0);
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
};

const greetingForHour = (h) =>
  h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';

const statusColor = {
  completed: '#10b981',
  'in-progress': '#3b82f6',
  scheduled: '#9ca3af',
  confirmed: '#6366f1',
  cancelled: '#ef4444'
};

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState({});
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [statsRes, queueRes, u] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/appointments/queue/today'),
        getUser()
      ]);
      setStats(statsRes.data);
      setQueue(queueRes.data || []);
      setUser(u || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out of DocClinic Pro?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.subtext}>Loading dashboard...</Text>
      </View>
    );
  }

  const statCards = [
    { label: 'Patients', value: stats?.totalPatients ?? 0, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Today Appts', value: stats?.todayAppointments ?? 0, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Revenue', value: `\u20B9${formatINR(stats?.monthRevenue)}`, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Pending', value: stats?.pendingPayments ?? 0, color: '#f59e0b', bg: '#fffbeb' }
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greetingForHour(new Date().getHours())},</Text>
          <Text style={styles.greeting}>Dr. {user.name || 'Doctor'}</Text>
          <Text style={styles.subtext}>Here's your clinic overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      <View style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
          onPress={() => navigation.navigate('Patients')}
        >
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionText}>Patient</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#f5f3ff' }]}
          onPress={() => navigation.navigate('Appointments')}
        >
          <Text style={styles.actionIcon}>{'\uD83D\uDCC5'}</Text>
          <Text style={styles.actionText}>Appt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ecfdf5' }]}
          onPress={() => navigation.navigate('Prescriptions')}
        >
          <Text style={styles.actionIcon}>{'\uD83D\uDCCB'}</Text>
          <Text style={styles.actionText}>Rx</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#fffbeb' }]}
          onPress={() => navigation.navigate('Billing')}
        >
          <Text style={styles.actionIcon}>{'\uD83D\uDCB0'}</Text>
          <Text style={styles.actionText}>Bill</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Today's Queue</Text>
      {queue.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No appointments scheduled for today</Text>
        </View>
      ) : (
        queue.map((apt) => (
          <View key={apt._id} style={styles.queueItem}>
            <View style={[styles.tokenBadge, { backgroundColor: (statusColor[apt.status] || '#9ca3af') + '20' }]}>
              <Text style={[styles.tokenText, { color: statusColor[apt.status] || '#9ca3af' }]}>
                #{apt.tokenNumber}
              </Text>
            </View>
            <View style={styles.queueInfo}>
              <Text style={styles.patientName}>{apt.patientId?.name || 'Patient'}</Text>
              <Text style={styles.aptDetails}>{apt.timeSlot} | {apt.type}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: statusColor[apt.status] || '#9ca3af' }]} />
          </View>
        ))
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20, marginTop: 8
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  subtext: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#fef2f2' },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  errorBox: {
    backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 16
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '48%', borderRadius: 16, padding: 16, flexGrow: 1 },
  statValue: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 20 },
  actionText: { fontSize: 11, fontWeight: '600', color: '#4b5563' },
  emptyBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6'
  },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6'
  },
  tokenBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tokenText: { fontSize: 12, fontWeight: 'bold' },
  queueInfo: { flex: 1, marginLeft: 12 },
  patientName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  aptDetails: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 }
});
