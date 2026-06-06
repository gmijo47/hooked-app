import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, ViaFerrata, orderByClause } from '@/lib/firestore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ferrate, setFerrate] = useState<(ViaFerrata & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await getCollection<ViaFerrata>('via_ferrata', [orderByClause('name')]);
      setFerrate(data);
    } catch (e) { console.error('Home load:', e); }
    setLoading(false);
  };

  // Tri random ferrate za hero
  const heroFerrate = ferrate.filter(f => f.imageUrl).slice(0, 3);
  const topRated = [...ferrate].filter(f => f.rating && f.rating > 0).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4);
  // Mix ferrate for different sections
  const easy = ferrate.filter(f => f.difficulty === 'A' || f.difficulty === 'A/B' || f.difficulty === 'B').slice(0, 3);
  const hard = ferrate.filter(f => f.difficulty === 'D' || f.difficulty === 'E' || f.difficulty === 'E/F' || f.difficulty === 'F' || f.difficulty === 'C/D').slice(0, 3);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.md }]} showsVerticalScrollIndicator={false}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Via Ferrata BiH</Text>
          <Text style={styles.headerSub}>Otkrij najbolje ferate u Bosni i Hercegovini</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/map')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-outline" size={22} color={Colors.orange} />
        </TouchableOpacity>
      </View>

      {/* ─── Hero — random ferrate images ─── */}
      {!loading && heroFerrate.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heroScroll} contentContainerStyle={{ gap: Spacing.sm }}>
          {heroFerrate.map(f => (
            <TouchableOpacity key={f.id} style={styles.heroCard} onPress={() => router.push(`/(tabs)/explore/${f.id}`)} activeOpacity={0.9}>
              <Image source={{ uri: f.imageUrl }} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
              <View style={styles.heroOverlay}>
                <View style={[styles.heroDiff, { backgroundColor: getDiffColor(f.difficulty) }]}>
                  <Text style={styles.heroDiffText}>{f.difficulty}</Text>
                </View>
                <View>
                  <Text style={styles.heroName}>{f.name}</Text>
                  <View style={styles.heroLoc}>
                    <MaterialCommunityIcons name="map-marker" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroLocText}>{f.location}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── Quick links ─── */}
      <View style={styles.quickLinks}>
        {[
          { icon: 'compass' as const, label: 'Istrazuj', sub: 'Sve ferate', route: '/(tabs)/explore' },
          { icon: 'map' as const, label: 'Mapa', sub: 'Lokacije', route: '/(tabs)/map' },
          { icon: 'lightning-bolt' as const, label: 'Aktivnosti', sub: 'Tvoji usponi', route: '/(tabs)/activity' },
          { icon: 'account' as const, label: 'Profil', sub: 'Podesavanja', route: '/(tabs)/profile' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.quickLink} onPress={() => router.push(item.route as any)} activeOpacity={0.8}>
            <View style={styles.quickIcon}>
              <MaterialCommunityIcons name={item.icon} size={22} color={Colors.orange} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
            <Text style={styles.quickSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Najbolje ocijenjene ─── */}
      {topRated.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Najbolje ocijenjene</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.link}>Sve ferate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardList}>
            {topRated.map(f => (
              <TouchableOpacity key={f.id} style={styles.ferrataRow} onPress={() => router.push(`/(tabs)/explore/${f.id}`)} activeOpacity={0.8}>
                {f.imageUrl && <Image source={{ uri: f.imageUrl }} style={styles.ferrataThumb} contentFit="cover" cachePolicy="memory-disk" />}
                <View style={styles.ferrataInfo}>
                  <Text style={styles.ferrataName} numberOfLines={1}>{f.name}</Text>
                  <View style={styles.ferrataMeta}>
                    <View style={[styles.miniDiff, { backgroundColor: getDiffColor(f.difficulty) }]}>
                      <Text style={styles.miniDiffText}>{f.difficulty}</Text>
                    </View>
                    <Text style={styles.ferrataLen}>{f.length}m</Text>
                    {f.rating ? (
                      <View style={styles.miniStars}>
                        <MaterialCommunityIcons name="star" size={10} color="#FFD700" />
                        <Text style={styles.miniRating}>{f.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ─── Za pocetnike ─── */}
      {easy.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Za pocetnike</Text>
          <Text style={styles.sectionDesc}>Lagane ferate idealne za prve uspone</Text>
          <View style={styles.cardList}>
            {easy.map(f => (
              <TouchableOpacity key={f.id} style={styles.ferrataRow} onPress={() => router.push(`/(tabs)/explore/${f.id}`)} activeOpacity={0.8}>
                {f.imageUrl && <Image source={{ uri: f.imageUrl }} style={styles.ferrataThumb} contentFit="cover" cachePolicy="memory-disk" />}
                <View style={styles.ferrataInfo}>
                  <Text style={styles.ferrataName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.ferrataLoc} numberOfLines={1}>{f.location}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ─── Za iskusne ─── */}
      {hard.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Za iskusne</Text>
          <Text style={styles.sectionDesc}>Zahtjevne ferate za adrenaline ovisnike</Text>
          <View style={styles.cardList}>
            {hard.map(f => (
              <TouchableOpacity key={f.id} style={styles.ferrataRow} onPress={() => router.push(`/(tabs)/explore/${f.id}`)} activeOpacity={0.8}>
                {f.imageUrl && <Image source={{ uri: f.imageUrl }} style={styles.ferrataThumb} contentFit="cover" cachePolicy="memory-disk" />}
                <View style={styles.ferrataInfo}>
                  <Text style={styles.ferrataName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.ferrataLoc} numberOfLines={1}>{f.location}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ─── Sigurnost ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sigurnost na ferati</Text>
        <View style={styles.safetyCard}>
          {[
            { icon: 'shield-check' as const, color: '#4CAF50', text: 'Uvijek koristi via ferrata set sa amortizerom' },
            { icon: 'hard-hat' as const, color: Colors.orange, text: 'Kaciga je obavezna — kamenje pada' },
            { icon: 'weather-lightning' as const, color: '#FFC107', text: 'Provjeri prognozu — ne penji po grmljavini' },
            { icon: 'account-group' as const, color: '#2196F3', text: 'Ne idi sam/a — partner je sigurnost' },
            { icon: 'water' as const, color: '#00BCD4', text: 'Ponesi dovoljno vode — minimum 2L' },
          ].map((item, i) => (
            <View key={i} style={styles.safetyItem}>
              <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
              <Text style={styles.safetyText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── Vodic za tezine ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tezine ferata</Text>
        <View style={styles.diffGrid}>
          {[
            { d: 'A',   label: 'Lako',       desc: 'Setalica, sigurne staze', color: '#4CAF50' },
            { d: 'B/C', label: 'Srednje',    desc: 'Vertikalne dionice', color: '#FFC107' },
            { d: 'C/D', label: 'Tesko',      desc: 'Zahtjevno, eksponirano', color: '#FF5722' },
            { d: 'E/F', label: 'Ekstremno',  desc: 'Samo za profesionalce', color: '#880E4F' },
          ].map((item) => (
            <View key={item.d} style={[styles.diffCard, { borderLeftColor: item.color, borderLeftWidth: 3 }]}>
              <View style={[styles.diffBadge, { backgroundColor: item.color }]}>
                <Text style={styles.diffBadgeText}>{item.d}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.diffLabel}>{item.label}</Text>
                <Text style={styles.diffDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getDiffColor(d: string): string {
  const c: Record<string, string> = { 'A':'#4CAF50','A/B':'#66BB6A','B':'#8BC34A','B/C':'#FFC107','C':'#FF9800','C/D':'#FF5722','D':'#F44336','E':'#D32F2F','E/F':'#B71C1C','F':'#880E4F' };
  return c[d] ?? Colors.orange;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.lg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  headerBtn: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center',
  },

  // Hero slider
  heroScroll: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  heroCard: {
    width: 280, height: 200, borderRadius: Radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  heroDiff: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  heroDiffText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.white },
  heroName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.white, lineHeight: 20 },
  heroLoc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroLocText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },

  // Quick links
  quickLinks: { flexDirection: 'row', gap: Spacing.sm },
  quickLink: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  quickIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.orangeMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text },
  quickSub: { fontSize: 10, color: Colors.textMuted },

  // Section
  section: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  sectionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  link: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.orange },

  // Ferrata list row
  cardList: { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  ferrataRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  ferrataThumb: { width: 56, height: 56, borderRadius: Radius.md },
  ferrataInfo: { flex: 1, gap: 4 },
  ferrataName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  ferrataMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ferrataLoc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  ferrataLen: { fontSize: FontSize.xs, color: Colors.textSecondary },
  miniDiff: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  miniDiffText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  miniStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  miniRating: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

  // Safety
  safetyCard: {
    backgroundColor: '#1a0f00', borderRadius: Radius.xl, borderWidth: 1,
    borderColor: '#FF980033', padding: Spacing.lg, gap: Spacing.sm,
  },
  safetyItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  safetyText: { fontSize: FontSize.sm, color: Colors.text, flex: 1, lineHeight: 20 },

  // Difficulty guide
  diffGrid: { gap: Spacing.sm },
  diffCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md,
  },
  diffBadge: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  diffBadgeText: { fontSize: FontSize.md, fontWeight: '900', color: Colors.white },
  diffLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  diffDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
});


