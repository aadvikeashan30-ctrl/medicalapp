import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import api from '../utils/api';

export default function MembershipsScreen() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/membership/plans');
      setPlans(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const renderPlan = ({ item }) => (
    <View style={[styles.card, item.isPopular && styles.cardPopular]}>
      {item.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Popular</Text>
        </View>
      )}
      <Text style={styles.planName}>{item.planName}</Text>
      {item.description && <Text style={styles.desc}>{item.description}</Text>}
      <Text style={styles.price}>
        ₹{item.price?.toLocaleString()}
        <Text style={styles.duration}> / {item.duration} months</Text>
      </Text>

      <View style={styles.benefits}>
        {item.freeConsultations > 0 && (
          <Text style={styles.benefit}>✓ {item.freeConsultations} free consultations</Text>
        )}
        {item.discountPercentage > 0 && (
          <Text style={styles.benefit}>✓ {item.discountPercentage}% discount on services</Text>
        )}
        {item.freeLabTests > 0 && (
          <Text style={styles.benefit}>✓ {item.freeLabTests} free lab tests</Text>
        )}
        {item.priorityBooking && (
          <Text style={styles.benefit}>✓ Priority booking</Text>
        )}
        {item.telemedicineIncluded && (
          <Text style={styles.benefit}>✓ Telemedicine included</Text>
        )}
      </View>

      <TouchableOpacity style={styles.subscribeBtn}>
        <Text style={styles.subscribeBtnText}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Membership Plans</Text>
      <Text style={styles.subtitle}>Choose a plan that suits your needs</Text>

      <FlatList
        data={plans}
        keyExtractor={item => item._id}
        renderItem={renderPlan}
        ListEmptyComponent={<Text style={styles.empty}>No plans available</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardPopular: { borderColor: '#d97706', borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#d97706', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  desc: { fontSize: 13, color: '#64748b', marginTop: 4 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#d97706', marginTop: 12 },
  duration: { fontSize: 14, fontWeight: 'normal', color: '#94a3b8' },
  benefits: { marginTop: 16, gap: 6 },
  benefit: { fontSize: 13, color: '#374151' },
  subscribeBtn: { marginTop: 16, backgroundColor: '#d97706', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  subscribeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 },
});
