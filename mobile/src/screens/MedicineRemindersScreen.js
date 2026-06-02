import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import api from '../utils/api';

export default function MedicineRemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');

  const fetchReminders = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/reminders/patient/${patientId}`, { params: { isActive: 'true' } });
      setReminders(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, [patientId]);

  const handleLog = async (id, status) => {
    try {
      await api.post(`/reminders/${id}/log`, { status });
      Alert.alert('Success', status === 'taken' ? 'Marked as taken' : 'Marked as missed');
      fetchReminders();
    } catch (err) {
      Alert.alert('Error', 'Failed to log');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.medicineName}</Text>
          <Text style={styles.dosage}>{item.dosage} - {item.frequency}</Text>
          <Text style={styles.timing}>{item.timing} | {item.reminderTimes?.join(', ')}</Text>
        </View>
      </View>

      {/* Adherence bar */}
      <View style={styles.adherenceRow}>
        <Text style={styles.adherenceLabel}>Adherence: {item.adherenceRate || 0}%</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, {
            width: `${item.adherenceRate || 0}%`,
            backgroundColor: item.adherenceRate >= 80 ? '#22c55e' : item.adherenceRate >= 50 ? '#eab308' : '#ef4444'
          }]} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleLog(item._id, 'taken')} style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]}>
          <Text style={{ color: '#16a34a', fontWeight: '600', fontSize: 12 }}>Taken</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleLog(item._id, 'missed')} style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}>
          <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 12 }}>Missed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleLog(item._id, 'skipped')} style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]}>
          <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 12 }}>Skipped</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicine Reminders</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Patient ID..."
        value={patientId}
        onChangeText={setPatientId}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>{patientId ? 'No active reminders' : 'Enter Patient ID'}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  medName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  dosage: { fontSize: 13, color: '#64748b', marginTop: 2 },
  timing: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  adherenceRow: { marginTop: 10 },
  adherenceLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  barBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
