import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../utils/api';

export default function PrescriptionScreen() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get('/prescriptions?limit=50');
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load prescriptions');
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
      <Text style={styles.title}>Recent Prescriptions</Text>

      {error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      {prescriptions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No prescriptions yet</Text>
        </View>
      ) : (
        prescriptions.map((rx) => (
          <TouchableOpacity key={rx._id} style={styles.card}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{'\uD83D\uDCCB'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{rx.patientId?.name || 'Patient'}</Text>
              {rx.diagnosis ? <Text style={styles.diagnosis}>{rx.diagnosis}</Text> : null}
              <Text style={styles.detail}>
                {rx.prescriptionNo} | {(rx.medicines || []).length} medicines |{' '}
                {new Date(rx.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity style={styles.shareBtn}>
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
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
  title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  errorBox: {
    backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 12
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#9ca3af' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6'
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center'
  },
  icon: { fontSize: 20 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  diagnosis: { fontSize: 13, color: '#2563eb', marginTop: 2, fontWeight: '500' },
  detail: { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  shareBtn: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shareText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56,
    borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center',
    alignItems: 'center', elevation: 8
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' }
});
