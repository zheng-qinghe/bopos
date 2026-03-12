import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const COLORS = {
  bg: '#0f1117', card: '#161b2e', border: '#1e293b',
  accent: '#f59e0b', green: '#10b981', text: '#e2e8f0',
  muted: '#64748b', red: '#ef4444', purple: '#6366f1', pink: '#ec4899', teal: '#14b8a6',
};

const SEGMENT_COLORS = {
  '🌟 忠实VIP': '#f59e0b',
  '🆕 新客户': '#10b981',
  '💤 沉睡常客': '#6366f1',
  '❌ 流失客户': '#ef4444',
  '💰 高价值客': '#ec4899',
  '✅ 潜力客户': '#14b8a6',
  '一般客户': '#64748b',
};

const SEGMENT_TIPS = {
  '🌟 忠实VIP': '重点维护，提供专属优惠和生日礼遇',
  '🆕 新客户': '加强互动，引导复购，发放新客优惠券',
  '💤 沉睡常客': '发送唤醒优惠券，限时折扣召回',
  '❌ 流失客户': '评估挽回成本，考虑大力度优惠',
  '💰 高价值客': '鼓励增加到店频次，推荐会员充值',
  '✅ 潜力客户': '持续培育，逐步转化为VIP',
  '一般客户': '加强互动，了解需求，提升体验',
};

export default function RFMScreen() {
  const { rfmCustomers } = useApp();
  const [filter, setFilter] = useState('全部');
  const [selected, setSelected] = useState(null);

  const segmentCounts = useMemo(() => {
    const counts = {};
    rfmCustomers.forEach(c => { counts[c.segment] = (counts[c.segment] || 0) + 1; });
    return counts;
  }, [rfmCustomers]);

  const filtered = filter === '全部' ? rfmCustomers :
    rfmCustomers.filter(c => c.segment === filter);

  const totalRevenue = useMemo(() =>
    rfmCustomers.reduce((s, c) => s + (c.monetary || 0), 0), [rfmCustomers]);

  const avgFreq = useMemo(() =>
    rfmCustomers.length ? (rfmCustomers.reduce((s, c) => s + (c.frequency || 0), 0) / rfmCustomers.length).toFixed(1) : 0,
    [rfmCustomers]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0a0d16', '#0f1117']} style={styles.header}>
        <Text style={styles.headerTitle}>📊 RFM 客户分析</Text>
        <Text style={styles.headerSub}>{rfmCustomers.length} 位客户 · ¥{totalRevenue.toFixed(0)} 总营收 · 人均 {avgFreq} 次</Text>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Segment Cards */}
        <Text style={styles.sectionTitle}>客群分布</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          {[['全部', rfmCustomers.length, '#94a3b8'], ...Object.entries(SEGMENT_COLORS).map(([seg, color]) => [seg, segmentCounts[seg] || 0, color])].map(([seg, count, color]) => (
            <TouchableOpacity key={seg} onPress={() => setFilter(seg)}
              style={[styles.segCard, { borderColor: filter === seg ? color : COLORS.border, backgroundColor: filter === seg ? `${color}15` : COLORS.card }]}>
              <Text style={[styles.segCount, { color }]}>{count}</Text>
              <Text style={[styles.segLabel, { color: filter === seg ? color : COLORS.muted }]} numberOfLines={1}>{seg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bubble Chart */}
        <Text style={styles.sectionTitle}>消费分布气泡图</Text>
        <View style={styles.chartCard}>
          <Text style={styles.chartAxisY}>高频↑</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.chartArea}>
              {rfmCustomers.filter(c => c.frequency > 0).map(c => {
                const maxM = Math.max(...rfmCustomers.map(x => x.monetary || 0), 1);
                const maxF = Math.max(...rfmCustomers.map(x => x.frequency || 0), 1);
                const left = `${((c.monetary || 0) / maxM) * 88}%`;
                const bottom = `${((c.frequency || 0) / maxF) * 85}%`;
                const size = 10 + ((c.mScore || 1) / 5) * 10;
                const color = SEGMENT_COLORS[c.segment] || '#64748b';
                return (
                  <TouchableOpacity key={c.id} onPress={() => setSelected(c)}
                    style={[styles.bubble, { left, bottom, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: selected?.id === c.id ? 1 : 0.75 }]} />
                );
              })}
            </View>
            <Text style={styles.chartAxisX}>消费金额 →</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {Object.entries(SEGMENT_COLORS).map(([seg, color]) => (
            <View key={seg} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText} numberOfLines={1}>{seg.replace(/[^\u4e00-\u9fa5A-Za-z]/g, '').slice(0, 5)}</Text>
            </View>
          ))}
        </View>

        {/* Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHead, { flex: 1.2 }]}>客户</Text>
            <Text style={[styles.tableHead, { width: 60, textAlign: 'center' }]}>天前</Text>
            <Text style={[styles.tableHead, { width: 44, textAlign: 'center' }]}>频</Text>
            <Text style={[styles.tableHead, { width: 70, textAlign: 'right' }]}>金额</Text>
            <Text style={[styles.tableHead, { width: 28, textAlign: 'center' }]}>R</Text>
            <Text style={[styles.tableHead, { width: 28, textAlign: 'center' }]}>F</Text>
            <Text style={[styles.tableHead, { width: 28, textAlign: 'center' }]}>M</Text>
          </View>
          {[...filtered].sort((a, b) => ((b.rScore + b.fScore + b.mScore) || 0) - ((a.rScore + a.fScore + a.mScore) || 0)).map(c => (
            <TouchableOpacity key={c.id} onPress={() => setSelected(c)} style={[styles.tableRow, selected?.id === c.id && { backgroundColor: '#1e293b' }]}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.tableName} numberOfLines={1}>{c.name}</Text>
                <View style={[styles.segBadge, { backgroundColor: `${SEGMENT_COLORS[c.segment]}20` }]}>
                  <Text style={[styles.segBadgeText, { color: SEGMENT_COLORS[c.segment] }]} numberOfLines={1}>{c.segment}</Text>
                </View>
              </View>
              <Text style={[styles.tableCell, { width: 60, textAlign: 'center', color: c.recency > 60 ? COLORS.red : c.recency > 30 ? COLORS.accent : COLORS.green }]}>{c.recency != null ? c.recency : '-'}</Text>
              <Text style={[styles.tableCell, { width: 44, textAlign: 'center' }]}>{c.frequency}</Text>
              <Text style={[styles.tableCell, { width: 70, textAlign: 'right', color: COLORS.accent, fontWeight: '700' }]}>¥{(c.monetary || 0).toFixed(0)}</Text>
              {[c.rScore, c.fScore, c.mScore].map((s, i) => (
                <View key={i} style={[styles.scoreBox, { backgroundColor: s >= 4 ? '#10b98133' : s >= 3 ? '#f59e0b22' : '#ef444422', width: 28 }]}>
                  <Text style={[styles.scoreText, { color: s >= 4 ? COLORS.green : s >= 3 ? COLORS.accent : COLORS.red }]}>{s}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selected.name}</Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.segBadgeLg, { backgroundColor: `${SEGMENT_COLORS[selected.segment]}20`, marginBottom: 16 }]}>
                  <Text style={[styles.segBadgeLgText, { color: SEGMENT_COLORS[selected.segment] }]}>{selected.segment}</Text>
                </View>
                {[
                  ['最近消费', `${selected.recency} 天前`, selected.rScore, COLORS.green],
                  ['消费频率', `${selected.frequency} 次`, selected.fScore, COLORS.purple],
                  ['消费金额', `¥${(selected.monetary || 0).toFixed(0)}`, selected.mScore, COLORS.accent],
                ].map(([label, val, score, color]) => (
                  <View key={label} style={styles.metricRow}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <Text style={[styles.metricVal, { color }]}>{val}</Text>
                    <View style={styles.scoreBarBg}>
                      <View style={[styles.scoreBarFill, { width: `${(score / 5) * 100}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={[styles.metricScore, { color }]}>{score}/5</Text>
                  </View>
                ))}
                <View style={styles.tipBox}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>{SEGMENT_TIPS[selected.segment]}</Text>
                </View>
                <Text style={styles.recentTitle}>最近订单</Text>
                {[...selected.orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(o => (
                  <View key={o.id} style={styles.orderRow}>
                    <Text style={styles.orderDate}>{new Date(o.date).toLocaleDateString('zh-CN')}</Text>
                    <Text style={styles.orderPayment}>{o.payment}</Text>
                    <Text style={styles.orderTotal}>¥{o.total.toFixed(0)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#f8fafc' },
  headerSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  body: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  segCard: { width: 84, padding: 12, borderRadius: 12, marginRight: 8, borderWidth: 1, alignItems: 'center' },
  segCount: { fontSize: 22, fontWeight: '900' },
  segLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  chartCard: { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', height: 180 },
  chartAxisY: { fontSize: 10, color: COLORS.muted, transform: [{ rotate: '-90deg' }], alignSelf: 'center', width: 40, textAlign: 'center' },
  chartArea: { flex: 1, height: 150, position: 'relative', backgroundColor: '#0f1117', borderRadius: 8 },
  bubble: { position: 'absolute' },
  chartAxisX: { fontSize: 10, color: COLORS.muted, textAlign: 'right', marginTop: 4 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginTop: 8, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: COLORS.muted },
  tableCard: { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  tableHeader: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#0f1117' },
  tableHead: { fontSize: 11, color: COLORS.muted, fontWeight: '600' },
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  tableName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  tableCell: { fontSize: 12, color: COLORS.text },
  segBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 6, marginTop: 2, alignSelf: 'flex-start' },
  segBadgeText: { fontSize: 9, fontWeight: '600' },
  scoreBox: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  scoreText: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a2035', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  segBadgeLg: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start' },
  segBadgeLgText: { fontSize: 14, fontWeight: '700' },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  metricLabel: { fontSize: 13, color: COLORS.muted, width: 64 },
  metricVal: { fontSize: 13, fontWeight: '700', width: 70 },
  scoreBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  metricScore: { fontSize: 11, fontWeight: '700', width: 28, textAlign: 'right' },
  tipBox: { backgroundColor: '#0f1117', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 16 },
  tipIcon: { fontSize: 16 },
  tipText: { fontSize: 13, color: COLORS.muted, flex: 1, lineHeight: 20 },
  recentTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, marginBottom: 8 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  orderDate: { fontSize: 13, color: COLORS.muted },
  orderPayment: { fontSize: 13, color: COLORS.muted },
  orderTotal: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});
