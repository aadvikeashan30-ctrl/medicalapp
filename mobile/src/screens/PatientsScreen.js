import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../utils/api';

export default function PatientsScreen() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (debounced) params.set('search', debounced);
      const { data } = await api.get(`/patients?${params.toString()}`);
      setPatients(data.patients || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderPatient = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={[
        styles.avatar,
        { backgroundColor: item.gender === 'male' ? '#dbeafe' : '#fce7f3' }
      ]}>
        <Text style={[
          styles.avatarText,
          { color: item.gender === 'male' ? '#2563eb' : '#db2777' }
        ]}>
          {item.name?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>
          {item.patientId} | {item.age || '-'}y | {item.phone}
        </Text>
      </View>
      <View style={styles.visits}>
        <Text style={styles.visitCount}>{item.totalVisits || 0}</Text>
        <Text style={styles.visitLabel}>visits</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search patients by name or phone..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9ca3af"
      />

      {error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>
            {debounced ? 'No patients matched your search' : 'No patients yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  search: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16
  },
  errorBox: {
    backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 12
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6'
  },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  detail: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  visits: { alignItems: 'center' },
  visitCount: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  visitLabel: { fontSize: 10, color: '#9ca3af' },
  center: { paddingVertical: 40, alignItems: 'center' },
  empty: { color: '#9ca3af' },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56,
    borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center',
    alignItems: 'center', shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' }
});
