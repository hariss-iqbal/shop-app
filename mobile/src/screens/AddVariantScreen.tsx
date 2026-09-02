import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  listBrands,
  Brand,
  searchGsmArenaModels,
  fetchGsmArenaSpecs,
  findOrCreateModel,
  findOrCreateVariant,
} from '../api/catalog';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddVariant'>;

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'open_box', label: 'Open Box' },
  { value: 'used', label: 'Used' },
];
const PTA_OPTIONS = [
  { value: 'pta_approved', label: 'PTA Approved' },
  { value: 'non_pta', label: 'Non-PTA' },
  { value: '', label: 'None' },
];

export default function AddVariantScreen() {
  const navigation = useNavigation<Nav>();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [storage, setStorage] = useState('');
  const [condition, setCondition] = useState('new');
  const [pta, setPta] = useState('non_pta');
  const [colorsText, setColorsText] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(false);

  // GSMArena lookup state
  const [looking, setLooking] = useState(false);
  const [gsmResults, setGsmResults] = useState<{ name: string; url: string }[]>([]);
  const [gsmStorage, setGsmStorage] = useState<number[]>([]);
  const [gsmNote, setGsmNote] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBrands().then(setBrands).catch((e) => setError(e?.message ?? 'Failed to load brands'));
  }, []);

  const brandName = brands.find((b) => b.id === brandId)?.name ?? '';

  const onLookup = async () => {
    if (!modelName.trim()) {
      setError('Type a model name to look up');
      return;
    }
    setLooking(true);
    setError(null);
    setGsmNote(null);
    setGsmResults([]);
    try {
      // 1) search for canonical matches
      const search = await searchGsmArenaModels(`${brandName} ${modelName}`.trim());
      if (search.ok && search.results.length) {
        setGsmResults(search.results.slice(0, 6));
      }
      // 2) try to pull specs for what's typed
      const specs = await fetchGsmArenaSpecs(brandName || modelName, modelName);
      if (specs.ok && specs.specs) {
        if (specs.specs.modelName) setModelName(specs.specs.modelName);
        if (specs.specs.colors?.length) setColorsText(specs.specs.colors.join(', '));
        if (specs.specs.storage?.length) {
          setGsmStorage(specs.specs.storage);
          if (!storage) setStorage(String(specs.specs.storage[0]));
        }
        setGsmNote(`Auto-filled from GSMArena (${specs.specs.colors?.length ?? 0} colors, ${specs.specs.storage?.length ?? 0} storage options)`);
      } else if (!search.ok || !search.results.length) {
        setGsmNote(
          'GSMArena lookup returned nothing (it is currently behind a Cloudflare check). Enter the details manually below.'
        );
      }
    } finally {
      setLooking(false);
    }
  };

  const onPickGsmResult = async (name: string) => {
    setModelName(name);
    setGsmResults([]);
    setLooking(true);
    try {
      const specs = await fetchGsmArenaSpecs(brandName || name, name);
      if (specs.ok && specs.specs) {
        if (specs.specs.colors?.length) setColorsText(specs.specs.colors.join(', '));
        if (specs.specs.storage?.length) {
          setGsmStorage(specs.specs.storage);
          if (!storage) setStorage(String(specs.specs.storage[0]));
        }
        setGsmNote('Auto-filled from GSMArena');
      }
    } finally {
      setLooking(false);
    }
  };

  const onCreate = async () => {
    setError(null);
    if (!brandId) return setError('Pick a brand');
    if (!modelName.trim()) return setError('Enter a model name');
    if (!condition) return setError('Pick a condition');
    const priceNum = Number(price.replace(/[, ]/g, ''));
    if (!isFinite(priceNum) || priceNum < 0) return setError('Enter a valid price');
    const storageGb = storage.trim() === '' ? null : parseInt(storage.trim(), 10);
    if (storageGb !== null && (!Number.isInteger(storageGb) || storageGb < 0))
      return setError('Enter a valid storage (GB) or leave blank');
    const availableColors = colorsText.split(',').map((c) => c.trim()).filter(Boolean);

    setCreating(true);
    try {
      const modelId = await findOrCreateModel(brandId, modelName);
      const { id, existed } = await findOrCreateVariant({
        modelId,
        storageGb,
        ptaStatus: pta || null,
        condition,
        sellingPrice: priceNum,
        availableColors,
        isActive,
      });
      // Replace this screen with the new/updated variant's detail.
      navigation.replace('VariantDetail', { id, title: modelName });
    } catch (e: any) {
      const msg = /duplicate|unique/i.test(e?.message ?? '')
        ? 'That variant already exists for this model.'
        : e?.message ?? 'Failed to create variant';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="add-variant">
      {error ? (
        <Text testID="create-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      <Section title="Brand">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandRow}>
          {brands.map((b) => (
            <TouchableOpacity
              key={b.id}
              testID={`brand-${b.id}`}
              style={[styles.chip, brandId === b.id ? styles.chipActive : null]}
              onPress={() => setBrandId(b.id)}
            >
              <Text style={[styles.chipText, brandId === b.id ? styles.chipTextActive : null]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Section>

      <Section title="Model">
        <View style={styles.lookupRow}>
          <TextInput
            testID="model-name-input"
            style={[styles.input, { flex: 1 }]}
            placeholder="e.g. Pixel 9 Pro"
            placeholderTextColor={colors.textMuted}
            value={modelName}
            onChangeText={setModelName}
          />
          <TouchableOpacity
            testID="gsmarena-lookup"
            style={[styles.lookupBtn, looking ? styles.btnDisabled : null]}
            onPress={onLookup}
            disabled={looking}
          >
            {looking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.lookupBtnText}>GSMArena</Text>
            )}
          </TouchableOpacity>
        </View>
        {gsmNote ? <Text style={styles.note}>{gsmNote}</Text> : null}
        {gsmResults.map((r) => (
          <TouchableOpacity key={r.url} style={styles.resultRow} onPress={() => onPickGsmResult(r.name)}>
            <Text style={styles.resultText}>{r.name}</Text>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Configuration">
        <Text style={styles.fieldLabel}>Storage (GB)</Text>
        <TextInput
          testID="storage-input"
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 128 (blank = N/A)"
          placeholderTextColor={colors.textMuted}
          value={storage}
          onChangeText={setStorage}
        />
        {gsmStorage.length ? (
          <View style={styles.quickRow}>
            {gsmStorage.map((s) => (
              <TouchableOpacity key={s} style={styles.quickChip} onPress={() => setStorage(String(s))}>
                <Text style={styles.quickChipText}>{s} GB</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Condition</Text>
        <Segmented options={CONDITIONS} value={condition} onChange={setCondition} idPrefix="condition" />

        <Text style={styles.fieldLabel}>PTA status</Text>
        <Segmented
          options={PTA_OPTIONS}
          value={pta}
          onChange={setPta}
          idPrefix="pta"
          idFor={(v) => v || 'none'}
        />

        <Text style={styles.fieldLabel}>Colors (comma-separated)</Text>
        <TextInput
          testID="colors-input"
          style={styles.input}
          placeholder="e.g. Obsidian, Porcelain"
          placeholderTextColor={colors.textMuted}
          value={colorsText}
          onChangeText={setColorsText}
        />

        <Text style={styles.fieldLabel}>Selling price</Text>
        <TextInput
          testID="price-input"
          style={styles.input}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          value={price}
          onChangeText={setPrice}
        />

        <View style={styles.statusRow}>
          <Text style={styles.fieldLabel}>Visible in catalog now</Text>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
        </View>
      </Section>

      <TouchableOpacity
        testID="create-variant-button"
        style={[styles.createBtn, creating ? styles.btnDisabled : null]}
        onPress={onCreate}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>Create variant</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Segmented({
  options,
  value,
  onChange,
  idPrefix,
  idFor,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  idPrefix: string;
  idFor?: (v: string) => string;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value || 'none'}
          testID={`${idPrefix}-${idFor ? idFor(o.value) : o.value}`}
          style={[styles.segment, value === o.value ? styles.segmentActive : null]}
          onPress={() => onChange(o.value)}
        >
          <Text style={[styles.segmentText, value === o.value ? styles.segmentTextActive : null]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 12 },
  errorBanner: { backgroundColor: '#fee2e2', color: colors.danger, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 8 },
  section: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  brandRow: { flexDirection: 'row' },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  lookupRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lookupBtn: { backgroundColor: colors.primaryDark, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minWidth: 96 },
  lookupBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  note: { fontSize: 12, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
  resultRow: { paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  resultText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text, backgroundColor: '#fff' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quickChip: { backgroundColor: colors.chipBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  quickChipText: { color: colors.chipText, fontSize: 12, fontWeight: '600' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', alignItems: 'center' },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  createBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
