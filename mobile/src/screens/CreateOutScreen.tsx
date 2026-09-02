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
import {
  searchAvailableDevices,
  countAvailableByVariant,
  listPartners,
  listLocations,
  createDeviceOut,
  createDeviceOutsBulk,
  createPartner,
  AvailableDevice,
  Partner,
  Location,
} from '../api/outs';
import { useAuth } from '../auth/AuthContext';
import { colors, formatPkr } from '../theme';
import { confirmAsync } from '../components/confirm';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateOut'>;

export default function CreateOutScreen() {
  const navigation = useNavigation<Nav>();
  const { isAdminish } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<AvailableDevice[]>([]);
  const [selected, setSelected] = useState<AvailableDevice[]>([]);
  // branch transfers are the everyday case for a two-shop setup — default there
  // even for managers; partner OUTs are the exception
  const [kind, setKind] = useState<'partner' | 'branch'>('branch');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [newPartner, setNewPartner] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPartners().then(setPartners).catch(() => {});
    listLocations()
      .then((ls) => {
        setLocations(ls);
        // two-shop reality: pre-select the (single) non-master branch so the
        // common move is zero destination taps
        const branches = ls.filter((l) => !l.isPrimary);
        if (branches.length === 1) setBranchId((prev) => prev ?? branches[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      try {
        const r = await searchAvailableDevices(search);
        if (active) setResults(r);
      } catch {}
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search]);

  const isPicked = (id: string) => selected.some((d) => d.id === id);
  const togglePick = (d: AvailableDevice) => {
    setSelected((prev) => {
      const next = prev.some((x) => x.id === d.id) ? prev.filter((x) => x.id !== d.id) : [...prev, d];
      // sensible price default: the device's tag when a single unit is picked
      if (next.length === 1) setPrice(String(next[0].sellingPrice || ''));
      if (next.length === 0) setPrice('');
      return next;
    });
  };

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
    if (selected.length === 0) return setError('Pick at least one device');
    const priceNum = Number(price.replace(/[, ]/g, '') || 0);
    if (!isFinite(priceNum) || priceNum < 0) return setError('Enter a valid OUT price');
    if (priceNum > 5000000) return setError('That price looks wrong. Check the amount.');
    if (kind === 'partner' && !partnerId) return setError('Pick a partner shop');
    if (kind === 'branch' && !branchId) return setError('Pick a destination branch');
    setBusy(true);
    try {
      // last-unit warning: does this OUT strip a variant's final available unit?
      const variantIds = [...new Set(selected.map((d) => d.variantId).filter(Boolean))] as string[];
      if (variantIds.length > 0) {
        const counts = await countAvailableByVariant(variantIds);
        const lastOnes = selected.filter(
          (d) => d.variantId && counts[d.variantId] - selected.filter((s) => s.variantId === d.variantId).length <= 0
        );
        if (lastOnes.length > 0) {
          const names = [...new Set(lastOnes.map((d) => `${d.brand} ${d.model}${d.storageGb ? ` ${d.storageGb}GB` : ''}`))];
          const ok = await confirmAsync(
            'Last unit warning',
            `This will move the LAST available unit of:\n${names.join('\n')}\n\nOUT anyway?`
          );
          if (!ok) return;
        }
      }

      if (selected.length === 1) {
        const res = await createDeviceOut({
          productId: selected[0].id,
          destinationKind: kind,
          outPrice: priceNum,
          toPartnerId: kind === 'partner' ? partnerId : null,
          toLocationId: kind === 'branch' ? branchId : null,
          notes: notes.trim() || null,
        });
        if (!res.success) {
          setError(res.error ?? 'Failed');
          // the picked device may have gone stale (moved/sold elsewhere) — refresh
          searchAvailableDevices(search).then(setResults).catch(() => {});
          return;
        }
        navigation.replace('OutDetail', { id: res.outId! });
      } else {
        const res = await createDeviceOutsBulk({
          productIds: selected.map((d) => d.id),
          destinationKind: kind,
          outPrice: priceNum,
          toPartnerId: kind === 'partner' ? partnerId : null,
          toLocationId: kind === 'branch' ? branchId : null,
          notes: notes.trim() || null,
        });
        if (!res.success) {
          setError(res.error ?? 'Failed');
          return;
        }
        const failed = (res.items ?? []).filter((i) => !i.success);
        if (failed.length > 0) {
          setError(`${res.okCount} moved, ${failed.length} failed: ${failed.map((f) => f.error).join('; ')}`);
          setSelected([]);
          searchAvailableDevices(search).then(setResults).catch(() => {});
          return;
        }
        navigation.goBack();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to OUT devices');
    } finally {
      setBusy(false);
    }
  };

  // hide a destination only when every selected device is already there
  const branchOptions = locations.filter(
    (l) => selected.length === 0 || selected.some((d) => d.locationId !== l.id)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID="create-out"
    >
      {error ? (
        <Text testID="create-out-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      <Text style={styles.section}>
        Devices{selected.length > 0 ? ` · ${selected.length} selected` : ''}
      </Text>
      {selected.map((d) => (
        <View key={d.id} style={styles.picked}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickedModel}>
              {d.brand} {d.model}
              {d.storageGb ? ` · ${d.storageGb}GB` : ''}
              {d.color ? ` · ${d.color}` : ''}
            </Text>
            <Text style={styles.pickedMeta}>
              {d.imei ? `IMEI ${d.imei} · ` : ''}at {d.locationCode ?? '—'} · cost {formatPkr(d.costPrice)}
            </Text>
          </View>
          <TouchableOpacity testID={`device-remove-${d.id}`} onPress={() => togglePick(d)}>
            <Text style={styles.changeLink}>remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TextInput
        testID="device-search"
        style={styles.input}
        placeholder="Search model or IMEI…"
        placeholderTextColor={colors.placeholder}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      <View style={styles.results}>
        {results
          .filter((d) => !isPicked(d.id))
          .slice(0, 8)
          .map((d) => (
            <TouchableOpacity
              key={d.id}
              testID={`device-pick-${d.id}`}
              style={styles.resultRow}
              onPress={() => togglePick(d)}
            >
              <View style={styles.checkbox}>
                <Text style={styles.checkboxMark}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultModel}>
                  {d.brand} {d.model}
                  {d.storageGb ? ` · ${d.storageGb}GB` : ''}
                  {d.color ? ` · ${d.color}` : ''}
                </Text>
                <Text style={styles.resultMeta}>
                  {d.imei ? `IMEI …${d.imei.slice(-5)} · ` : ''}
                  {d.locationCode ?? '—'} · {formatPkr(d.sellingPrice)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        {results.length === 0 ? <Text style={styles.muted}>No available devices match.</Text> : null}
      </View>

      <Text style={styles.section}>Send to</Text>
      {isAdminish ? (
        <View style={styles.seg}>
          <TouchableOpacity
            testID="dest-partner"
            style={[styles.segItem, kind === 'partner' ? styles.segOn : null]}
            onPress={() => setKind('partner')}
          >
            <Text style={[styles.segText, kind === 'partner' ? styles.segTextOn : null]}>Partner shop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="dest-branch"
            style={[styles.segItem, kind === 'branch' ? styles.segOn : null]}
            onPress={() => setKind('branch')}
          >
            <Text style={[styles.segText, kind === 'branch' ? styles.segTextOn : null]}>Our branch</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {kind === 'partner' && isAdminish ? (
        <View style={styles.chipsWrap}>
          {partners.map((p) => (
            <TouchableOpacity
              key={p.id}
              testID={`partner-${p.id}`}
              style={[styles.chip, partnerId === p.id ? styles.chipOn : null]}
              onPress={() => setPartnerId(p.id)}
            >
              <Text style={[styles.chipText, partnerId === p.id ? styles.chipTextOn : null]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.addPartnerRow}>
            <TextInput
              testID="new-partner-input"
              style={[styles.input, { flex: 1, paddingVertical: 8 }]}
              placeholder="+ New partner shop"
              placeholderTextColor={colors.placeholder}
              value={newPartner}
              onChangeText={setNewPartner}
            />
            <TouchableOpacity testID="add-partner" style={styles.addBtn} onPress={onAddPartner}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.chipsWrap}>
          {branchOptions.map((l) => (
            <TouchableOpacity
              key={l.id}
              testID={`branch-${l.id}`}
              style={[styles.chip, branchId === l.id ? styles.chipOn : null]}
              onPress={() => setBranchId(l.id)}
            >
              <Text style={[styles.chipText, branchId === l.id ? styles.chipTextOn : null]}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.section}>
        {kind === 'branch' ? 'Transfer price (Rs)' : 'OUT price (Rs)'}
        {selected.length > 1 ? ' — applies to each device' : ''}
      </Text>
      {kind === 'branch' ? (
        <Text style={styles.fineInline}>Just an internal price tag for the move, not a sale.</Text>
      ) : null}
      <TextInput
        testID="out-price-input"
        style={[styles.input, styles.bigInput]}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={colors.placeholder}
        value={price}
        onChangeText={setPrice}
      />
      {selected.length === 1 ? (
        <Text style={styles.muted}>
          Cost {formatPkr(selected[0].costPrice)} · margin{' '}
          {formatPkr(Number(price.replace(/[, ]/g, '') || 0) - selected[0].costPrice)}
        </Text>
      ) : null}

      <Text style={styles.section}>Note (optional)</Text>
      <TextInput
        testID="out-notes"
        style={styles.input}
        placeholder="e.g. customer confirming tomorrow"
        placeholderTextColor={colors.placeholder}
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity
        testID="create-out-submit"
        style={[styles.submit, busy ? styles.disabled : null]}
        onPress={onSubmit}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {selected.length > 1
              ? `OUT ${selected.length} devices →`
              : selected.length === 1
              ? 'OUT this device →'
              : 'OUT devices →'}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={styles.fine}>Devices are reserved &amp; removed from sellable stock until sold or returned.</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 14 },
  errorBanner: { backgroundColor: colors.red.bg, color: colors.red.text, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  section: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  bigInput: { fontSize: 20, fontWeight: '800' },
  results: { marginTop: 6 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, marginTop: 7 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxMark: { color: colors.primary, fontWeight: '800', fontSize: 14, lineHeight: 16 },
  resultModel: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  resultMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  muted: { fontSize: 12.5, color: colors.textMuted, marginTop: 8 },
  picked: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSubtle, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 7 },
  pickedModel: { fontSize: 15, fontWeight: '800', color: colors.text },
  pickedMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  changeLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  seg: { flexDirection: 'row', gap: 8 },
  segItem: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontWeight: '700', fontSize: 13.5, color: colors.textMuted },
  segTextOn: { color: colors.card },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600', fontSize: 13, color: colors.textMuted },
  chipTextOn: { color: colors.card },
  addPartnerRow: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%', marginTop: 4 },
  addBtn: { backgroundColor: colors.primaryDark, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  addBtnText: { color: colors.card, fontWeight: '700' },
  submit: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
  submitText: { color: colors.card, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
  fine: { fontSize: 11.5, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
  fineInline: { fontSize: 11.5, color: colors.textMuted, marginBottom: 6 },
});
