import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';

export default function AccessDeniedScreen() {
  const { accessReason, signOut, session } = useAuth();
  const email = session?.user?.email ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>No admin access</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
        <Text style={styles.reason}>
          {accessReason ?? "Your account doesn't have access to the admin variants."}
        </Text>
        <TouchableOpacity testID="access-signout" style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  reason: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 22 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 32,
    marginTop: 22,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
