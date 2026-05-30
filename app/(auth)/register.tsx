import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import HookedLogo from '@/components/HookedLogo';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim())
      return 'Unesite ime i prezime.';
    if (!form.email.trim()) return 'Unesite email.';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(form.dateOfBirth))
      return 'Datum rodjenja mora biti u formatu DD.MM.GGGG';
    if (form.password.length < 6) return 'Lozinka mora imati min. 6 znakova.';
    if (form.password !== form.confirmPassword) return 'Lozinke se ne podudaraju.';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth, form.email.trim(), form.password,
      );
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth,
        experience: null,
        terrain: null,
        equipment: null,
        companionship: null,
        onboardingComplete: false,
        createdAt: serverTimestamp(),
      });
      // Root guard will redirect to onboarding
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'Email je već registrovan.',
        'auth/invalid-email': 'Nevažeći email format.',
        'auth/weak-password': 'Lozinka je preslaba.',
      };
      setError(msg[e.code] ?? 'Greška pri registraciji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <HookedLogo size="sm" />
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Kreiraj profil</Text>
          <Text style={styles.subtitle}>Registruj se i počni s avanturama</Text>

          {/* Ime i Prezime */}
          <View style={styles.row}>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Ime</Text>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={set('firstName')}
                placeholder="Ivan"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Prezime</Text>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={set('lastName')}
                placeholder="Horvat"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Datum rodjenja</Text>
            <TextInput
              style={styles.input}
              value={form.dateOfBirth}
              onChangeText={set('dateOfBirth')}
              placeholder="DD.MM.GGGG"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={set('email')}
              placeholder="tvoj@email.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lozinka</Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={set('password')}
              placeholder="min. 6 znakova"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Potvrdi lozinku</Text>
            <TextInput
              style={styles.input}
              value={form.confirmPassword}
              onChangeText={set('confirmPassword')}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Nastavi →</Text>
            }
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Imaš račun? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Prijavi se</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.bg,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  form: { gap: Spacing.md },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  field: { gap: Spacing.xs },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  error: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  footerLink: { color: Colors.orange, fontSize: FontSize.md, fontWeight: '700' },
});
