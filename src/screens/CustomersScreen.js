import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, Modal, Alert, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useApp } from '../context/AppContext';

const COLORS = {
  bg: '#0f1117', card: '#161b2e', border: '#1e293b',
  accent: '#f59e0b', green: '#10b981', text: '#e2e8f0',
  muted: '#64748b', red: '#ef4444',
};

const SEGMENT_COLORS = {
  '🌟 忠实VIP': '#f59e0b', '🆕 新客户': '#10b981', '💤 沉睡常客': '#6366f1',
  '❌ 流失客户': '#ef4444', '💰 高价值客': '#ec4899', '✅ 潜力客户': '#14b8a6', '一般客户': '#64748b',
};

// The URL encoded into the QR code - in production this would be your real server URL
// For demo, we use a deep link that the register screen handles
// 【重要】部署 web-register/index.html 到任意免费托管后替换此 URL
// 推荐：GitHub Pages (免费) 或 Vercel (免费)
// 临时测试可用: https://zheng-qinghe.github.io/bopos/
const QR_REGISTER_URL = 'https://zheng-qinghe.github.io/bopos/';

export default function CustomersScreen() {
  const { rfmCustomers, updateCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const { customers: rawCustomers, registerCustomer } = useApp();

  const filtered = useMemo(() =>
    rfmCustomers.filter(c => c.name.includes(search) || c.phone.includes(search)),
    [rfmCustomers, search]
  );

  function startEdit(customer) {
    setEditCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
  }

  function saveEdit() {
    if (!editName.trim()) { Alert.alert('提示', '姓名不能为空'); return; }
    updateCustomer(editCustomer.id, { name: editName.trim(), phone: editPhone.trim() });
    setEditCustomer(null);
    Alert.alert('✅ 更新成功', '客户信息已更新，消费记录保持不变');
  }

  function addManual() {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('提示', '请填写姓名和手机号');
      return;
    }
    const result = registerCustomer(newName, newPhone);
    if (!result.success) {
      Alert.alert('提示', result.message);
      return;
    }
    setAddModal(false);
    setNewName(''); setNewPhone('');
    Alert.alert('✅ 添加成功', `${newName} 已加入会员`);
  }

  const totalRevenue = useMemo(() =>
    rfmCustomers.reduce((s, c) => s + (c.monetary || 0), 0), [rfmCustomers]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0d16', '#0f1117']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>👥 客户管理</Text>
          <Text style={styles.headerSub}>{rfmCustomers.length} 位会员 · 总消费 ¥{totalRevenue.toFixed(0)}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowQR(true)} style={styles.qrBtn}>
            <Ionicons name="qr-code" size={18} color="#fff" />
            <Text style={styles.qrBtnText}>会员码</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAddModal(true)} style={styles.addBtn}>
            <Ionicons name="person-add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
        <TextInput
          value={search} onChangeText={setSearch}
          placeholder="搜索会员姓名或手机号"
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Customer List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const segColor = SEGMENT_COLORS[item.segment] || COLORS.muted;
          return (
            <TouchableOpacity onPress={() => setDetailCustomer(item)} style={styles.customerCard} activeOpacity={0.8}>
              <View style={[styles.avatar, { backgroundColor: `${segColor}22` }]}>
                <Text style={{ fontSize: 20 }}>
                  {item.source === 'qr' ? '📱' : '👤'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={[styles.segBadge, { backgroundColor: `${segColor}20` }]}>
                    <Text style={[styles.segBadgeText, { color: segColor }]}>{item.segment}</Text>
                  </View>
                </View>
                <Text style={styles.cardPhone}>{item.phone}</Text>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStat}>💰 ¥{(item.monetary || 0).toFixed(0)}</Text>
                  <Text style={styles.cardStat}>🔁 {item.frequency}次</Text>
                  <Text style={[styles.cardStat, { color: item.recency > 60 ? COLORS.red : item.recency > 30 ? COLORS.accent : COLORS.green }]}>
                    ⏱ {item.recency}天前
                  </Text>
                </View>
              </View>
              <View style={styles.rfmMini}>
                {[['R', item.rScore, COLORS.green], ['F', item.fScore, '#6366f1'], ['M', item.mScore, COLORS.accent]].map(([l, s, c]) => (
                  <View key={l} style={styles.rfmMiniItem}>
                    <Text style={[styles.rfmMiniScore, { color: c }]}>{s}</Text>
                    <Text style={styles.rfmMiniLabel}>{l}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无会员数据</Text>}
      />

      {/* QR Code Modal */}
      <Modal visible={showQR} animationType="fade" transparent onRequestClose={() => setShowQR(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity onPress={() => setShowQR(false)} style={styles.qrClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>🍜 扫码办理会员</Text>
            <Text style={styles.qrSub}>顾客扫描下方二维码{'\n'}填写姓名和手机号即可注册</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={QR_REGISTER_URL}
                size={200}
                backgroundColor="#ffffff"
                color="#0f1117"
              />
            </View>
            <Text style={styles.qrHint}>注册成功后可在此界面查看</Text>
            <TouchableOpacity
              onPress={() => Share.share({ message: `请用微信扫描二维码注册会员，或访问：${QR_REGISTER_URL}` })}
              style={styles.shareBtn}
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>分享注册链接</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal visible={!!editCustomer} animationType="slide" transparent onRequestClose={() => setEditCustomer(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑客户信息</Text>
              <TouchableOpacity onPress={() => setEditCustomer(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.editNote}>
              ℹ️ 修改姓名/手机号不影响客户ID和消费记录
            </Text>
            <Text style={styles.inputLabel}>姓名</Text>
            <TextInput
              value={editName} onChangeText={setEditName}
              style={styles.editInput}
              placeholderTextColor={COLORS.muted}
            />
            <Text style={styles.inputLabel}>手机号</Text>
            <TextInput
              value={editPhone} onChangeText={setEditPhone}
              style={styles.editInput}
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.muted}
            />
            <View style={styles.editBtns}>
              <TouchableOpacity onPress={() => setEditCustomer(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}>
                <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.saveBtnText}>保存</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal visible={!!detailCustomer} animationType="slide" transparent onRequestClose={() => setDetailCustomer(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            {detailCustomer && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{detailCustomer.name}</Text>
                  <View style={styles.detailActions}>
                    <TouchableOpacity onPress={() => { setDetailCustomer(null); startEdit(detailCustomer); }} style={styles.editIconBtn}>
                      <Ionicons name="create-outline" size={20} color={COLORS.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDetailCustomer(null)}>
                      <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.detailPhone}>📞 {detailCustomer.phone}</Text>
                <Text style={styles.detailMeta}>
                  注册: {new Date(detailCustomer.createdAt).toLocaleDateString('zh-CN')}
                  {'  '}来源: {detailCustomer.source === 'qr' ? '扫码注册' : '手动录入'}
                </Text>
                <View style={[styles.segBadgeLg, { backgroundColor: `${SEGMENT_COLORS[detailCustomer.segment]}20`, marginVertical: 12 }]}>
                  <Text style={[styles.segBadgeLgText, { color: SEGMENT_COLORS[detailCustomer.segment] }]}>{detailCustomer.segment}</Text>
                </View>
                <View style={styles.detailStatsRow}>
                  {[['最近消费', `${detailCustomer.recency}天前`], ['消费次数', `${detailCustomer.frequency}次`], ['累计金额', `¥${(detailCustomer.monetary||0).toFixed(0)}`]].map(([l, v]) => (
                    <View key={l} style={styles.detailStatBox}>
                      <Text style={styles.detailStatVal}>{v}</Text>
                      <Text style={styles.detailStatLabel}>{l}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.ordersTitle}>消费记录 ({detailCustomer.orders?.length || 0})</Text>
                <ScrollView style={{ maxHeight: 180 }}>
                  {[...(detailCustomer.orders || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => (
                    <View key={o.id} style={styles.orderRow}>
                      <Text style={styles.orderDate}>{new Date(o.date).toLocaleDateString('zh-CN')}</Text>
                      <Text style={styles.orderItems} numberOfLines={1}>
                        {o.items.map(i => `${i.name}×${i.qty}`).join(' ')}
                      </Text>
                      <Text style={styles.orderTotal}>¥{o.total.toFixed(0)}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Customer Modal */}
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>手动添加会员</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>姓名 *</Text>
            <TextInput value={newName} onChangeText={setNewName} style={styles.editInput} placeholder="请输入姓名" placeholderTextColor={COLORS.muted} />
            <Text style={styles.inputLabel}>手机号 *</Text>
            <TextInput value={newPhone} onChangeText={setNewPhone} style={styles.editInput} placeholder="138xxxxxxxx" placeholderTextColor={COLORS.muted} keyboardType="phone-pad" />
            <View style={styles.editBtns}>
              <TouchableOpacity onPress={() => setAddModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addManual} style={styles.saveBtn}>
                <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.saveBtnText}>添加</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#f8fafc' },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f59e0b', borderRadius: 10 },
  qrBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBtn: { padding: 8, backgroundColor: COLORS.border, borderRadius: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  segBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  segBadgeText: { fontSize: 10, fontWeight: '600' },
  cardPhone: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  cardStats: { flexDirection: 'row', gap: 10 },
  cardStat: { fontSize: 11, color: COLORS.muted },
  rfmMini: { gap: 4 },
  rfmMiniItem: { alignItems: 'center' },
  rfmMiniScore: { fontSize: 14, fontWeight: '800' },
  rfmMiniLabel: { fontSize: 9, color: COLORS.muted },
  emptyText: { textAlign: 'center', color: COLORS.muted, padding: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  qrModal: { backgroundColor: '#1a2035', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center' },
  qrClose: { position: 'absolute', top: 20, right: 20 },
  qrTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  qrSub: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  qrBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 16 },
  qrHint: { fontSize: 12, color: COLORS.muted, marginBottom: 20 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.border, borderRadius: 12 },
  shareBtnText: { color: '#fff', fontWeight: '700' },
  editModal: { backgroundColor: '#1a2035', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  editNote: { fontSize: 13, color: COLORS.muted, backgroundColor: '#0f1117', padding: 10, borderRadius: 8, marginBottom: 16 },
  inputLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  editInput: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 14, marginBottom: 14 },
  editBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: COLORS.border, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.muted, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveBtnGrad: { padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  detailActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editIconBtn: { padding: 4 },
  detailPhone: { fontSize: 14, color: COLORS.muted, marginBottom: 4 },
  detailMeta: { fontSize: 12, color: COLORS.muted },
  segBadgeLg: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' },
  segBadgeLgText: { fontSize: 14, fontWeight: '700' },
  detailStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  detailStatBox: { flex: 1, backgroundColor: '#0f1117', borderRadius: 10, padding: 10, alignItems: 'center' },
  detailStatVal: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
  detailStatLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  ordersTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, marginBottom: 8 },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  orderDate: { fontSize: 12, color: COLORS.muted, width: 80 },
  orderItems: { flex: 1, fontSize: 11, color: COLORS.muted },
  orderTotal: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});
