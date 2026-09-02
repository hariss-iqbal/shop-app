import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPartnerBalances,
  createPartner,
  listLocations,
  setPrimaryLocation,
  payPartner,
  PartnerBalance,
  Location,
} from '../api/outs';
import { useAuth } from '../auth/AuthContext';
import { colors, formatPkr } from '../theme';
import { confirmAsync } from '../components/confirm';

export default function PartnersScreen() {
  const { isAdminish, signOut } = useAuth();
  const [items, setItems] = useState<PartnerBalance[]>([]);
  const [shops, setShops] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await getPartnerBalances());
      setShops(await listLocations());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  // settle up what WE owe a partner (sold consignment-IN devices); applies to
  // the oldest unpaid rows first via the pay_partner RPC
  const onPayPartner = async (p: PartnerBalance) => {
    const amt = Number(payAmount.replace(/[, ]/g, ''));
    if (!isFinite(amt) || amt <= 0) return setError('Enter a valid amount');
    if (amt > 5000000) return setError('That amount looks wrong. Check it.');
    if (amt > p.payable) return setError(`You only owe ${formatPkr(p.payable)} to ${p.name}`);
    if (!(await confirmAsync('Record payment', `Pay ${formatPkr(amt)} to ${p.name}?`))) return;
    try {
      setError(null);
      const res = await payPartner(p.id, amt);
      if (!res.success) return setError(res.error ?? 'Payment failed');
      setPayingId(null);
      setPayAmount('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Payment failed');
    }
  };

  const onSetMaster = async (shop: Location) => {
    if (shop.isPrimary) return;
    if (
      !(await confirmAsync(
        'Change master shop',
        `Make "${shop.name}" the master shop? New stock will be booked there.`
      ))
    )
      return;
    try {
      setError(null);
      await setPrimaryLocation(shop.id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to set master');
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onAdd = async () => {
    if (!name.trim()) return;
    try {
      await createPartner(name.trim(), phone.trim() || undefined);
      setName('');
      setPhone('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add');
    }
  };

  const total = items.reduce((s, p) => s + (p.net || 0), 0);

  // Everything scrolls as ONE list (cards live in the header) so the
  // pull-to-refresh gesture works from anywhere on the screen — with fixed
  // cards above a squeezed list, pulling near the top hit dead Views.
  const header = (
    <>
      <View style={styles.summary}>
        <Text style={styles.summaryN}>
          {total === 0 ? 'Rs 0' : `${total > 0 ? '+' : '−'}${formatPkr(Math.abs(total))}`}
        </Text>
        <Text style={styles.summaryK}>
          {items.length} partner shop{items.length === 1 ? '' : 's'} ·{' '}
          {total > 0 ? 'they owe you overall' : total < 0 ? 'you owe them overall' : 'all settled'}
        </Text>
      </View>

      <View style={styles.addCard} testID="shops-card">
        <Text style={styles.addTitle}>Our shops</Text>
        {shops.map((s) => (
          <View key={s.id} testID={`shop-row-${s.id}`} style={styles.shopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shopName}>
                {s.isPrimary ? '★ ' : ''}
                {s.name}
              </Text>
              <Text style={styles.shopSub}>{s.isPrimary ? 'master · stock is booked here' : s.code}</Text>
            </View>
            {isAdminish && !s.isPrimary ? (
              <TouchableOpacity testID={`set-master-${s.id}`} style={styles.masterBtn} onPress={() => onSetMaster(s)}>
                <Text style={styles.masterBtnText}>set as master</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      {/* partner_shops INSERT is manager-gated by RLS — don't show cashiers a form that always errors */}
      {isAdminish ? (
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Add partner shop</Text>
        <TextInput
          testID="partner-name-input"
          style={styles.input}
          placeholder="Shop name"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />
        <View style={styles.addRow}>
          <TextInput
            testID="partner-phone-input"
            style={[styles.input, { flex: 1 }]}
            placeholder="Phone (optional)"
            placeholderTextColor={colors.placeholder}
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity testID="partner-add-submit" style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
      ) : (
        <FlatList
          testID="partners-list"
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View testID={`partner-row-${item.id}`} style={styles.row}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.sub}>
                    {item.outCount} of ours with them · {item.inCount} of theirs with us
                    {item.phone ? ` · ${item.phone}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.bal, item.net > 0 ? styles.balOwed : item.net < 0 ? styles.balDue : styles.balOk]}>
                    {item.net === 0 ? 'Rs 0' : formatPkr(Math.abs(item.net))}
                  </Text>
                  <Text style={styles.balLbl}>
                    {item.net > 0 ? 'they owe us' : item.net < 0 ? 'we owe them' : 'settled'}
                  </Text>
                </View>
              </View>
              {isAdminish && item.payable > 0 ? (
                payingId === item.id ? (
                  <View style={styles.payRow}>
                    <TextInput
                      testID={`pay-amount-${item.id}`}
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      keyboardType="numeric"
                      placeholder={`up to ${formatPkr(item.payable)}`}
                      placeholderTextColor={colors.placeholder}
                      value={payAmount}
                      onChangeText={setPayAmount}
                    />
                    <TouchableOpacity testID={`pay-submit-${item.id}`} style={styles.addBtn} onPress={() => onPayPartner(item)}>
                      <Text style={styles.addBtnText}>Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setPayingId(null)}>
                      <Text style={styles.payCancel}>cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    testID={`pay-toggle-${item.id}`}
                    style={styles.payToggle}
                    onPress={() => {
                      setPayingId(item.id);
                      setPayAmount(String(item.payable));
                    }}
                  >
                    <Text style={styles.payToggleText}>Record payment to {item.name} →</Text>
                  </TouchableOpacity>
                )
              ) : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No partner shops yet.</Text>}
        />
      )}

      {/* cashiers land on the Outs stack and never see the Variants home — this
          is their only way out of a shared shop device's session */}
      <TouchableOpacity
        testID="signout-button"
        style={styles.signOutRow}
        onPress={async () => {
          if (await confirmAsync('Sign out', 'Sign out of this device?')) signOut();
        }}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summary: { backgroundColor: colors.amber.bg, borderWidth: 1, borderColor: colors.amber.border, padding: 16, borderRadius: 14 },
  summaryN: { fontSize: 24, fontWeight: '800', color: colors.amber.text },
  summaryK: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  addCard: { backgroundColor: colors.card, marginTop: 12, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  shopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  shopName: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  shopSub: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  masterBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  masterBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  addTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 9 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14.5, color: colors.text, backgroundColor: colors.card, marginBottom: 8 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  addBtnText: { color: colors.card, fontWeight: '700' },
  error: { color: colors.red.text, marginBottom: 10, fontSize: 13, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 16 },
  row: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 9 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  payRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  payToggle: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9 },
  payToggleText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  payCancel: { color: colors.textMuted, fontWeight: '600', fontSize: 12.5, paddingHorizontal: 4 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.slate.text, marginTop: 2 },
  bal: { fontSize: 15, fontWeight: '800' },
  balOwed: { color: colors.green.text },
  balDue: { color: colors.red.text },
  balOk: { color: colors.textMuted },
  balLbl: { fontSize: 10.5, color: colors.textMuted, marginTop: 1 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 30 },
  signOutRow: { alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  signOutText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
});
