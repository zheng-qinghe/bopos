import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config';

const STATUS_CONFIG = {
  pending:  { label: '待确认', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
  cooking:  { label: '制作中', color: '#6366f1', bg: 'rgba(99,102,241,0.15)', icon: '👨‍🍳' },
  done:     { label: '已完成', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '✅' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active'); // active | all

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (e) { console.log('fetch orders error', e); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${BASE_URL}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (e) { Alert.alert('错误', '更新失败'); }
  };

  const displayed = filter === 'active'
    ? orders.filter(o => o.status !== 'done')
    : orders;

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <View style={s.container}>
      <LinearGradient colors={['#0a0d16', '#0f1117']} style={s.header}>
        <Text style={s.headerTitle}>📋 订单管理</Text>
        {pendingCount > 0 && (
          <View style={s.badge}><Text style={s.badgeText}>{pendingCount} 待确认</Text></View>
        )}
      </LinearGradient>

      <View style={s.filterRow}>
        {[['active','进行中'],['all','全部']].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.filterBtn, filter===key && s.filterActive]}
            onPress={() => setFilter(key)}>
            <Text style={[s.filterText, filter===key && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🍽️</Text>
            <Text style={s.emptyText}>{filter === 'active' ? '暂无进行中的订单' : '暂无订单记录'}</Text>
          </View>
        ) : displayed.map(order => {
          const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          return (
            <View key={order.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.tableName}>{order.table_name}</Text>
                <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[s.statusText, { color: st.color }]}>{st.icon} {st.label}</Text>
                </View>
              </View>
              <Text style={s.orderId}>{order.id} · {order.created_at?.slice(5,16)}</Text>

              <View style={s.itemList}>
                {order.items.map((item, i) => (
                  <View key={i} style={s.itemRow}>
                    <Text style={s.itemName}>{item.emoji} {item.name}</Text>
                    <Text style={s.itemQty}>×{item.qty}</Text>
                    <Text style={s.itemPrice}>¥{(item.price * item.qty).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {order.note ? (
                <View style={s.noteBox}>
                  <Text style={s.noteText}>📝 {order.note}</Text>
                </View>
              ) : null}

              <View style={s.cardFooter}>
                <Text style={s.total}>合计 ¥{parseFloat(order.total).toFixed(2)}</Text>
                <View style={s.btnRow}>
                  {order.status === 'pending' && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: '#6366f1' }]}
                      onPress={() => updateStatus(order.id, 'cooking')}>
                      <Text style={[s.actionBtnText, { color: '#6366f1' }]}>开始制作</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'cooking' && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10b981' }]}
                      onPress={() => updateStatus(order.id, 'done')}>
                      <Text style={[s.actionBtnText, { color: '#10b981' }]}>已完成</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#f8fafc' },
  badge: { backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 10, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#0a0d16' },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b' },
  filterActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
  filterText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  filterTextActive: { color: '#f59e0b' },
  list: { flex: 1, padding: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { color: '#334155', fontSize: 16 },
  card: { backgroundColor: '#161b2e', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tableName: { fontSize: 22, fontWeight: '900', color: '#f59e0b' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
  orderId: { fontSize: 11, color: '#334155', marginBottom: 12 },
  itemList: { borderTopWidth: 1, borderColor: '#1e293b', paddingTop: 10, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { flex: 1, fontSize: 15, color: '#e2e8f0' },
  itemQty: { fontSize: 13, color: '#64748b', marginRight: 12 },
  itemPrice: { fontSize: 15, color: '#f59e0b', fontWeight: '700', minWidth: 60, textAlign: 'right' },
  noteBox: { backgroundColor: '#0f1117', borderRadius: 8, padding: 10, marginTop: 10 },
  noteText: { fontSize: 13, color: '#94a3b8' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: '#1e293b' },
  total: { fontSize: 18, fontWeight: '900', color: '#f59e0b' },
  btnRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});
