import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import api from '../utils/api';

const RECORD_TYPES = [
  { key: '', label: 'All' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'lab-result', label: 'Lab' },
  { key: 'vaccination', label: 'Vaccine' },
  { key: 'medication', label: 'Meds' },
];

export default function HealthRecordsScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchRecords = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const params = filterType ? { recordType: filterType } : {};
      const { data } = await api.get(`/health-records/patient/${patientId}`, { params });
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [patientId, filterType]);

  const renderRecord = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: '#e0f2fe' }]}>
          <Text style={styles.badgeText}>{item.recordType}</Text>
        </View>
      </View>
      {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Records</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Patient ID..."
        value={patientId}
        onChangeText={setPatientId}
      />

      <View style={styles.filterRow}>
        {RECORD_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setFilterType(t.key)}
            style={[styles.filterBtn, filterType === t.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filterType === t.key && styles.filterActiveText]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item._id}
          renderItem={renderRecord}
          ListEmptyComponent={<Text style={styles.empty}>{patientId ? 'No records found' : 'Enter Patient ID'}</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, fontSize: 14 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
  filterActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 12, color: '#64748b' },
  filterActiveText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, color: '#0369a1' },
  cardDesc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
