import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import type { ViaFerrata } from '@/lib/firestore';

const DIFFICULTY_COLORS: Record<string, string> = {
  'A': '#4CAF50',
  'A/B': '#66BB6A',
  'B': '#8BC34A',
  'B/C': '#FFC107',
  'C': '#FF9800',
  'C/D': '#FF5722',
  'D': '#F44336',
  'E': '#D32F2F',
  'E/F': '#B71C1C',
  'F': '#880E4F',
};

type Props = {
  ferrata: ViaFerrata & { id: string };
  compact?: boolean;
};

export default function FerrataCard({ ferrata, compact }: Props) {
  const router = useRouter();
  const diffColor = DIFFICULTY_COLORS[ferrata.difficulty] ?? Colors.textMuted;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => router.push(`/(tabs)/explore/${ferrata.id}` as any)}
        activeOpacity={0.85}
      >
        {/* Image */}
        <Image
          source={{ uri: ferrata.imageUrl }}
          style={styles.compactImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={{ uri: ferrata.imageUrl?.replace(/\/[^/]+$/, '/thumb-') || '' }}
        />
        <View style={styles.compactOverlay}>
          <View style={[styles.compactDiff, { backgroundColor: diffColor }]}>
            <Text style={styles.compactDiffText}>{ferrata.difficulty}</Text>
          </View>
        </View>
        <View style={styles.compactBody}>
          <Text style={styles.compactName} numberOfLines={1}>{ferrata.name}</Text>
          <View style={styles.compactMeta}>
            <MaterialCommunityIcons name="map-marker-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.compactMetaText} numberOfLines={1}>{ferrata.location}</Text>
          </View>
          <View style={styles.compactStats}>
            <Text style={styles.compactStat}>{ferrata.length} m</Text>
            <Text style={styles.compactDot}>·</Text>
            <Text style={styles.compactStat}>{ferrata.duration}</Text>
            {ferrata.rating != null && ferrata.rating > 0 && (
              <>
                <Text style={styles.compactDot}>·</Text>
                <MaterialCommunityIcons name="star" size={11} color="#FFD700" />
                <Text style={styles.compactStat}>{ferrata.rating.toFixed(1)}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/explore/${ferrata.id}` as any)}
      activeOpacity={0.85}
    >
      {/* Image */}
      {ferrata.imageUrl ? (
        <Image
          source={{ uri: ferrata.imageUrl }}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: diffColor }]}>
          <Text style={styles.cardImagePlaceholderText}>{ferrata.difficulty}</Text>
        </View>
      )}

      {/* Difficulty badge on image */}
      <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
        <Text style={styles.diffText}>{ferrata.difficulty}</Text>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {ferrata.name}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{ferrata.location}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="tape-measure" size={14} color={Colors.orange} />
            <Text style={styles.statValue}>{ferrata.length} m</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.orange} />
            <Text style={styles.statValue}>{ferrata.duration}</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="signal-cellular-3" size={14} color={Colors.orange} />
            <Text style={styles.statValue}>{ferrata.difficulty}</Text>
          </View>
        </View>

        {/* Short description */}
        <Text style={styles.shortDesc} numberOfLines={2}>
          {ferrata.description}
        </Text>

        {/* Rating */}
        {ferrata.rating != null && ferrata.rating > 0 && (
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={13} color="#FFD700" />
            <Text style={styles.ratingText}>{ferrata.rating.toFixed(1)}</Text>
            {ferrata.reviewCount != null && (
              <Text style={styles.reviewCountText}>({ferrata.reviewCount})</Text>
            )}
          </View>
        )}
      </View>

      {/* Arrow */}
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} style={styles.arrow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    gap: 0,
  },
  cardImage: {
    width: 120,
  },
  cardImagePlaceholder: {
    width: 120,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.white,
  },
  diffBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.white,
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.sm,
    gap: 4,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: FontSize.xs,
    color: '#FFD700',
    fontWeight: '700',
  },
  reviewCountText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  shortDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  arrow: {
    alignSelf: 'center',
    marginRight: Spacing.sm,
  },

  // Compact variant (for slider)
  compactCard: {
    width: 260,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  compactOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  compactDiff: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDiffText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.white,
  },
  compactBody: {
    padding: Spacing.sm,
    gap: 3,
  },
  compactName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  compactStat: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  compactDot: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
