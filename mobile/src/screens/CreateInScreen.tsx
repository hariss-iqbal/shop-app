import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listPartners, createPartner, createDeviceIn, Partner } from '../api/outs';
import { listBrands, Brand } from '../api/catalog';
import { colors, formatPkr } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateIn'>;

export default function CreateInScreen() {
  const navigation = useNavigation<Nav>();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [inPrice, setInPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [newPartner, setNewPartner] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPartners().then(setPartners).catch(() => {});
    listBrands().then(setBrands).catch(() => {});
  }, []);

  const onAddPartner = async () => {
    if (!newPartner.trim()) return;
    try {
      const p = await createPartner(newPartner.trim());
      setPartners((prev) => [...prev, p]);
      setPartnerId(p.id);
      setNewPartner('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add partner');
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (!partnerId) return setError('Pick the partner shop it came from');
    if (!brandId) return setError('Pick a brand');
    if (!model.trim()) return setError('Enter the model');
    const inP = Number(inPrice.replace(/[, ]/g, ''));
    if (!isFinite(inP) || inP < 0) return setError('Enter a valid IN price');
    const storageGb = storage.trim() === '' ? null : parseInt(storage.trim(), 10);
    const sellP = sellPrice.trim() === '' ? null : Number(sellPrice.replace(/[, ]/g, ''));
    setBusy(true);
    try {
      const res = await createDeviceIn({
        partnerId,
        brandId,
        modelName: model.trim(),
        inPrice: inP,
        storageGb,
        color: color.trim() || null,
        imei: imei.trim() || null,
        sellPrice: sellP,
      });
      if (!res.success) return setError(res.error ?? 'Failed');
      navigation.replace('InDetail', { id: res.outId! });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to take device IN');
    } finally {
      setBusy(false);
    }
  };

  const margin = (Number(sellPrice.replace(/[, ]/g, '') || 0) || 0) - Number(inPrice.replace(/[, ]/g, '') || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="create-in">
      {error ? (
        <Text testID="create-in-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      <Text style={styles.section}>From which shop</Text>
      <View style={styles.chips}>
        {partners.map((p) => (
          <TouchableOpacity
            key={p.id}
            testID={`in-partner-${p.id}`}
            style={[styles.chip, partnerId === p.id ? styles.chipOn : null]}
            onPress={() => setPartnerId(p.id)}
          >
            <Text style={[styles.chipText, partnerId === p.id ? styles.chipTextOn : null]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          testID="in-new-partner"
          style={[styles.input, { flex: 1 }]}
          placeholder="+ New partner shop"
          placeholderTextColor={colors.placeholder}
          value={newPartner}
          onChangeText={setNewPartner}
        />
        <TouchableOpacity testID="in-add-partner" style={styles.addBtn} onPress={onAddPartner}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Brand</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandRow}>
        {brands.map((b) => (
          <TouchableOpacity
            key={b.id}
            testID={`in-brand-${b.id}`}
            style={[styles.chip, brandId === b.id ? styles.chipOn : null]}
            onPress={() => setBrandId(b.id)}
          >
            <Text style={[styles.chipText, brandId === b.id ? styles.chipTextOn : null]}>{b.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Model</Text>
      <TextInput
        testID="in-model-input"
        style={styles.input}
        placeholder="e.g. Pixel 8 Pro"
        placeholderTextColor={colors.placeholder}
        value={model}
        onChangeText={setModel}
      />
      <View style={styles.two}>
        <View style={styles.col}>
          <Text style={styles.label}>Storage (GB)</Text>
          <TextInput
            testID="in-storage-input"
            style={styles.input}
            keyboardType="numeric"
            placeholder="256"
            placeholderTextColor={colors.placeholder}
            value={storage}
            onChangeText={setStorage}
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            testID="in-color-input"
            style={styles.input}
            placeholder="Black"
            placeholderTextColor={colors.placeholder}
            value={color}
            onChangeText={setColor}
          />
        </View>
      </View>
      <Text style={styles.label}>IMEI (optional)</Text>
      <TextInput
        testID="in-imei-input"
        style={styles.input}
        placeholder="scan or type…"
        placeholderTextColor={colors.placeholder}
        value={imei}
        onChangeText={setImei}
      />

      <Text style={styles.section}>IN price — what we'll owe them</Text>
      <TextInput
        testID="in-price-input"
        style={[styles.input, styles.big]}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        value={inPrice}
        onChangeText={setInPrice}
      />
      <Text style={styles.label}>Our intended sell price (optional)</Text>
      <TextInput
        testID="in-sell-input"
        style={styles.input}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        value={sellPrice}
        onChangeText={setSellPrice}
      />
      {sellPrice ? (
        <Text style={styles.muted}>
          ≈ margin <Text style={{ color: colors.success, fontWeight: '800' }}>{formatPkr(margin)}</Text> if sold
        </Text>
      ) : null}

      <TouchableOpacity
        testID="create-in-submit"
        style={[styles.submit, busy ? styles.disabled : null]}
        onPress={onSubmit}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Take IN →</Text>}
      </TouchableOpacity>
      <Text style={styles.fine}>
        Added to sellable stock, flagged consignment. Not counted in our owned-stock value.
      </Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14 },
  errorBanner: { backgroundColor: colors.red.bg, color: colors.danger, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 7 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  big: { fontSize: 20, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  brandRow: { flexDirection: 'row' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card, marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: colors.pink.text, borderColor: colors.pink.text },
  chipText: { fontWeight: '600', fontSize: 13, color: colors.textMuted },
  chipTextOn: { color: colors.card },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  addBtn: { backgroundColor: colors.primaryDark, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  addBtnText: { color: colors.card, fontWeight: '700' },
  two: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  muted: { fontSize: 12.5, color: colors.textMuted, marginTop: 8 },
  submit: { backgroundColor: colors.pink.text, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
  submitText: { color: colors.card, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
  fine: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
});
