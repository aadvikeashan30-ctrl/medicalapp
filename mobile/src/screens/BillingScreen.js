import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import api from '../utils/api';

const statusColor = { paid: '#059669', partial: '#d97706', pending: '#dc2626', refunded: '#6b7280' };
const statusBg = { paid: '#ecfdf5', partial: '#fffbeb', pending: '#fef2f2', refunded: '#f3f4f6' };

const formatINR = (n) => `\u20B9${Number(n || 0).toLocaleString('en-IN')}`;

export default function BillingScreen() {
  const [bills, setBills] = useState([]);
  const [revenue, setRevenue] = useState({ today: 0, month: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [billsRes, revRes] = await Promise.all([
        api.get('/billing?limit=50'),
        api.get('/billing/revenue/summary')
      ]);
      setBills(billsRes.data.bills || []);
      setRevenue(revRes.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing');
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
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>This Month</Text>
        <Text style={styles.revenueAmount}>{formatINR(revenue.month)}</Text>
        <View style={styles.revenueRow}>
          <View style={styles.revenueStat}>
            <Text style={styles.revenueStatValue}>{formatINR(revenue.today)}</Text>
            <Text style={styles.revenueStatLabel}>Today</Text>
          </View>
          <View style={styles.revenueStat}>
            <Text style={styles.revenueStatValue}>{formatINR(revenue.total)}</Text>
            <Text style={styles.revenueStatLabel}>Lifetime</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Bills</Text>

      {error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      {bills.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No bills yet</Text></View>
      ) : (
        bills.map((bill) => (
          <TouchableOpacity key={bill._id} style={styles.card}>
            <View style={styles.billInfo}>
              <Text style={styles.patient}>{bill.patientId?.name || 'Patient'}</Text>
              <Text style={styles.invoice}>{bill.invoiceNo} | {bill.paymentMethod}</Text>
            </View>
            <View style={styles.billRight}>
              <Text style={styles.amount}>{formatINR(bill.totalAmount)}</Text>
              <View style={[styles.badge, { backgroundColor: statusBg[bill.paymentStatus] || '#f3f4f6' }]}>
                <Text style={[styles.badgeText, { color: statusColor[bill.paymentStatus] || '#6b7280' }]}>
                  {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                </Text>
              </View>
            </View>
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
  revenueCard: { backgroundColor: '#2563eb', borderRadius: 20, padding: 20, marginBottom: 20 },
  revenueLabel: { color: '#bfdbfe', fontSize: 13 },
  revenueAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  revenueRow: { flexDirection: 'row', marginTop: 16, gap: 20 },
  revenueStat: {},
  revenueStatValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  revenueStatLabel: { color: '#bfdbfe', fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  errorBox: {
    backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1,
    padding: 12, borderRadius: 12, marginBottom: 12
  },
  errorText: { color: '#b91c1c', fontSize: 13 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#9ca3af' },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#f3f4f6'
  },
  billInfo: {},
  patient: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  invoice: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  billRight: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 20, right: 20, width: 56, height: 56,
    borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center',
    alignItems: 'center', elevation: 8
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' }
});
