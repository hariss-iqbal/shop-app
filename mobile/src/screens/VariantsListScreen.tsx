import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { listVariants, VariantListItem } from '../api/variants';
import { useAuth } from '../auth/AuthContext';
import { colors, formatPkr, conditionLabel, ptaLabel } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Variants'>;

// The shop has tens of variants; fetch them all and group client-side by model
// so each phone model appears exactly once (its storage/condition/PTA configs
// are nested underneath, instead of looking like duplicate rows).
const FETCH_LIMIT = 500;

type ModelGroup = {
  modelId: string;
  modelName: string;
  brandName: string;
  brandLogoUrl: string | null;
  thumbnailUrl: string | null;
  stock: number;
  variants: VariantListItem[];
};

function groupByModel(items: VariantListItem[]): ModelGroup[] {
  const map = new Map<string, ModelGroup>();
  for (const v of items) {
    const key = v.modelId || `${v.brandName}:${v.modelName}`;
    let g = map.get(key);
    if (!g) {
      g = {
        modelId: key,
        modelName: v.modelName,
        brandName: v.brandName,
        brandLogoUrl: v.brandLogoUrl,
        thumbnailUrl: v.thumbnailUrl,
        stock: 0,
        variants: [],
      };
      map.set(key, g);
    }
    g.variants.push(v);
    g.stock += v.stockCount;
    if (!g.thumbnailUrl && v.thumbnailUrl) g.thumbnailUrl = v.thumbnailUrl;
  }
  // Sort configs within a model for a stable, readable order.
  for (const g of map.values()) {
    g.variants.sort(
      (a, b) =>
        (a.storageGb ?? 0) - (b.storageGb ?? 0) ||
        a.condition.localeCompare(b.condition) ||
        (a.ptaStatus ?? '').localeCompare(b.ptaStatus ?? '')
    );
  }
  return Array.from(map.values());
}

export default function VariantsListScreen() {
  const navigation = useNavigation<Nav>();
  const { signOut } = useAuth();
  const [items, setItems] = useState<VariantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (searchTerm: string) => {
    try {
      setError(null);
      const { items: rows, total: t } = await listVariants({
        search: searchTerm,
        page: 0,
        pageSize: FETCH_LIMIT,
      });
      setItems(rows);
      setTotal(t);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load variants');
    }
  }, []);

  // Initial + debounced search load.
  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      await load(search);
      if (active) setLoading(false);
    }, search ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  }, [search, load]);

  const groups = useMemo(() => groupByModel(items), [items]);

  const openVariant = useCallback(
    (v: VariantListItem) =>
      navigation.navigate('VariantDetail', { id: v.id, title: v.modelName }),
    [navigation]
  );

  const renderGroup = useCallback(
    ({ item: g }: { item: ModelGroup }) => (
      <View style={styles.card} testID={`model-${g.modelId}`}>
        <View style={styles.cardHeader}>
          {g.thumbnailUrl ? (
            <Image source={{ uri: g.thumbnailUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Text style={styles.thumbPlaceholderText}>
                {g.brandName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.model} numberOfLines={1}>
              {g.modelName}
            </Text>
            <Text style={styles.brand}>{g.brandName}</Text>
            <Text style={styles.headerMeta}>
              {g.variants.length} config{g.variants.length === 1 ? '' : 's'} · {g.stock} in stock
            </Text>
          </View>
        </View>

        <View style={styles.configList}>
          {g.variants.map((v) => (
            <TouchableOpacity
              key={v.id}
              testID={`variant-row-${v.id}`}
              style={styles.configRow}
              activeOpacity={0.6}
              onPress={() => openVariant(v)}
            >
              <View style={styles.configMain}>
                <View style={styles.configChips}>
                  {v.storageGb ? <Chip label={`${v.storageGb} GB`} /> : null}
                  <Chip label={conditionLabel(v.condition)} />
                  {ptaLabel(v.ptaStatus) ? <Chip label={ptaLabel(v.ptaStatus)!} /> : null}
                  {!v.isActive ? <Chip label="Hidden" warn /> : null}
                </View>
                {v.availableColors?.length ? (
                  <Text style={styles.colors} numberOfLines={1}>
                    {v.availableColors.join(' · ')}
                  </Text>
                ) : null}
              </View>
              <View style={styles.configRight}>
                <Text style={styles.price}>{formatPkr(v.sellingPrice)}</Text>
                <Text style={styles.stock}>{v.stockCount} pcs</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [openVariant]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search model…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              testID="search-clear"
              style={styles.clearBtn}
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity testID="signout-button" style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text testID="list-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          testID="variants-list"
          data={groups}
          keyExtractor={(g) => g.modelId}
          renderItem={renderGroup}
          contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <Text style={styles.countHeader}>
              {groups.length} model{groups.length === 1 ? '' : 's'} · {total} variant
              {total === 1 ? '' : 's'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No variants found.</Text>
            </View>
          }
          ListFooterComponent={
            total > items.length ? (
              <Text style={styles.footerNote}>
                Showing first {items.length} of {total}. Use search to narrow down.
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

function Chip({ label, warn }: { label: string; warn?: boolean }) {
  return (
    <View style={[styles.chip, warn ? styles.chipWarn : null]}>
      <Text style={[styles.chipText, warn ? styles.chipTextWarn : null]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchWrap: { flex: 1, position: 'relative', justifyContent: 'center' },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 38,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: { color: colors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 16 },
  signOut: { paddingHorizontal: 8, paddingVertical: 8 },
  signOutText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  errorBanner: { backgroundColor: '#fee2e2', color: colors.danger, padding: 10, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  listContent: { padding: 12 },
  emptyContainer: { flexGrow: 1 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  countHeader: { color: colors.textMuted, fontSize: 13, marginBottom: 8, marginLeft: 4 },
  footerNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginVertical: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#f1f5f9' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbPlaceholderText: { fontSize: 22, fontWeight: '700', color: colors.textMuted },
  headerText: { flex: 1, marginLeft: 12 },
  model: { fontSize: 17, fontWeight: '800', color: colors.text },
  brand: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  headerMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  configList: { borderTopWidth: 1, borderTopColor: colors.border },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  configMain: { flex: 1 },
  configChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  configRight: { alignItems: 'flex-end', marginLeft: 8 },
  chip: { backgroundColor: colors.chipBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipWarn: { backgroundColor: '#fef3c7' },
  chipText: { color: colors.chipText, fontSize: 11, fontWeight: '600' },
  chipTextWarn: { color: colors.warning },
  colors: { fontSize: 12, color: colors.textMuted, marginTop: 5 },
  price: { fontSize: 15, fontWeight: '800', color: colors.text },
  stock: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 26, color: colors.border, marginLeft: 6 },
});
