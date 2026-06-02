import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../utils/api';

const statusStyles = {
  completed: { bg: '#ecfdf5', color: '#059669', label: 'Done' },
  'in-progress': { bg: '#eff6ff', color: '#2563eb', label: 'Active' },
  scheduled: { bg: '#f3f4f6', color: '#6b7280', label: 'Waiting' },
  confirmed: { bg: '#eef2ff', color: '#4338ca', label: 'Confirmed' },
  cancelled: { bg: '#fef2f2', color: '#dc2626', label: 'Cancelled' }
};

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await api.get(`/appointments?date=${today}`);
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
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

  const counts = {
    completed: appointments.filter((a) => a.status === 'completed').length,
    inProgress: appointments.filter((a) => a.status === 'in-progress').length,
    waiting: appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          Today, {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={styles.countText}>{appointments.length} appointments</Text>
      </View>

      {error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#ecfdf5' }]}>
          <Text style={[styles.summaryNum, { color: '#059669' }]}>{counts.completed}</Text>
          <Text style={styles.summaryLabel}>Done</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.summaryNum, { color: '#2563eb' }]}>{counts.inProgress}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#f3f4f6' }]}>
          <Text style={[styles.summaryNum, { color: '#6b7280' }]}>{counts.waiting}</Text>
          <Text style={styles.summaryLabel}>Waiting</Text>
        </View>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No appointments scheduled today</Text>
        </View>
      ) : (
        appointments.map((apt) => {
          const s = statusStyles[apt.status] || statusStyles.scheduled;
          return (
            <TouchableOpacity
              key={apt._id}
              style={[styles.card, apt.status === 'in-progress' && styles.activeCard]}
            >
              <View style={[styles.token, { backgroundColor: s.bg }]}>
                <Text style={[styles.tokenNum, { color: s.color }]}>{apt.tokenNumber}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{apt.patientId?.name || 'Patient'}</Text>
                <Text style={styles.detail}>{apt.timeSlot} | {apt.type}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 80 }} />
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  countText: { fontSize: 13, color: '#6b7280' },
  errorBox: {
    backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 12
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryNum: { fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#9ca3af' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6'
  },
  activeCard: { borderColor: '#bfdbfe', backgroundColor: '#f0f7ff' },
  token: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tokenNum: { fontSize: 16, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  detail: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56,
    borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center',
    alignItems: 'center', elevation: 8
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' }
});
