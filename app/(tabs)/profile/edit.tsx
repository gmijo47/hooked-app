import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type OptionGroup = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const OPTION_GROUPS: OptionGroup[] = [
  {
    key: 'experience',
    label: 'Iskustvo',
    options: [
      { value: 'never', label: 'Nikad nisam bio/la' },
      { value: '1-5',   label: '1 – 5 ferata' },
      { value: '5-20',  label: '5 – 20 ferata' },
      { value: '20+',   label: '20+ ferata' },
    ],
  },
  {
    key: 'terrain',
    label: 'Omiljeni teren',
    options: [
      { value: 'rock',     label: 'Stijene & klisure' },
      { value: 'mountain', label: 'Visoke planine' },
      { value: 'mixed',    label: 'Kombinirani teren' },
      { value: 'unknown',  label: 'Nije definirano' },
    ],
  },
  {
    key: 'equipment',
    label: 'Oprema',
    options: [
      { value: 'full',    label: 'Kompletna oprema' },
      { value: 'partial', label: 'Djelimična oprema' },
      { value: 'none',    label: 'Bez opreme' },
    ],
  },
  {
    key: 'companionship',
    label: 'Stil ture',
    options: [
      { value: 'solo',   label: 'Sam/Sama' },
      { value: 'friend', label: 'S prijateljem/icom' },
      { value: 'group',  label: 'Organizirana grupa' },
    ],
  },
];

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? '');
  const [selections, setSelections] = useState<Record<string, string>>({
    experience:    profile?.experience    ?? '',
    terrain:       profile?.terrain       ?? '',
    equipment:     profile?.equipment     ?? '',
    companionship: profile?.companionship ?? '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (value: string) =>
    setSelections((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Greška', 'Ime i prezime su obavezni.');
      return;
    }
    if (dateOfBirth && !/^\d{2}\.\d{2}\.\d{4}$/.test(dateOfBirth)) {
      Alert.alert('Greška', 'Format datuma mora biti DD.MM.GGGG');
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user!.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        ...selections,
      }, { merge: true });
      await refreshProfile();
      router.back();
    } catch {
      Alert.alert('Greška', 'Nije moguće sačuvati promjene. Pokušaj ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Basic info */}
      <Text style={styles.sectionTitle}>Osnovni podaci</Text>

      <View style={styles.row}>
        <View style={[styles.field, styles.flex]}>
          <Text style={styles.label}>Ime</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.field, styles.flex]}>
          <Text style={styles.label}>Prezime</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Datum rodjenja</Text>
        <TextInput
          style={styles.input}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="DD.MM.GGGG"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      {/* Option groups */}
      {OPTION_GROUPS.map((group) => (
        <View key={group.key}>
          <Text style={styles.sectionTitle}>{group.label}</Text>
          <View style={styles.optionRow}>
            {group.options.map((opt) => {
              const selected = selections[group.key] === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => set(group.key)(opt.value)}
                  activeOpacity={0.8}
                >
                  {selected && (
                    <MaterialCommunityIcons name="check" size={14} color={Colors.orange} />
                  )}
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.saveBtnText}>Sačuvaj promjene</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  flex: { flex: 1 },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
  },
  row: { flexDirection: 'row', gap: Spacing.md },
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
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  chipSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },
  chipTextSelected: { color: Colors.orange, fontWeight: '700' },
  saveBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
