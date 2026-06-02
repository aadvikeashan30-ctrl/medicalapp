import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../utils/api';

export default function VaccinationsScreen() {
  const [tab, setTab] = useState('upcoming');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'upcoming' ? '/vaccinations/upcoming' : '/vaccinations/overdue';
      const res = await api.get(endpoint);
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.emoji}>💉</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.vaccineName}</Text>
          <Text style={styles.sub}>Dose {item.doseNumber}/{item.totalDoses} | {item.vaccineType}</Text>
          {item.patientId?.name && <Text style={styles.patient}>Patient: {item.patientId.name}</Text>}
        </View>
        <View style={styles.rightCol}>
          <View style={[styles.statusBadge, { backgroundColor: tab === 'overdue' ? '#fee2e2' : '#dbeafe' }]}>
            <Text style={[styles.statusText, { color: tab === 'overdue' ? '#dc2626' : '#2563eb' }]}>{item.status}</Text>
          </View>
          <Text style={styles.dateText}>
            {item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString('en-IN') : ''}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vaccinations</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab('upcoming')} style={[styles.tabBtn, tab === 'upcoming' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabActiveText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('overdue')} style={[styles.tabBtn, tab === 'overdue' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'overdue' && styles.tabActiveText]}>Overdue</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No {tab} vaccinations</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  tabRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  tabActiveText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  emoji: { fontSize: 24, marginRight: 10 },
  name: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  patient: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  rightCol: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
  dateText: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
