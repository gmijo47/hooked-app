import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  TouchableOpacity, TextInput, RefreshControl, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, orderByClause, ViaFerrata } from '@/lib/firestore';
import FerrataCard from '@/components/FerrataCard';
import HookedLogo from '@/components/HookedLogo';
import { haversineKm } from '@/lib/utils';


const DIFFICULTIES = ['A', 'A/B', 'B', 'B/C', 'C', 'C/D', 'D', 'E', 'E/F', 'F'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ferrate, setFerate] = useState<(ViaFerrata & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [maxLength, setMaxLength] = useState<number | null>(null);
  const [maxDuration, setMaxDuration] = useState<string | null>(null);
  const [nearby, setNearby] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const toggleNearby = async () => {
    if (nearby) { setNearby(false); setUserCoords(null); return; }
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('GPS nije dozvoljen', 'Dozvoli lokaciju u podesavanjima.'); setGpsLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      setNearby(true);
    } catch { Alert.alert('Greska', 'Nije moguce dobiti lokaciju.'); }
    setGpsLoading(false);
  };

  const load = useCallback(async (force = false) => {
    if (loaded && !force) return;
    try {
      const data = await getCollection<ViaFerrata>('via_ferrata', [
        orderByClause('name'),
      ]);
      setFerate(data);
      setLoaded(true);
    } catch (e) {
      console.error('Failed to load ferrate:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loaded]);

  useEffect(() => { load(); }, [load]);

  const isFiltering =
    search.trim() !== '' ||
    selectedDifficulties.length > 0 ||
    maxLength !== null ||
    maxDuration !== null;

  // Top 5 by rating
  const topRated = [...ferrate]
    .filter((f) => f.rating != null && f.rating > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const filtered = ferrate.filter((f) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!f.name.toLowerCase().includes(q) && !f.location.toLowerCase().includes(q)) return false;
    }
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(f.difficulty)) return false;
    if (maxLength !== null && f.length > maxLength) return false;
    if (maxDuration !== null) {
      const dur = parseDuration(f.duration);
      const maxDur = parseDuration(maxDuration);
      if (dur !== null && maxDur !== null && dur > maxDur) return false;
    }
    // Nearby filter — 10km radius
    if (nearby && userCoords && f.latitude && f.longitude) {
      const dist = haversineKm(userCoords.lat, userCoords.lon, f.latitude, f.longitude);
      if (dist > 10) return false;
    }
    return true;
  });

  const toggleDifficulty = (d: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoWrap}>
            <HookedLogo size="sm" iconOnly />
          </View>
          <Text style={styles.title}>Istraži ferate</Text>
        </View>
      </View>

      {/* Search + filter toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Pretraži feratu ili lokaciju..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showAdvanced && styles.filterBtnActive]}
          onPress={() => setShowAdvanced(!showAdvanced)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="tune-vertical"
            size={20}
            color={showAdvanced ? Colors.white : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Advanced filters toggle */}
      {showAdvanced && (
        <View style={styles.advancedWrap}>
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(false)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="filter-menu-outline" size={16} color={Colors.orange} />
            <Text style={styles.advancedToggleText}>Napredni filteri</Text>
            <MaterialCommunityIcons name="chevron-up" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.advancedBody}>
            {/* Difficulty filter */}
            <View style={styles.advancedRow}>
              <Text style={styles.advancedLabel}>Tezina</Text>
              <View style={styles.advancedInputRow}>
                {DIFFICULTIES.map((d) => {
                  const active = selectedDifficulties.includes(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.advancedChip, active && styles.advancedChipActive]}
                      onPress={() => toggleDifficulty(d)}
                    >
                      <Text style={[styles.advancedChipText, active && styles.advancedChipTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {selectedDifficulties.length > 0 && (
                  <TouchableOpacity
                    style={styles.advancedChipClear}
                    onPress={() => setSelectedDifficulties([])}
                  >
                    <Text style={styles.advancedChipClearText}>Obrisi</Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>

            {/* Length filter */}
            <View style={styles.advancedRow}>
              <Text style={styles.advancedLabel}>Max duzina (m)</Text>
              <View style={styles.advancedInputRow}>
                {[200, 500, 1000, 2000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.advancedChip, maxLength === val && styles.advancedChipActive]}
                    onPress={() => setMaxLength(maxLength === val ? null : val)}
                  >
                    <Text
                      style={[
                        styles.advancedChipText,
                        maxLength === val && styles.advancedChipTextActive,
                      ]}
                    >
                      do {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration filter */}
            <View style={styles.advancedRow}>
              <Text style={styles.advancedLabel}>Max vrijeme</Text>
              <View style={styles.advancedInputRow}>
                {['30 min', '60 min', '90 min', '2 h', '3 h'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.advancedChip, maxDuration === val && styles.advancedChipActive]}
                    onPress={() => setMaxDuration(maxDuration === val ? null : val)}
                  >
                    <Text
                      style={[
                        styles.advancedChipText,
                        maxDuration === val && styles.advancedChipTextActive,
                      ]}
                    >
                      do {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nearby locations */}
            <View style={styles.advancedRow}>
              <Text style={styles.advancedLabel}>Lokacija</Text>
              <TouchableOpacity
                style={[styles.nearbyBtn, nearby && styles.nearbyBtnActive]}
                onPress={toggleNearby}
                disabled={gpsLoading}
                activeOpacity={0.8}
              >
                {gpsLoading ? (
                  <ActivityIndicator size="small" color={Colors.orange} />
                ) : (
                  <MaterialCommunityIcons
                    name={nearby ? 'crosshairs-gps' : 'map-marker-radius-outline'}
                    size={18}
                    color={nearby ? Colors.white : Colors.orange}
                  />
                )}
                <Text style={[styles.nearbyBtnText, nearby && styles.nearbyBtnTextActive]}>
                  {nearby ? 'U blizini (10 km)' : 'Ferate u blizini'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>Ucitavanje ferata...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="telescope" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Nema rezultata</Text>
          <Text style={styles.emptySub}>
            {isFiltering
              ? 'Probaj sa drugim filterima ili pretragom.'
              : 'Jos nema ferata u bazi.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FerrataCard ferrata={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListHeaderComponent={
            !isFiltering && topRated.length > 0 ? (
              <View style={styles.topSection}>
                <Text style={styles.topTitle}>NAJBOLJE OCIJENJENE FERATE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topScroll}
                  decelerationRate="fast"
                  snapToInterval={280}
                  snapToAlignment="start"
                >
                  {topRated.map((f) => (
                    <View key={f.id} style={styles.topItem}>
                      <FerrataCard ferrata={f} compact />
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.otherHeader}>
                  <Text style={styles.otherTitle}>OSTALE FERATE</Text>
                </View>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.orange}
            />
          }
        />
      )}
    </View>
  );
}

function parseDuration(d: string): number | null {
  const m = d.match(/(\d+)\s*min/);
  if (m) return parseInt(m[1], 10);
  const h = d.match(/(\d+)\s*h/);
  if (h) return parseInt(h[1], 10) * 60;
  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },

  // Advanced filters
  advancedWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  advancedToggleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.orange,
    flex: 1,
  },
  advancedBody: {
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
  },
  advancedRow: {
    gap: Spacing.sm,
  },
  advancedLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  advancedInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  advancedChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.input,
  },
  advancedChipActive: {
    backgroundColor: Colors.orangeMuted,
    borderColor: Colors.orange,
  },
  advancedChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  advancedChipTextActive: {
    color: Colors.orange,
    fontWeight: '700',
  },
  nearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.orangeMuted,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.orange,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  nearbyBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.orange,
  },
  nearbyBtnActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  nearbyBtnTextActive: {
    color: Colors.white,
  },
  advancedChipClear: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.input,
  },
  advancedChipClearText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.error,
  },

  // Top section
  topSection: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  topTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  topScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  topItem: {
    width: 260,
  },
  otherHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  otherTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginTop: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
