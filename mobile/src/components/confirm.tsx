import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

type ConfirmRequest = { title: string; message: string; resolve: (ok: boolean) => void };

let present: ((req: ConfirmRequest) => void) | null = null;

/**
 * App-themed replacement for Alert-based confirms. Native Alert follows the OS
 * theme, so on a dark-mode phone it rendered a dark dialog over our light app.
 * Web keeps window.confirm (the e2e harness auto-accepts browser dialogs).
 */
export function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web')
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true);
  return new Promise((resolve) => {
    if (present) present({ title, message, resolve });
    else resolve(false);
  });
}

/** Mount once near the app root so confirmAsync has a host to render into. */
export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    present = setReq;
    return () => {
      present = null;
    };
  }, []);

  const answer = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };

  return (
    <Modal visible={!!req} transparent animationType="fade" onRequestClose={() => answer(false)}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} testID="confirm-dialog">
          <Text style={styles.title}>{req?.title}</Text>
          <Text style={styles.message}>{req?.message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity testID="confirm-cancel" style={styles.btn} onPress={() => answer(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="confirm-ok" style={[styles.btn, styles.okBtn]} onPress={() => answer(true)}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  dialog: { backgroundColor: colors.card, borderRadius: 14, padding: 20, width: '100%', maxWidth: 400, elevation: 6, shadowColor: colors.text, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  title: { fontSize: 16.5, fontWeight: '800', color: colors.text },
  message: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 8 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  okBtn: { backgroundColor: colors.primary },
  cancelText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  okText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
