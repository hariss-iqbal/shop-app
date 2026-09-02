import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';
import { config } from '../config';

export default function LoginScreen() {
  const { signInWithPassword, signInWithGoogle, devBypass, devBypassEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<null | 'password' | 'google' | 'dev'>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'password' | 'google' | 'dev', fn: () => Promise<void>) => {
    setError(null);
    setBusy(kind);
    try {
      await fn();
    } catch (e: any) {
      // Auth errors sometimes carry an empty/JSON message ("{}") — never show that raw
      const msg = typeof e?.message === 'string' ? e.message.trim() : '';
      setError(
        msg && msg !== '{}' && !msg.startsWith('{"')
          ? msg
          : 'Could not sign in. Check your email and password, then try again.'
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.logo}>SmartCell</Text>
          <Text style={styles.subtitle}>Stock · transfers · sales</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="email-input"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            testID="password-input"
            style={styles.input}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text testID="login-error" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            testID="signin-button"
            style={[styles.button, busy ? styles.buttonDisabled : null]}
            disabled={!!busy}
            onPress={() => run('password', () => signInWithPassword(email.trim(), password))}
          >
            {busy === 'password' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            testID="google-button"
            style={[styles.googleButton, busy ? styles.buttonDisabled : null]}
            disabled={!!busy}
            onPress={() => run('google', signInWithGoogle)}
          >
            {busy === 'google' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <View style={styles.googleContent}>
                <Image
                  source={require('../../assets/google-logo.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                <Text style={styles.googleText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {devBypassEnabled ? (
            <TouchableOpacity
              testID="dev-bypass-button"
              style={styles.devButton}
              disabled={!!busy}
              onPress={() => run('dev', devBypass)}
            >
              {busy === 'dev' ? (
                <ActivityIndicator color={colors.warning} />
              ) : (
                <Text style={styles.devText}>Dev bypass · sign in as admin</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        <Text testID="version-stamp" style={styles.versionStamp}>
          v{config.version} · {config.buildTag} · {config.isProd ? 'PROD' : 'local'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  versionStamp: { textAlign: 'center', color: colors.textMuted, fontSize: 11, marginTop: 20, opacity: 0.8 },
  googleContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleLogo: { width: 20, height: 20, marginRight: 10 },
  brand: { alignItems: 'center', marginBottom: 28 },
  logo: { fontSize: 34, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
  },
  error: { color: colors.danger, marginTop: 12, fontSize: 14 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 13 },
  googleButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  googleText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  devButton: {
    marginTop: 18,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.warning,
    backgroundColor: '#fffbeb',
  },
  devText: { color: colors.warning, fontWeight: '600', fontSize: 13 },
});
