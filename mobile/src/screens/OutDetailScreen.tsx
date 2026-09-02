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
import {
  getDeviceOuts,
  getProductHistory,
  settleDeviceOut,
  returnDeviceOut,
  cancelDeviceOut,
  requestReturn,
  claimDeviceOut,
  releaseDeviceOutClaim,
  updateDeviceOutPrice,
  DeviceOut,
  ProductHistoryEvent,
} from '../api/outs';
import { useAuth } from '../auth/AuthContext';
import { colors, formatPkr } from '../theme';
import { confirmAsync } from '../components/confirm';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'OutDetail'>;

const METHODS = ['cash', 'card', 'other'];

const EVENT_LABELS: Record<ProductHistoryEvent['type'], string> = {
  intake: 'Added to stock',
  out: 'OUT',
  consignment_in: 'Taken IN',
  settled: 'Settled',
  returned: 'Returned',
  cancelled: 'Cancelled',
  sold: 'Sold',
};

export default function OutDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const { id } = route.params;
  const { isAdminish, session } = useAuth();
  const myId = session?.user?.id ?? null;

  const [out, setOut] = useState<DeviceOut | null>(null);
  const [history, setHistory] = useState<ProductHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettle, setShowSettle] = useState(false);
  const [settledPrice, setSettledPrice] = useState('');
  const [received, setReceived] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [method, setMethod] = useState('cash');
  const [showReturn, setShowReturn] = useState(false);
  const [imeiConfirm, setImeiConfirm] = useState('');
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // the banner lives at the top — when a form deep in the page is blocked,
  // scroll it into view or the tap looks like it silently did nothing
  const showError = (msg: string) => {
    setError(msg);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // the money fields sit just above 'Confirm sale' — when they focus, the
  // keyboard hides the button; nudge the view so the confirm stays reachable
  const scrollConfirmIntoView = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const numStr = (v: number | null | undefined) => (v == null ? '' : String(v));

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getDeviceOuts({});
      const found = all.find((o) => o.id === id) ?? null;
      setOut(found);
      if (found) {
        setSettledPrice(numStr(found.settledPrice ?? found.outPrice));
        setReceived(numStr(found.settledPrice ?? found.outPrice));
        setNewPrice(numStr(found.outPrice));
        getProductHistory(found.productId).then(setHistory).catch(() => {});
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

  const isBranch = out?.destinationKind === 'branch';

  const onSettle = async () => {
    if (!out) return;
    const sp = Number(settledPrice.replace(/[, ]/g, ''));
    const rc = Number(received.replace(/[, ]/g, ''));
    if (!isFinite(sp) || sp < 0) return showError('Enter a valid sold price');
    if (!isFinite(rc) || rc < 0) return showError('Enter a valid amount received');
    if (sp > 5000000 || rc > 5000000) return showError('That price looks wrong. Check the amount.');
    if (isBranch && (!buyerName.trim() || !buyerPhone.trim()))
      return showError('Customer name and phone are required for a branch sale');
    // catch obvious typos — a phone number needs at least 10 digits
    if (isBranch && buyerPhone.replace(/\D/g, '').length < 10)
      return showError("That phone number looks too short. Enter the customer's full number (e.g. 0300-1234567).");
    setBusy(true);
    setError(null);
    try {
      const res = await settleDeviceOut({
        outId: out.id,
        settledPrice: sp,
        amountReceived: rc,
        paymentMethod: method,
        buyerName: buyerName.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
      });
      if (!res.success) return showError(res.error ?? 'Settle failed');
      setDone(`✓ Sold for ${formatPkr(sp)} · profit ${formatPkr(res.profit ?? 0)} booked`);
      setShowSettle(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Settle failed');
    } finally {
      setBusy(false);
    }
  };

  const onReturn = async (withImei: boolean) => {
    if (!out) return;
    if (withImei) {
      const conf = imeiConfirm.replace(/\s/g, '');
      if (conf.length < 5) return showError('Enter at least the last 5 digits of the IMEI');
    } else if (!(await confirmAsync('Return to stock', 'Mark this device returned and back in stock?'))) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await returnDeviceOut(out.id, withImei ? imeiConfirm : undefined);
      if (!res.success) return showError(res.error ?? 'Return failed');
      setDone('↩ Returned to stock');
      setShowReturn(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Return failed');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (!out) return;
    if (!(await confirmAsync('Cancel OUT', 'Cancel this OUT (created by mistake)?'))) return;
    setBusy(true);
    try {
      const res = await cancelDeviceOut(out.id);
      if (!res.success) return setError(res.error ?? 'Cancel failed');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  const onRequestReturn = async () => {
    if (!out) return;
    setBusy(true);
    setError(null);
    try {
      const res = await requestReturn(out.id);
      if (!res.success) return setError(res.error ?? 'Request failed');
      setDone('↩ Return requested. The holding shop will see it.');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const onClaim = async () => {
    if (!out) return;
    setBusy(true);
    setError(null);
    try {
      const res = await claimDeviceOut(out.id);
      if (!res.success) return setError(res.error ?? 'Claim failed');
      setDone('⏳ Claimed for 2 hours. Sell it or release it before the claim expires.');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Claim failed');
    } finally {
      setBusy(false);
    }
  };

  const onReleaseClaim = async () => {
    if (!out) return;
    setBusy(true);
    setError(null);
    try {
      const res = await releaseDeviceOutClaim(out.id);
      if (!res.success) return setError(res.error ?? 'Release failed');
      setDone('Claim released');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Release failed');
    } finally {
      setBusy(false);
    }
  };

  const onSavePrice = async () => {
    if (!out) return;
    const np = Number(newPrice.replace(/[, ]/g, ''));
    if (!isFinite(np) || np < 0) return setError('Enter a valid price');
    setBusy(true);
    setError(null);
    try {
      const res = await updateDeviceOutPrice(out.id, np);
      if (!res.success) return setError(res.error ?? 'Price update failed');
      setDone(`Price updated to ${formatPkr(np)}`);
      setShowPriceEdit(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Price update failed');
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
  if (!out)
    return (
      <View style={styles.center}>
        <Text testID="out-detail-error" style={{ color: colors.danger }}>
          {error ?? 'OUT not found'}
        </Text>
      </View>
    );

  const active = out.status === 'out';
  const claimActive = !!out.claimedUntil && new Date(out.claimedUntil) > new Date();
  const claimedByMe = claimActive && out.claimedBy === myId;
  const claimedByOther = claimActive && out.claimedBy !== myId;
  // "who has it?" matters in a small shop — show the holder's name, not "another user"
  const claimerName = out.claimedByEmail ? out.claimedByEmail.split('@')[0] : 'another user';
  // Verify the physical unit on branch returns when we know its IMEI;
  // devices without a recorded IMEI fall back to the plain confirm.
  const returnNeedsImei = isBranch && !!(out.imei || out.imei2);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID="out-detail"
    >
      <View style={styles.hero}>
        <Text style={styles.model}>
          {out.brand} {out.model}
          {out.storageGb ? ` · ${out.storageGb}GB` : ''}
        </Text>
        {out.color ? <Text style={styles.sub}>{out.color}</Text> : null}
        {out.imei ? <Text style={styles.sub}>IMEI {out.imei}</Text> : null}
        <View
          testID="out-status"
          style={[
            styles.statusPill,
            out.status === 'out' ? styles.pillAmber : out.status === 'sold' ? styles.pillGreen : styles.pillGrey,
          ]}
        >
          <Text style={styles.statusText}>
            {out.status === 'out'
              ? `OUT · ${out.daysOut} days`
              : out.status === 'sold'
              ? 'SOLD'
              : out.status.toUpperCase()}
          </Text>
        </View>
        {active && out.recallRequestedAt ? (
          <Text testID="recall-badge" style={styles.recallBadge}>
            ↩ Return requested {new Date(out.recallRequestedAt).toLocaleString()}
          </Text>
        ) : null}
        {claimActive ? (
          <Text testID="claim-badge" style={styles.claimBadge}>
            ⏳ {claimedByMe ? 'Claimed by you' : `Claimed by ${claimerName}`} until{' '}
            {new Date(out.claimedUntil!).toLocaleTimeString()}. After that anyone can sell it.
          </Text>
        ) : null}
      </View>

      {done ? (
        <Text testID="out-done" style={styles.doneBanner}>
          {done}
        </Text>
      ) : null}
      {error ? (
        <Text testID="out-detail-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Destination</Text>
        <Text style={styles.dest}>{out.destinationName ?? '—'}</Text>
        <Text style={styles.muted}>
          {out.destinationKind === 'partner' ? 'External partner' : 'Our branch'} · out from {out.fromLocation ?? '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Money</Text>
          {active && isAdminish && !showPriceEdit ? (
            <TouchableOpacity testID="price-edit-toggle" onPress={() => setShowPriceEdit(true)}>
              <Text style={styles.editLink}>edit price</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Row k={isBranch ? 'Transfer price' : 'OUT price'} v={formatPkr(out.outPrice)} />
        {out.settledPrice != null ? <Row k="Sold price" v={formatPkr(out.settledPrice)} /> : null}
        <Row k="Received" v={formatPkr(out.amountReceived)} />
        <Row k="Owed to us" v={formatPkr(out.outstanding)} danger={out.outstanding > 0} />
        {showPriceEdit ? (
          <View>
            <Text style={styles.fieldLabel}>New {isBranch ? 'transfer' : 'OUT'} price</Text>
            <TextInput
              testID="price-edit-input"
              style={styles.input}
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
            />
            <TouchableOpacity
              testID="price-edit-save"
              style={[styles.confirmBtn, busy ? styles.disabled : null]}
              onPress={onSavePrice}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Save price</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {active && claimedByOther ? (
        // the server rejects settle/return on a foreign-claimed unit — don't
        // render forms that invite a doomed submit; managers get the release key
        <>
          <Text style={styles.claimLock}>
            {claimerName} is selling this phone right now. Actions unlock when the claim expires or is
            released.{isAdminish ? ' You can release it below.' : ''}
          </Text>
          {isAdminish ? (
            <TouchableOpacity testID="release-claim-btn" style={styles.claimBtn} onPress={onReleaseClaim} disabled={busy}>
              <Text style={styles.claimText}>Release claim</Text>
            </TouchableOpacity>
          ) : null}
          {isAdminish ? (
            <TouchableOpacity testID="cancel-btn" style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelText}>Cancel OUT (mistake)</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : active ? (
        <>
          {!showSettle ? (
            <TouchableOpacity testID="settle-toggle" style={styles.settleBtn} onPress={() => setShowSettle(true)}>
              <Text style={styles.settleBtnText}>Mark sold &amp; record payment</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Record payment (sold)</Text>
              {isBranch ? (
                <>
                  <Text style={styles.fieldLabel}>Customer name *</Text>
                  <TextInput
                    testID="settle-buyer-name"
                    style={styles.input}
                    placeholder="Who bought it?"
                    placeholderTextColor={colors.placeholder}
                    value={buyerName}
                    onChangeText={setBuyerName}
                  />
                  <Text style={styles.fieldLabel}>Customer phone *</Text>
                  <TextInput
                    testID="settle-buyer-phone"
                    style={styles.input}
                    placeholder="03xx-xxxxxxx"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="phone-pad"
                    value={buyerPhone}
                    onChangeText={setBuyerPhone}
                  />
                </>
              ) : null}
              <Text style={styles.fieldLabel}>Sold price</Text>
              <TextInput
                testID="settle-price"
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 45000"
                placeholderTextColor={colors.placeholder}
                value={settledPrice}
                onChangeText={setSettledPrice}
                onFocus={scrollConfirmIntoView}
              />
              <Text style={styles.fieldLabel}>Amount received</Text>
              <TextInput
                testID="settle-received"
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 45000"
                placeholderTextColor={colors.placeholder}
                value={received}
                onChangeText={setReceived}
                onFocus={scrollConfirmIntoView}
              />
              <Text style={styles.fieldLabel}>Method</Text>
              <View style={styles.methodRow}>
                {METHODS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    testID={`settle-method-${m}`}
                    style={[styles.method, method === m ? styles.methodOn : null]}
                    onPress={() => setMethod(m)}
                  >
                    <Text style={[styles.methodText, method === m ? styles.methodTextOn : null]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                testID="settle-submit"
                style={[styles.confirmBtn, busy ? styles.disabled : null]}
                onPress={onSettle}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm sale</Text>}
              </TouchableOpacity>
            </View>
          )}

          {!claimActive ? (
            <TouchableOpacity testID="claim-btn" style={styles.claimBtn} onPress={onClaim} disabled={busy}>
              <Text style={styles.claimText}>⏳ Claim — customer here now</Text>
            </TouchableOpacity>
          ) : claimedByMe || isAdminish ? (
            <TouchableOpacity testID="release-claim-btn" style={styles.claimBtn} onPress={onReleaseClaim} disabled={busy}>
              <Text style={styles.claimText}>Release claim</Text>
            </TouchableOpacity>
          ) : null}

          {returnNeedsImei ? (
            !showReturn ? (
              <TouchableOpacity testID="return-btn" style={styles.returnBtn} onPress={() => setShowReturn(true)} disabled={busy}>
                <Text style={styles.returnText}>↩ Phone is back: return it to stock</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Confirm the unit</Text>
                <Text style={styles.fieldLabel}>Last 5+ digits of the IMEI on the box/phone</Text>
                <TextInput
                  testID="return-imei-input"
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 43809"
                  placeholderTextColor={colors.placeholder}
                  value={imeiConfirm}
                  onChangeText={setImeiConfirm}
                />
                <TouchableOpacity
                  testID="return-imei-submit"
                  style={[styles.confirmBtn, busy ? styles.disabled : null]}
                  onPress={() => onReturn(true)}
                  disabled={busy}
                >
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Verify &amp; return</Text>}
                </TouchableOpacity>
              </View>
            )
          ) : (
            <TouchableOpacity testID="return-btn" style={styles.returnBtn} onPress={() => onReturn(false)} disabled={busy}>
              <Text style={styles.returnText}>↩ Phone is back: return it to stock</Text>
            </TouchableOpacity>
          )}

          {isBranch && !out.recallRequestedAt ? (
            <TouchableOpacity testID="request-return-btn" style={styles.requestBtn} onPress={onRequestReturn} disabled={busy}>
              <Text style={styles.requestText}>Ask {out.destinationName ?? 'the branch'} to send it back</Text>
            </TouchableOpacity>
          ) : null}

          {isAdminish ? (
            <TouchableOpacity testID="cancel-btn" style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelText}>Cancel OUT (mistake)</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <Text style={styles.closedNote}>
          This OUT is {out.status}. No further actions.
        </Text>
      )}

      {history.length > 0 ? (
        <View style={styles.card} testID="history-card">
          <Text style={styles.cardTitle}>History — this phone</Text>
          {history.map((ev, i) => (
            <View key={i} style={styles.histRow}>
              <Text style={styles.histDot}>●</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.histTitle}>
                  {EVENT_LABELS[ev.type] ?? ev.type}
                  {ev.destination
                    ? ev.type === 'returned'
                      ? ` from ${ev.destination}` // it came BACK from there
                      : ` → ${ev.destination}`
                    : ev.location
                    ? ` @ ${ev.location}`
                    : ''}
                  {ev.price != null ? ` · ${formatPkr(ev.price)}` : ''}
                </Text>
                <Text style={styles.histMeta}>
                  {new Date(ev.at).toLocaleString()}
                  {ev.actor ? ` · ${ev.actor}` : ''}
                  {ev.buyer ? ` · buyer ${ev.buyer}${ev.buyerPhone ? ` (${ev.buyerPhone})` : ''}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
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
  hero: { backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  model: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 13.5, color: colors.textMuted, marginTop: 2 },
  statusPill: { marginTop: 12, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  pillAmber: { backgroundColor: colors.amber.bg },
  pillGreen: { backgroundColor: colors.green.bg },
  pillGrey: { backgroundColor: '#f1f5f9' },
  statusText: { fontWeight: '800', fontSize: 13, color: colors.text },
  recallBadge: { marginTop: 8, fontSize: 12, fontWeight: '700', color: colors.orange.text },
  claimBadge: { marginTop: 6, fontSize: 12, fontWeight: '700', color: colors.blue.text },
  doneBanner: { backgroundColor: colors.green.bg, color: colors.green.text, borderWidth: 1, borderColor: colors.green.border, borderRadius: 8, padding: 10, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  errorBanner: { backgroundColor: colors.red.bg, color: colors.red.text, padding: 10, borderRadius: 8, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 11.5, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  editLink: { color: colors.primary, fontWeight: '700', fontSize: 12.5, marginBottom: 10 },
  dest: { fontSize: 16, fontWeight: '800', color: colors.text },
  muted: { fontSize: 12.5, color: colors.textMuted, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowK: { fontSize: 13.5, color: colors.textMuted },
  rowV: { fontSize: 13.5, fontWeight: '800', color: colors.text },
  settleBtn: { backgroundColor: colors.success, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  settleBtnText: { color: colors.card, fontWeight: '800', fontSize: 15.5 },
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
  claimLock: { backgroundColor: colors.blue.bg, color: colors.blue.text, borderWidth: 1, borderColor: colors.blue.border, borderRadius: 8, padding: 10, fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
  claimBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.blue.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  claimText: { color: colors.blue.text, fontWeight: '700', fontSize: 14 },
  returnBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  returnText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  requestBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.orange.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  requestText: { color: colors.orange.text, fontWeight: '700', fontSize: 14 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  closedNote: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 10 },
  histRow: { flexDirection: 'row', gap: 8, paddingVertical: 6 },
  histDot: { color: colors.primary, fontSize: 10, marginTop: 3 },
  histTitle: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  histMeta: { fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
});
