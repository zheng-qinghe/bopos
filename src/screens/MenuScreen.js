import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const COLORS = {
  bg: '#0f1117', card: '#161b2e', border: '#1e293b',
  accent: '#f59e0b', green: '#10b981', text: '#e2e8f0',
  muted: '#64748b', red: '#ef4444',
};

const EMOJI_OPTIONS = [
  '🥩','🥗','🫘','🍗','🍳','🦐','🐟','🥬','🍚','🥣',
  '🍜','🍝','🍲','🥘','🫕','🍱','🥟','🍤','🍣','🍛',
  '🫔','🌮','🥙','🧆','🥚','🧀','🥦','🥕','🌽','🍅',
  '🍺','🧃','🥤','☕','🍵','🧋','🍷','🥂','🍹','🧊',
];

const CATEGORY_OPTIONS = ['主菜','凉菜','家常菜','海鲜','素菜','主食','汤品','饮品','小吃','甜点'];

export default function MenuScreen() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useApp();
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState('全部');

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('主菜');
  const [formEmoji, setFormEmoji] = useState('🍽️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  const categories = ['全部', ...new Set(menuItems.map(i => i.category))];
  const filtered = filterCat === '全部' ? menuItems : menuItems.filter(i => i.category === filterCat);

  function openAdd() {
    setEditItem(null);
    setFormName(''); setFormPrice(''); setFormCategory('主菜'); setFormEmoji('🍽️');
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setFormName(item.name);
    setFormPrice(String(item.price));
    setFormCategory(item.category);
    setFormEmoji(item.emoji);
    setShowForm(true);
  }

  function handleSave() {
    if (!formName.trim()) { Alert.alert('提示', '请输入菜品名称'); return; }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) { Alert.alert('提示', '请输入有效价格'); return; }
    if (editItem) {
      updateMenuItem(editItem.id, { name: formName.trim(), price, category: formCategory, emoji: formEmoji });
    } else {
      addMenuItem({ name: formName.trim(), price, category: formCategory, emoji: formEmoji });
    }
    setShowForm(false);
  }

  function handleDelete(item) {
    Alert.alert('删除菜品', `确定删除「${item.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteMenuItem(item.id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={['#0a0d16', '#0f1117']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🍽️ 菜单管理</Text>
          <Text style={styles.headerSub}>共 {menuItems.length} 道菜品</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>新增菜品</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        {categories.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setFilterCat(cat)}
            style={[styles.catBtn, filterCat === cat && styles.catBtnActive]}>
            <Text style={[styles.catBtnText, filterCat === cat && styles.catBtnTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu List */}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        renderItem={({ item }) => (
          <View style={styles.menuCard}>
            <View style={styles.menuEmojiBg}>
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuName}>{item.name}</Text>
              <View style={styles.menuMeta}>
                <View style={styles.catTag}>
                  <Text style={styles.catTagText}>{item.category}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.menuPrice}>¥{item.price}</Text>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
              <Ionicons name="create-outline" size={18} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>暂无菜品，点击右上角添加</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editItem ? '编辑菜品' : '新增菜品'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Emoji picker trigger */}
            <Text style={styles.inputLabel}>图标</Text>
            <TouchableOpacity onPress={() => setShowEmojiPicker(true)} style={styles.emojiTrigger}>
              <Text style={styles.emojiTriggerText}>{formEmoji}</Text>
              <Text style={styles.emojiTriggerHint}>点击更换图标</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
            </TouchableOpacity>

            <Text style={styles.inputLabel}>菜品名称</Text>
            <TextInput
              value={formName} onChangeText={setFormName}
              placeholder="例：红烧肉"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              maxLength={12}
            />

            <Text style={styles.inputLabel}>价格（元）</Text>
            <TextInput
              value={formPrice} onChangeText={setFormPrice}
              placeholder="例：48"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>分类</Text>
            <TouchableOpacity onPress={() => setShowCatPicker(true)} style={styles.catTrigger}>
              <Text style={styles.catTriggerText}>{formCategory}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
            </TouchableOpacity>

            <View style={styles.formBtns}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.saveBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.saveBtnText}>{editItem ? '保存修改' : '添加菜品'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} animationType="fade" transparent onRequestClose={() => setShowEmojiPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.emojiModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择图标</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={EMOJI_OPTIONS}
              keyExtractor={(item, i) => String(i)}
              numColumns={8}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => { setFormEmoji(item); setShowEmojiPicker(false); }}
                  style={[styles.emojiOption, formEmoji === item && styles.emojiOptionActive]}>
                  <Text style={styles.emojiOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCatPicker} animationType="fade" transparent onRequestClose={() => setShowCatPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { paddingBottom: 8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择分类</Text>
              <TouchableOpacity onPress={() => setShowCatPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {CATEGORY_OPTIONS.map(cat => (
              <TouchableOpacity key={cat} onPress={() => { setFormCategory(cat); setShowCatPicker(false); }}
                style={[styles.catOption, formCategory === cat && styles.catOptionActive]}>
                <Text style={[styles.catOptionText, formCategory === cat && { color: COLORS.accent }]}>{cat}</Text>
                {formCategory === cat && <Ionicons name="checkmark" size={18} color={COLORS.accent} />}
              </TouchableOpacity>
            ))}
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: COLORS.accent, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  catScroll: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { borderColor: COLORS.accent, backgroundColor: '#f59e0b22' },
  catBtnText: { fontSize: 13, color: COLORS.muted },
  catBtnTextActive: { color: COLORS.accent, fontWeight: '700' },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  menuEmojiBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' },
  menuEmoji: { fontSize: 26 },
  menuName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  menuMeta: { flexDirection: 'row' },
  catTag: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catTagText: { fontSize: 11, color: COLORS.muted },
  menuPrice: { fontSize: 18, fontWeight: '900', color: COLORS.accent, marginRight: 4 },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a2035', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.text, fontSize: 15, marginBottom: 14 },
  emojiTrigger: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f1117', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 14 },
  emojiTriggerText: { fontSize: 28 },
  emojiTriggerHint: { flex: 1, fontSize: 13, color: COLORS.muted },
  catTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f1117', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 20 },
  catTriggerText: { fontSize: 15, color: COLORS.text },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: COLORS.border, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.muted, fontWeight: '700' },
  saveBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveBtnGrad: { padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emojiModal: { backgroundColor: '#1a2035', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  emojiOption: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, margin: 2 },
  emojiOptionActive: { backgroundColor: '#f59e0b33' },
  emojiOptionText: { fontSize: 26 },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catOptionActive: {},
  catOptionText: { fontSize: 15, color: COLORS.text },
});
