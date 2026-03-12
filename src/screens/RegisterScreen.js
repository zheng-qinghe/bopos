import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const COLORS = {
  bg: '#0f1117', card: '#161b2e', border: '#1e293b',
  accent: '#f59e0b', green: '#10b981', text: '#e2e8f0',
  muted: '#64748b', red: '#ef4444',
};

export default function RegisterScreen({ navigation }) {
  const { registerCustomer } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!name.trim()) { setError('请输入您的姓名'); return false; }
    if (name.trim().length < 2) { setError('姓名至少2个字'); return false; }
    if (!phone.trim()) { setError('请输入手机号'); return false; }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) { setError('请输入正确的手机号'); return false; }
    setError('');
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const result = registerCustomer(name.trim(), phone.trim());
      setLoading(false);
      if (result.success) {
        setStep('success');
      } else {
        setError(result.message);
      }
    }, 600);
  }

  if (step === 'success') {
    return (
      <View style={styles.successContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={styles.successIcon}>
          <Text style={{ fontSize: 64 }}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>注册成功！</Text>
        <Text style={styles.successSub}>欢迎您成为我们的会员</Text>
        <View style={styles.successCard}>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>姓名</Text>
            <Text style={styles.successVal}>{name}</Text>
          </View>
          <View style={[styles.successRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.successLabel}>手机号</Text>
            <Text style={styles.successVal}>{phone}</Text>
          </View>
        </View>
        <Text style={styles.successNote}>
          您的会员信息已登记{'\n'}每次消费可积累积分和优惠
        </Text>
        <TouchableOpacity onPress={() => { setStep('form'); setName(''); setPhone(''); }} style={styles.backBtn}>
          <Text style={styles.backBtnText}>继续注册其他会员</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Top decoration */}
        <LinearGradient colors={['#f59e0b22', '#0f1117']} style={styles.topGrad} />

        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🍜</Text>
          <Text style={styles.logoTitle}>餐饮智慧会员</Text>
          <Text style={styles.logoSub}>填写信息，即可成为我们的会员</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>会员注册</Text>

          <Text style={styles.inputLabel}>您的姓名</Text>
          <View style={[styles.inputWrap, name && styles.inputWrapActive]}>
            <Ionicons name="person-outline" size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              placeholder="请输入真实姓名"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              maxLength={10}
            />
            {name.length >= 2 && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            )}
          </View>

          <Text style={styles.inputLabel}>手机号码</Text>
          <View style={[styles.inputWrap, phone && styles.inputWrapActive]}>
            <Ionicons name="call-outline" size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(''); }}
              placeholder="请输入手机号"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={11}
            />
            {/^1[3-9]\d{9}$/.test(phone) && (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            )}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color={COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={loading ? ['#334155', '#334155'] : ['#f59e0b', '#ef4444']}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.submitText}>注册中...</Text>
              ) : (
                <>
                  <Text style={styles.submitText}>立即注册会员</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.benefits}>
          {[
            ['🎁', '专属会员优惠'],
            ['📊', '消费记录查询'],
            ['🔔', '活动优先通知'],
          ].map(([icon, text]) => (
            <View key={text} style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>{icon}</Text>
              <Text style={styles.benefitText}>{text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.privacy}>注册即同意会员服务协议与隐私政策</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingBottom: 40, paddingTop: 60 },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  logo: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 56 },
  logoTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginTop: 8 },
  logoSub: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  formCard: { width: '90%', backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  formTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  inputLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 6, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1117', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  inputWrapActive: { borderColor: '#334155' },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef444415', padding: 10, borderRadius: 8, marginBottom: 8 },
  errorText: { color: COLORS.red, fontSize: 13 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  benefits: { flexDirection: 'row', gap: 12, marginTop: 28 },
  benefitItem: { alignItems: 'center', width: 84 },
  benefitIcon: { fontSize: 28, marginBottom: 6 },
  benefitText: { fontSize: 11, color: COLORS.muted, textAlign: 'center' },
  privacy: { fontSize: 11, color: COLORS.muted, marginTop: 20 },
  successContainer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  successSub: { fontSize: 15, color: COLORS.muted, marginBottom: 28 },
  successCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  successLabel: { fontSize: 14, color: COLORS.muted },
  successVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  successNote: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.border, borderRadius: 12 },
  backBtnText: { color: COLORS.muted, fontWeight: '600' },
});
