import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, Ascent, whereClause, orderByClause } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/ActivityCard';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [ascents, setAscents] = useState<(Ascent & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCollection<Ascent>('ascents', [
        whereClause('userId', '==', user.uid),
        orderByClause('createdAt', 'desc'),
      ]);
      setAscents(data);
    } catch (e) {
      console.error('Failed to load ascents:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Moje aktivnosti</Text>
        <Text style={styles.subtitle}>
          {ascents.length > 0
            ? `${ascents.length} zabilježen${ascents.length === 1 ? 'a' : 'ih'} tura`
            : 'Zabilježi svoju prvu ferata turu'}
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.orange} />
        </View>
      ) : ascents.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="lightning-bolt-circle" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Još nema aktivnosti</Text>
          <Text style={styles.emptySub}>
            Zabilježi svoju prvu ferata turu i prati napredak.
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/activity/add' as any)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>Dodaj aktivnost</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ascents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityCard ascent={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.orange} />
          }
          ListFooterComponent={() => (
            <TouchableOpacity
              style={styles.addFooterBtn}
              onPress={() => router.push('/(tabs)/activity/add' as any)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={18} color={Colors.orange} />
              <Text style={styles.addFooterText}>Dodaj novu aktivnost</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB for adding */}
      {ascents.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
          onPress={() => router.push('/(tabs)/activity/add' as any)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
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
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  addFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.orange,
    borderRadius: Radius.md,
    borderStyle: 'dashed',
  },
  addFooterText: { color: Colors.orange, fontSize: FontSize.md, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
