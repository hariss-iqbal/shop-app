import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDeviceOuts, returnDeviceOutsBulk, claimDeviceOut, DeviceOut } from '../api/outs';
import { useAuth } from '../auth/AuthContext';
import { colors, formatPkr } from '../theme';
import { confirmAsync } from '../components/confirm';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'OutList'>;

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'sold', label: 'Sold' },
  { key: 'returned', label: 'Returned' },
  { key: 'all', label: 'All' },
];

export default function OutListScreen() {
  const navigation = useNavigation<Nav>();
  const { isAdminish, session } = useAuth();
  const myId = session?.user?.id ?? null;
  const [direction, setDirection] = useState<'out' | 'in'>('out');
  const [tab, setTab] = useState('active');
  const [items, setItems] = useState<DeviceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusFilter = (t: string, dir: 'out' | 'in') =>
    t === 'all' ? undefined : t === 'active' ? (dir === 'in' ? 'in_stock' : 'out') : t;

  // request counter: a slow response for a tab the user already left must not
  // overwrite the current tab's rows
  const reqRef = useRef(0);
  const load = useCallback(async (t: string, dir: 'out' | 'in') => {
    const req = ++reqRef.current;
    try {
      const rows = await getDeviceOuts({ status: statusFilter(t, dir), direction: dir });
      if (reqRef.current !== req) return;
      setError(null);
      setItems(rows);
    } catch (e: any) {
      if (reqRef.current !== req) return;
      setError(e?.message ?? 'Failed to load');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load(tab, direction).finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [tab, direction, load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(tab, direction);
    setRefreshing(false);
  }, [tab, direction, load]);

  // "customer standing here" needs to be instant — claim straight from the row
  const onQuickClaim = useCallback(
    async (item: DeviceOut) => {
      try {
        const res = await claimDeviceOut(item.id);
        if (!res.success) setError(res.error ?? 'Claim failed');
      } catch (e: any) {
        setError(e?.message ?? 'Claim failed');
      }
      await load(tab, direction);
    },
    [tab, direction, load]
  );

  // end-of-day restock: return every active transfer a branch still holds
  const onReturnAll = useCallback(
    async (rows: DeviceOut[]) => {
      // count honestly: units claimed by someone else will be skipped (a
      // manager can still force them individually from the detail screen)
      const isForeignClaimed = (r: DeviceOut) =>
        !!r.claimedUntil && new Date(r.claimedUntil) > new Date() && r.claimedBy !== myId;
      const allActive = rows.filter((r) => r.status === 'out');
      const active = allActive.filter((r) => !isForeignClaimed(r));
      const skipped = allActive.length - active.length;
      if (active.length === 0) {
        if (skipped > 0) setError('All units here are claimed by someone else right now');
        return;
      }
      const ok = await confirmAsync(
        'Return all',
        `Mark ${active.length} device(s) returned and back at ${active[0].fromLocation ?? 'the master shop'}?` +
          (skipped > 0 ? `\n(${skipped} claimed unit(s) will stay put)` : '')
      );
      if (!ok) return;
      try {
        const res = await returnDeviceOutsBulk(active.map((r) => r.id));
        if (!res.success) setError(res.error ?? 'Bulk return failed');
        else if ((res.failCount ?? 0) > 0)
          setError(`${res.okCount} returned, ${res.failCount} failed: ${(res.items ?? []).filter((i) => !i.success).map((i) => i.error).join('; ')}`);
      } catch (e: any) {
        setError(e?.message ?? 'Bulk return failed');
      }
      await load(tab, direction);
    },
    [tab, direction, load, myId]
  );

  const activeCount = items.filter((i) => i.status === 'out' || i.status === 'in_stock').length;
  const headline = items.reduce((s, i) => s + (i.outstanding || 0), 0);

  // Branch transfers grouped per holding shop, partner consignments after them.
  // Overdue pressure applies to partners only — our own branch has no deadline.
  const sections =
    direction === 'in'
      ? items.length === 0
        ? []
        : [{ title: null as string | null, data: items }]
      : [
          ...[...new Set(items.filter((i) => i.destinationKind === 'branch').map((i) => i.destinationName ?? '—'))]
            .sort()
            .map((name) => ({
              title: `At ${name}`,
              data: items.filter((i) => i.destinationKind === 'branch' && (i.destinationName ?? '—') === name),
            })),
          ...(items.some((i) => i.destinationKind === 'partner')
            ? [{ title: 'Partners', data: items.filter((i) => i.destinationKind === 'partner') }]
            : []),
        ];

  const renderItem = useCallback(
    ({ item }: { item: DeviceOut }) => {
      const isIn = item.direction === 'in';
      const isBranch = !isIn && item.destinationKind === 'branch';
      const overdue = !isIn && !isBranch && item.status === 'out' && item.daysOut >= 7;
      const claimed = item.status === 'out' && !!item.claimedUntil && new Date(item.claimedUntil) > new Date();
      return (
        <TouchableOpacity
          testID={`out-row-${item.id}`}
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(isIn ? 'InDetail' : 'OutDetail', { id: item.id })}
        >
          <View style={styles.rowTop}>
            <Text style={styles.model} numberOfLines={2}>
              {item.brand} {item.model}
              {item.storageGb ? ` · ${item.storageGb}GB` : ''}
              {item.color ? ` · ${item.color}` : ''}
            </Text>
            <StatusChip status={item.status} daysOut={item.daysOut} overdue={overdue} />
          </View>
          {item.imei ? <Text style={styles.imeiLine}>IMEI …{item.imei.slice(-5)}</Text> : null}
          <View style={styles.destRow}>
            <View style={[styles.badge, isIn ? styles.badgeIn : item.destinationKind === 'partner' ? styles.badgeExt : styles.badgeInt]}>
              <Text style={[styles.badgeText, isIn ? styles.badgeTextIn : item.destinationKind === 'partner' ? styles.badgeTextExt : styles.badgeTextInt]}>
                {isIn ? 'From' : item.destinationKind === 'partner' ? 'External' : 'Our branch'}
              </Text>
            </View>
            <Text style={styles.dest}>{item.destinationName ?? '—'}</Text>
            {item.status === 'out' && item.recallRequestedAt ? (
              <View style={[styles.badge, styles.badgeRecall]}>
                <Text style={[styles.badgeText, styles.badgeTextRecall]}>↩ return requested</Text>
              </View>
            ) : null}
            {claimed ? (
              <View style={[styles.badge, styles.badgeClaim]}>
                <Text style={[styles.badgeText, styles.badgeTextClaim]}>⏳ claimed</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.price}>
              {isIn
                ? item.status === 'sold'
                  ? `Sold ${formatPkr(item.settledPrice ?? 0)}`
                  : formatPkr(item.outPrice)
                : item.destinationKind === 'branch' && item.outPrice === 0
                ? 'Transfer'
                : formatPkr(item.settledPrice ?? item.outPrice)}
            </Text>
            {isIn ? (
              item.status === 'in_stock' ? (
                <Text style={styles.sellable}>● sellable</Text>
              ) : item.status === 'sold' && item.outstanding > 0 ? (
                <Text style={styles.weowe}>we owe {formatPkr(item.outstanding)}</Text>
              ) : item.status === 'sold' ? (
                <Text style={styles.paid}>✓ settled</Text>
              ) : (
                <Text style={styles.muted}>↩ returned</Text>
              )
            ) : item.outstanding > 0 ? (
              <Text style={styles.unpaid}>● {formatPkr(item.outstanding)} owed to us</Text>
            ) : item.status === 'sold' ? (
              <Text style={styles.paid}>✓ Paid</Text>
            ) : item.status === 'returned' ? (
              <Text style={styles.muted}>↩ Returned</Text>
            ) : isBranch && item.status === 'out' && !claimed ? (
              <TouchableOpacity
                testID={`quick-claim-${item.id}`}
                style={styles.quickClaimBtn}
                onPress={() => onQuickClaim(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.quickClaimText}>⏳ claim</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, onQuickClaim]
  );

  return (
    <View style={styles.container}>
      <View style={styles.dirToggle}>
        <TouchableOpacity
          testID="dir-out"
          style={[styles.dirBtn, direction === 'out' ? styles.dirOn : null]}
          onPress={() => setDirection('out')}
        >
          <Text style={[styles.dirText, direction === 'out' ? styles.dirTextOn : null]}>Out · our phones with others</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="dir-in"
          style={[styles.dirBtn, direction === 'in' ? styles.dirOnIn : null]}
          onPress={() => setDirection('in')}
        >
          <Text style={[styles.dirText, direction === 'in' ? styles.dirTextOn : null]}>In · partner phones with us</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statN}>{activeCount}</Text>
          <Text style={styles.statK}>{direction === 'in' ? 'held for others' : 'active out'}</Text>
        </View>
        <View style={[styles.stat, direction === 'in' ? styles.statRed : styles.statAmber]}>
          <Text style={[styles.statN, { color: direction === 'in' ? colors.red.text : colors.amber.text }]}>
            {formatPkr(headline)}
          </Text>
          <Text style={styles.statK}>{direction === 'in' ? 'we owe partners' : 'owed to us'}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            testID={`out-tab-${t.key}`}
            style={[styles.tab, tab === t.key ? styles.tabActive : null]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key ? styles.tabTextActive : null]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          testID="out-list"
          sections={sections}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>{section.title}</Text>
                {section.title !== 'Partners' && tab === 'active' && section.data.some((r) => r.status === 'out') ? (
                  <TouchableOpacity testID={`return-all-${section.title}`} onPress={() => onReturnAll(section.data)}>
                    <Text style={styles.returnAllLink}>↩ return all</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null
          }
          contentContainerStyle={items.length === 0 ? styles.empty : styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>{direction === 'in' ? '\ud83e\udd1d' : '\ud83d\udcf1'}</Text>
              <Text style={styles.emptyText}>
                {direction === 'in'
                  ? 'No partner phones with us right now.'
                  : 'Nothing here. Phones you move to the branch or a partner will show up in this list.'}
              </Text>
            </View>
          }
        />
      )}

      {direction === 'out' ? (
        <TouchableOpacity testID="create-out-fab" style={styles.fab} onPress={() => navigation.navigate('CreateOut')}>
          <Text style={styles.fabText}>+ OUT devices</Text>
        </TouchableOpacity>
      ) : isAdminish ? (
        <TouchableOpacity testID="create-in-fab" style={[styles.fab, styles.fabIn]} onPress={() => navigation.navigate('CreateIn')}>
          <Text style={styles.fabText}>+ Take a device IN</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatusChip({ status, daysOut, overdue }: { status: string; daysOut: number; overdue: boolean }) {
  if (status === 'out')
    return (
      <View style={[styles.chip, overdue ? styles.chipRed : styles.chipAmber]}>
        <Text style={[styles.chipText, overdue ? styles.chipTextRed : styles.chipTextAmber]}>OUT · {daysOut}d</Text>
      </View>
    );
  if (status === 'in_stock')
    return (
      <View style={[styles.chip, styles.chipPink]}>
        <Text style={[styles.chipText, styles.chipTextPink]}>IN STOCK</Text>
      </View>
    );
  if (status === 'sold')
    return (
      <View style={[styles.chip, styles.chipGreen]}>
        <Text style={[styles.chipText, styles.chipTextGreen]}>SOLD</Text>
      </View>
    );
  return (
    <View style={[styles.chip, styles.chipGrey]}>
      <Text style={[styles.chipText, styles.chipTextGrey]}>{status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  dirToggle: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  dirBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  dirOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dirOnIn: { backgroundColor: colors.pink.solid, borderColor: colors.pink.solid },
  dirText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  dirTextOn: { color: colors.card },
  stats: { flexDirection: 'row', gap: 10, padding: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 },
  statAmber: { backgroundColor: colors.amber.bg, borderColor: colors.amber.border },
  statRed: { backgroundColor: colors.red.bg, borderColor: colors.red.border },
  statN: { fontSize: 19, fontWeight: '800', color: colors.text },
  statK: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 7, paddingHorizontal: 12, marginBottom: 4 },
  tab: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: colors.card },
  errorBanner: { backgroundColor: colors.red.bg, color: colors.red.text, padding: 10, fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 34, marginBottom: 10 },
  emptyText: { color: colors.slate.text, fontSize: 13.5, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  empty: { flexGrow: 1 },
  listContent: { padding: 12, paddingBottom: 170 },
  imeiLine: { fontSize: 11.5, color: colors.slate.text, marginTop: 3, fontVariant: ['tabular-nums'] },
  quickClaimBtn: { borderWidth: 1, borderColor: colors.blue.border, backgroundColor: colors.blue.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  quickClaimText: { fontSize: 12, fontWeight: '800', color: colors.blue.text },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  model: { fontSize: 15.5, fontWeight: '800', color: colors.text, flex: 1 },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  badgeExt: { backgroundColor: colors.cyan.bg, borderColor: colors.cyan.border },
  badgeInt: { backgroundColor: colors.purple.bg, borderColor: colors.purple.border },
  badgeIn: { backgroundColor: colors.pink.bg, borderColor: colors.pink.border },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeTextExt: { color: colors.cyan.text },
  badgeTextInt: { color: colors.purple.text },
  badgeTextIn: { color: colors.pink.text },
  badgeRecall: { backgroundColor: colors.orange.bg, borderColor: colors.orange.border },
  badgeTextRecall: { color: colors.orange.text },
  badgeClaim: { backgroundColor: colors.blue.bg, borderColor: colors.blue.border },
  badgeTextClaim: { color: colors.blue.text },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 7 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  returnAllLink: { fontSize: 12, fontWeight: '800', color: colors.primary },
  dest: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 9 },
  price: { fontSize: 15, fontWeight: '800', color: colors.text },
  unpaid: { fontSize: 12, fontWeight: '800', color: colors.red.text },
  weowe: { fontSize: 12, fontWeight: '800', color: colors.red.text },
  sellable: { fontSize: 12, fontWeight: '800', color: colors.green.text },
  paid: { fontSize: 12, fontWeight: '800', color: colors.green.text },
  muted: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  chip: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  chipAmber: { backgroundColor: colors.amber.bg },
  chipRed: { backgroundColor: colors.red.bg },
  chipGreen: { backgroundColor: colors.green.bg },
  chipPink: { backgroundColor: colors.pink.bg },
  chipGrey: { backgroundColor: '#f1f5f9' },
  chipText: { fontSize: 11, fontWeight: '800' },
  chipTextAmber: { color: colors.amber.text },
  chipTextRed: { color: colors.red.text },
  chipTextGreen: { color: colors.green.text },
  chipTextPink: { color: colors.pink.text },
  chipTextGrey: { color: colors.slate.text },
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: 26, paddingVertical: 14, borderRadius: 30, elevation: 5, shadowColor: colors.text, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  fabIn: { backgroundColor: colors.pink.solid },
  fabText: { color: colors.card, fontWeight: '800', fontSize: 15 },
});
