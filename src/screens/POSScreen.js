import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, Modal, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const COLORS = {
  bg: '#0f1117', card: '#161b2e', border: '#1e293b',
  accent: '#f59e0b', green: '#10b981', text: '#e2e8f0',
  muted: '#64748b', red: '#ef4444',
};

export default function POSScreen() {
  const { menuItems, customers, PAYMENT_METHODS, addOrder, todayOrders } = useApp();
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('全部');
  const [payMethod, setPayMethod] = useState('微信');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const categories = useMemo(() => ['全部', ...new Set(menuItems.map(i => i.category))], [menuItems]);
  const filteredMenu = category === '全部' ? menuItems : menuItems.filter(i => i.category === category);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  const filteredCustomers = useMemo(() =>
    customers.filter(c => c.name.includes(search) || c.phone.includes(search)).slice(0, 8),
    [customers, search]
  );

  function addToCart(item) {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function updateQty(id, delta) {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
    );
  }

  function checkout() {
    if (!cart.length) { Alert.alert('提示', '请先添加菜品'); return; }
    const orderData = { items: cart, total: cartTotal, payment: payMethod };
    if (selectedCustomer) {
      addOrder(selectedCustomer.id, orderData);
    }
    setCart([]);
    setSelectedCustomer(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <LinearGradient colors={['#0a0d16', '#0f1117']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🍜 收银台</Text>
          <Text style={styles.headerSub}>今日 {todayOrders.length} 单 · ¥{todayRevenue.toFixed(0)}</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: COLORS.accent }]}>¥{cartTotal.toFixed(0)}</Text>
            <Text style={styles.statLabel}>当前单</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Left: Menu */}
        <View style={styles.menuPanel}>
          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            {categories.map(cat => (
              <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}>
                <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu Grid */}
          <FlatList
            data={filteredMenu}
            keyExtractor={item => String(item.id)}
            numColumns={2}
            contentContainerStyle={{ padding: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => addToCart(item)} style={styles.menuCard} activeOpacity={0.7}>
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuPrice}>¥{item.price}</Text>
                <View style={styles.menuCatBadge}>
                  <Text style={styles.menuCatText}>{item.category}</Text>
                </View>
                {cart.find(c => c.id === item.id) && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.find(c => c.id === item.id).qty}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Right: Cart */}
        <View style={styles.cartPanel}>
          {/* Customer Binding */}
          <TouchableOpacity onPress={() => setShowCustomerPicker(true)} style={styles.customerBtn}>
            {selectedCustomer ? (
              <View style={styles.customerSelected}>
                <View>
                  <Text style={[styles.customerName, { color: COLORS.accent }]}>{selectedCustomer.name}</Text>
                  <Text style={styles.customerPhone}>{selectedCustomer.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.customerEmpty}>
                <Ionicons name="person-add-outline" size={16} color={COLORS.muted} />
                <Text style={styles.customerEmptyText}>点击绑定会员</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Cart Items */}
          <Text style={styles.sectionLabel}>订单明细 {cart.length > 0 ? `(${cart.length})` : ''}</Text>
          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {cart.length === 0 ? (
              <Text style={styles.emptyCart}>点击左侧菜品添加</Text>
            ) : cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <Text style={styles.cartItemEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>¥{item.price}</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.qty}</Text>
                  <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartSubtotal}>¥{item.price * item.qty}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Payment Methods */}
          <Text style={styles.sectionLabel}>支付方式</Text>
          <View style={styles.payRow}>
            {['微信', '支付宝', '现金', '银行卡'].map(m => (
              <TouchableOpacity key={m} onPress={() => setPayMethod(m)}
                style={[styles.payBtn, payMethod === m && styles.payBtnActive]}>
                <Text style={[styles.payBtnText, payMethod === m && styles.payBtnTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total & Checkout */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>合计</Text>
            <Text style={styles.totalAmount}>¥{cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity onPress={checkout} activeOpacity={0.85}>
            <LinearGradient
              colors={cart.length ? ['#f59e0b', '#ef4444'] : ['#1e293b', '#1e293b']}
              style={styles.checkoutBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.checkoutText, !cart.length && { color: COLORS.muted }]}>
                {cart.length ? `结账  ¥${cartTotal.toFixed(2)}` : '请添加菜品'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer Picker Modal */}
      <Modal visible={showCustomerPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择会员</Text>
              <TouchableOpacity onPress={() => { setShowCustomerPicker(false); setSearch(''); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
              <TextInput
                value={search} onChangeText={setSearch}
                placeholder="搜索姓名或手机号"
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
              />
            </View>
            <FlatList
              data={filteredCustomers}
              keyExtractor={item => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { setSelectedCustomer(item); setShowCustomerPicker(false); setSearch(''); }}
                  style={styles.customerListItem}>
                  <View style={styles.customerAvatar}>
                    <Text style={{ fontSize: 16 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerListName}>{item.name}</Text>
                    <Text style={styles.customerListPhone}>{item.phone}</Text>
                  </View>
                  <Text style={styles.customerListOrders}>{item.orders.length}次消费</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyCart}>未找到客户</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Success Toast */}
      {showSuccess && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.toastText}>结账成功！</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#f8fafc' },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  headerStats: { flexDirection: 'row', gap: 16 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.muted },
  body: { flex: 1, flexDirection: 'row' },
  menuPanel: { flex: 1, borderRightWidth: 1, borderRightColor: COLORS.border },
  catScroll: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { borderColor: COLORS.accent, backgroundColor: '#f59e0b22' },
  catBtnText: { fontSize: 12, color: COLORS.muted },
  catBtnTextActive: { color: COLORS.accent, fontWeight: '700' },
  menuCard: { flex: 1, margin: 4, padding: 12, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  menuEmoji: { fontSize: 28, marginBottom: 6 },
  menuName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  menuPrice: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
  menuCatBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.border, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2 },
  menuCatText: { fontSize: 9, color: COLORS.muted },
  cartBadge: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cartPanel: { width: 220, padding: 12, backgroundColor: '#0a0d16' },
  customerBtn: { backgroundColor: COLORS.card, borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  customerSelected: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerEmpty: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerEmptyText: { fontSize: 13, color: COLORS.muted },
  customerName: { fontSize: 14, fontWeight: '700' },
  customerPhone: { fontSize: 11, color: COLORS.muted },
  sectionLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 6, marginTop: 4 },
  cartList: { flex: 1 },
  emptyCart: { textAlign: 'center', color: COLORS.muted, fontSize: 12, paddingVertical: 20 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  cartItemEmoji: { fontSize: 16, width: 22 },
  cartItemName: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  cartItemPrice: { fontSize: 11, color: COLORS.muted },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 22, height: 22, borderRadius: 5, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: COLORS.text, fontSize: 14, lineHeight: 18 },
  qtyVal: { fontSize: 13, fontWeight: '700', color: COLORS.text, width: 16, textAlign: 'center' },
  cartSubtotal: { fontSize: 12, fontWeight: '700', color: COLORS.accent, width: 36, textAlign: 'right' },
  payRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  payBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  payBtnActive: { borderColor: COLORS.green, backgroundColor: '#10b98122' },
  payBtnText: { fontSize: 11, color: COLORS.muted },
  payBtnTextActive: { color: COLORS.green, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  totalLabel: { fontSize: 13, color: COLORS.muted },
  totalAmount: { fontSize: 22, fontWeight: '900', color: COLORS.accent },
  checkoutBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  checkoutText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a2035', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  customerListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  customerAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  customerListName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  customerListPhone: { fontSize: 12, color: COLORS.muted },
  customerListOrders: { fontSize: 12, color: COLORS.muted },
  toast: { position: 'absolute', top: 80, alignSelf: 'center', backgroundColor: COLORS.green, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, shadowColor: COLORS.green, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
