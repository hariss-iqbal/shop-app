import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { getDeviceOuts, sellDeviceIn, returnDeviceOut, DeviceOut } from '../api/outs';
import { colors, formatPkr } from '../theme';
import { confirmAsync } from '../components/confirm';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'InDetail'>;

const METHODS = ['cash', 'card', 'other'];

export default function InDetailScreen() {
  const route = useRoute<DetailRoute>();
  const { id } = route.params;
  const [item, setItem] = useState<DeviceOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSell, setShowSell] = useState(false);
  const [price, setPrice] = useState('');
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Prefill the sale price exactly ONCE per item. Depending on `price` here
  // refetched on every keystroke and re-prefilled whenever the field was
  // momentarily empty — overwriting the user's edit mid-typing.
  const prefilledRef = useRef(false);
  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getDeviceOuts({ direction: 'in' });
      const found = all.find((o) => o.id === id) ?? null;
      setItem(found);
      if (found && !prefilledRef.current) {
        prefilledRef.current = true;
        setPrice(String(found.settledPrice ?? found.outPrice ?? ''));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onSell = async () => {
    if (!item) return;
    const sp = Number(price.replace(/[, ]/g, ''));
    if (!isFinite(sp) || sp < 0) return setError('Enter a valid sale price');
    setBusy(true);
    setError(null);
    try {
      const res = await sellDeviceIn({ outId: item.id, salePrice: sp, paymentMethod: method });
      if (!res.success) return setError(res.error ?? 'Sell failed');
      setDone(`✓ Sold ${formatPkr(sp)} · margin ${formatPkr(res.profit ?? 0)} · we now owe ${formatPkr(res.weOwe ?? 0)}`);
      setShowSell(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Sell failed');
    } finally {
      setBusy(false);
    }
  };

  const onReturn = async () => {
    if (!item) return;
    if (!(await confirmAsync('Return to partner', 'Hand this device back to the partner?'))) return;
    setBusy(true);
    try {
      const res = await returnDeviceOut(item.id);
      if (!res.success) return setError(res.error ?? 'Return failed');
      setDone('↩ Returned to partner');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Return failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!item)
    return (
      <View style={styles.center}>
        <Text testID="in-detail-error" style={{ color: colors.danger }}>
          {error ?? 'IN consignment not found'}
        </Text>
      </View>
    );

  const inStock = item.status === 'in_stock';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="in-detail">
      <View style={styles.hero}>
        <Text style={styles.model}>
          {item.brand} {item.model}
          {item.storageGb ? ` · ${item.storageGb}GB` : ''}
          {item.color ? ` · ${item.color}` : ''}
        </Text>
        <View
          testID="in-status"
          style={[styles.pill, inStock ? styles.pillPink : item.status === 'sold' ? styles.pillGreen : styles.pillGrey]}
        >
          <Text style={styles.pillText}>
            {inStock ? `IN STOCK · held for ${item.destinationName}` : item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {done ? (
        <Text testID="in-done" style={styles.doneBanner}>
          {done}
        </Text>
      ) : null}
      {error ? (
        <Text testID="in-detail-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>From partner</Text>
        <Text style={styles.dest}>{item.destinationName ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Money</Text>
        <Row k="IN price (we owe if sold)" v={formatPkr(item.outPrice)} />
        {item.settledPrice != null ? <Row k="Sold at (our price)" v={formatPkr(item.settledPrice)} /> : null}
        {item.status === 'sold' ? (
          <Row k="We owe partner" v={formatPkr(item.outstanding)} danger={item.outstanding > 0} />
        ) : null}
      </View>

      {inStock ? (
        <>
          {!showSell ? (
            <TouchableOpacity testID="in-sell-toggle" style={styles.sellBtn} onPress={() => setShowSell(true)}>
              <Text style={styles.sellBtnText}>Mark sold (record our price)</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Our sale price</Text>
              <TextInput
                testID="in-sell-price"
                style={styles.input}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text style={styles.fieldLabel}>Method</Text>
              <View style={styles.methodRow}>
                {METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    testID={`in-sell-method-${m}`}
                    style={[styles.method, method === m ? styles.methodOn : null]}
                    onPress={() => setMethod(m)}
                  >
                    <Text style={[styles.methodText, method === m ? styles.methodTextOn : null]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                testID="in-sell-submit"
                style={[styles.confirmBtn, busy ? styles.disabled : null]}
                onPress={onSell}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm sale</Text>}
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity testID="in-return-btn" style={styles.returnBtn} onPress={onReturn} disabled={busy}>
            <Text style={styles.returnText}>↩ Return to partner</Text>
          </TouchableOpacity>
          <Text style={styles.note}>It can also just be sold from the normal POS — that auto-creates what we owe.</Text>
        </>
      ) : (
        <Text style={styles.closed}>This consignment is {item.status}.</Text>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function Row({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={[styles.rowV, danger ? { color: colors.danger } : null]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  hero: { backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  model: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  pill: { marginTop: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  pillPink: { backgroundColor: colors.pink.bg },
  pillGreen: { backgroundColor: colors.green.bg },
  pillGrey: { backgroundColor: '#f1f5f9' },
  pillText: { fontWeight: '800', fontSize: 12.5, color: colors.text },
  doneBanner: { backgroundColor: colors.green.bg, color: colors.green.text, borderWidth: 1, borderColor: colors.green.border, borderRadius: 8, padding: 10, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  errorBanner: { backgroundColor: colors.red.bg, color: colors.danger, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 10 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  cardTitle: { fontSize: 11.5, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  dest: { fontSize: 16, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowK: { fontSize: 13.5, color: colors.textMuted },
  rowV: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  sellBtn: { backgroundColor: colors.success, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  sellBtnText: { color: colors.card, fontWeight: '800', fontSize: 15.5 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.text, marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, fontWeight: '700', color: colors.text, backgroundColor: colors.card },
  methodRow: { flexDirection: 'row', gap: 8 },
  method: { flex: 1, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  methodOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { fontWeight: '700', fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' },
  methodTextOn: { color: colors.card },
  confirmBtn: { backgroundColor: colors.success, borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  confirmText: { color: colors.card, fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.6 },
  returnBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  returnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  note: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
  closed: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 10 },
});
