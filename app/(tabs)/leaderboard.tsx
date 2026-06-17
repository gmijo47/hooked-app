import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Ascent } from '@/lib/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  initials: string;
  totalScore: number;
  ascentCount: number;
  rank: number;
}

type TimeFilter = 'all' | 'week' | 'month';

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'Sve vrijeme' },
  { key: 'month', label: 'Ovog mjeseca' },
  { key: 'week', label: 'Ovog tjedna' },
];

// ─── Cache ───────────────────────────────────────────────────────────────────

let cachedEntries: LeaderboardEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

function getTimeThreshold(filter: TimeFilter): Timestamp | null {
  if (filter === 'all') return null;
  const now = new Date();
  if (filter === 'week') {
    now.setDate(now.getDate() - 7);
    return Timestamp.fromDate(now);
  }
  // month
  now.setMonth(now.getMonth() - 1);
  return Timestamp.fromDate(now);
}

function formatDate(ts: Timestamp): Date {
  return ts.toDate();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [ownEntry, setOwnEntry] = useState<LeaderboardEntry | null>(null);

  const load = useCallback(async (force = false) => {
    // Check cache
    if (!force && cachedEntries && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      applyFilter(cachedEntries, filter);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Fetch all ascents with score
      const ascentsSnap = await getDocs(
        query(collection(db, 'ascents'), orderBy('score', 'desc'))
      );

      // Aggregate by user
      const userMap = new Map<string, { totalScore: number; ascentCount: number }>();
      const allAscents: (Ascent & { id: string })[] = [];

      ascentsSnap.forEach((doc) => {
        const data = doc.data() as Ascent;
        allAscents.push({ ...data, id: doc.id });

        const uid = data.userId;
        if (!uid) return;
        const existing = userMap.get(uid) || { totalScore: 0, ascentCount: 0 };
        existing.totalScore += data.score || 0;
        existing.ascentCount += 1;
        userMap.set(uid, existing);
      });

      // Get user display names
      const usersSnap = await getDocs(collection(db, 'users'));
      const userNames = new Map<string, { firstName?: string; lastName?: string }>();
      usersSnap.forEach((doc) => {
        const data = doc.data();
        userNames.set(doc.id, {
          firstName: data.firstName,
          lastName: data.lastName,
        });
      });

      // Build entries
      const allEntries: LeaderboardEntry[] = [];
      userMap.forEach((stats, uid) => {
        const nameData = userNames.get(uid);
        const displayName = nameData
          ? `${nameData.firstName || ''} ${nameData.lastName || ''}`.trim() || 'Anoniman'
          : 'Anoniman';
        allEntries.push({
          userId: uid,
          displayName,
          initials: getInitials(nameData?.firstName, nameData?.lastName),
          totalScore: stats.totalScore,
          ascentCount: stats.ascentCount,
          rank: 0, // will be set after sort
        });
      });

      // Sort by total score desc
      allEntries.sort((a, b) => b.totalScore - a.totalScore);

      // Assign ranks
      allEntries.forEach((entry, idx) => {
        entry.rank = idx + 1;
      });

      // Cache
      cachedEntries = allEntries;
      cacheTimestamp = Date.now();

      applyFilter(allEntries, filter);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const applyFilter = (allEntries: LeaderboardEntry[], currentFilter: TimeFilter) => {
    const threshold = getTimeThreshold(currentFilter);

    if (!threshold) {
      setEntries(allEntries);
      // Find own entry
      const own = allEntries.find((e) => e.userId === user?.uid) || null;
      setOwnEntry(own);
      return;
    }

    // For time-based filters, we need to re-aggregate with time constraint
    // This is a simplified version — in production, use a Cloud Function
    // For now, just show all entries (time filtering requires re-fetching)
    setEntries(allEntries);
    const own = allEntries.find((e) => e.userId === user?.uid) || null;
    setOwnEntry(own);
  };

  useEffect(() => {
    setLoading(true);
    load(true);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: 'trophy', color: '#FFD700', bg: 'rgba(255,215,0,0.15)' };
    if (rank === 2) return { icon: 'trophy', color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)' };
    if (rank === 3) return { icon: 'trophy', color: '#CD7F32', bg: 'rgba(205,127,50,0.15)' };
    return null;
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isMe = item.userId === user?.uid;
    const badge = getRankBadge(item.rank);

    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        {/* Rank */}
        <View style={styles.rankCol}>
          {badge ? (
            <View style={[styles.medalWrap, { backgroundColor: badge.bg }]}>
              <MaterialCommunityIcons name={badge.icon as any} size={18} color={badge.color} />
            </View>
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={[styles.avatar, isMe && styles.avatarMe]}>
          <Text style={[styles.avatarText, isMe && styles.avatarTextMe]}>
            {item.initials}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={[styles.nameText, isMe && styles.nameTextMe]} numberOfLines={1}>
            {isMe ? 'Ti' : item.displayName}
          </Text>
          <Text style={styles.ascentCount}>
            {item.ascentCount} ferat{item.ascentCount !== 1 ? 'a' : 'e'}
          </Text>
        </View>

        {/* Score */}
        <View style={styles.scoreCol}>
          <Text style={[styles.scoreValue, isMe && styles.scoreValueMe]}>
            {item.totalScore}
          </Text>
          <Text style={styles.scoreLabel}>bodova</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top 50 penjača</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.orange} />
          <Text style={styles.loadingText}>Učitavanje ljestvice...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="trophy-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Još nema rezultata</Text>
          <Text style={styles.emptySub}>Budi prvi/a! Zabilježi svoju prvu feratu.</Text>
        </View>
      ) : (
        <FlatList
          data={entries.slice(0, 50)}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.orange}
            />
          }
          // Own entry pinned at bottom
          ListFooterComponent={
            ownEntry && ownEntry.rank > 50 ? (
              <View style={styles.ownSection}>
                <View style={styles.ownDivider} />
                <Text style={styles.ownLabel}>Tvoj plasman</Text>
                {renderItem({ item: ownEntry })}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowMe: {
    borderColor: Colors.orange,
    backgroundColor: 'rgba(255,107,26,0.08)',
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  medalWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  avatarTextMe: {
    color: Colors.orange,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  nameTextMe: {
    color: Colors.orange,
  },
  ascentCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  scoreCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  scoreValueMe: {
    color: Colors.orange,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  separator: {
    height: Spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ownSection: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  ownDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginBottom: Spacing.sm,
  },
  ownLabel: {
    fontSize: FontSize.xs,
    color: Colors.orange,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
});
