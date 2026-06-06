import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, Ascent, Favorite, whereClause, orderByClause } from '@/lib/firestore';

const EXPERIENCE_LABELS: Record<string, string> = {
  never:  'Početnik/ca',
  '1-5':  '1 – 5 ferata',
  '5-20': '5 – 20 ferata',
  '20+':  'Veteran/ka 20+',
};

const TERRAIN_LABELS: Record<string, string> = {
  rock:     'Stijene & klisure',
  mountain: 'Visoke planine',
  mixed:    'Kombinirani teren',
  unknown:  'Nije definirano',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  full:    'Kompletna oprema',
  partial: 'Djelimična oprema',
  none:    'Bez opreme',
};

const COMPANIONSHIP_LABELS: Record<string, string> = {
  solo:   'Sam/Sama',
  friend: 'S prijateljem/icom',
  group:  'Organizirana grupa',
};

type InfoRowProps = { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string };

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={Colors.orange} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ascentCount, setAscentCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [totalLength, setTotalLength] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [ascents, favs] = await Promise.all([
          getCollection<Ascent>('ascents', [
            whereClause('userId', '==', user.uid),
          ]),
          getCollection<Favorite>('favorites', [
            whereClause('userId', '==', user.uid),
          ]),
        ]);
        setAscentCount(ascents.length);
        setFavCount(favs.length);
        // Estimate total elevation from ascents (just count for now)
        setTotalLength(ascents.length);
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [user]);

  const initials = (
    `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`
  ).toUpperCase() || '?';

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Jesi li siguran/a da se želiš odjaviti?')) logout();
      return;
    }
    Alert.alert(
      'Odjava',
      'Jesi li siguran/a da se želiš odjaviti?',
      [
        { text: 'Odustani', style: 'cancel' },
        { text: 'Odjavi se', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.md }]}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.fullName}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Experience badge */}
        <View style={styles.expBadge}>
          <MaterialCommunityIcons name="carabiner" size={14} color={Colors.orange} />
          <Text style={styles.expBadgeText}>
            {EXPERIENCE_LABELS[profile?.experience ?? ''] ?? 'Nedefinirano'}
          </Text>
        </View>
      </View>

      {/* Stats card — moved to top */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tvoja statistika</Text>
        {statsLoading ? (
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>Učitavanje...</Text>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={Colors.orange} />
              <Text style={styles.statNumber}>{ascentCount}</Text>
              <Text style={styles.statLabel}>Uspona</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="heart" size={24} color="#FF4444" />
              <Text style={styles.statNumber}>{favCount}</Text>
              <Text style={styles.statLabel}>Favorita</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statNumber}>{totalLength}</Text>
              <Text style={styles.statLabel}>Zabilježenih</Text>
            </View>
          </View>
        )}
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Osobni podaci</Text>
        <InfoRow icon="account-outline"    label="Ime i prezime"   value={`${profile?.firstName} ${profile?.lastName}`} />
        <InfoRow icon="cake-variant-outline" label="Datum rodjenja" value={profile?.dateOfBirth ?? '—'} />
        <InfoRow icon="email-outline"      label="Email"           value={user?.email ?? '—'} />
      </View>

      {/* Via Ferrata card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Via Ferrata profil</Text>
        <InfoRow icon="chart-line"             label="Iskustvo"      value={EXPERIENCE_LABELS[profile?.experience ?? ''] ?? '—'} />
        <InfoRow icon="terrain"                label="Teren"         value={TERRAIN_LABELS[profile?.terrain ?? ''] ?? '—'} />
        <InfoRow icon="shield-check-outline"   label="Oprema"        value={EQUIPMENT_LABELS[profile?.equipment ?? ''] ?? '—'} />
        <InfoRow icon="account-group-outline"  label="Stil ture"     value={COMPANIONSHIP_LABELS[profile?.companionship ?? ''] ?? '—'} />
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push('/(tabs)/profile/edit')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.white} />
        <Text style={styles.editBtnText}>Uredi profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
        <Text style={styles.logoutBtnText}>Odjavi se</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.orangeMuted,
    borderWidth: 3,
    borderColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.orange },
  fullName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orangeMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.orange,
  },
  expBadgeText: { color: Colors.orange, fontSize: FontSize.sm, fontWeight: '700' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600', marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.cardBorder,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 15,
    marginTop: Spacing.sm,
  },
  editBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: 15,
  },
  logoutBtnText: { color: Colors.error, fontSize: FontSize.md, fontWeight: '700' },
});
