import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import type { Ascent } from '@/lib/firestore';

type Props = {
  ascent: Ascent & { id: string };
  onPress?: () => void;
};

export default function ActivityCard({ ascent, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={Colors.orange} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.ferrataName} numberOfLines={1}>
            {ascent.ferrataName || 'Nepoznata staza'}
          </Text>
          {ascent.score != null && (
            <View style={styles.scoreBadge}>
              <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
              <Text style={styles.scoreText}>{ascent.score}</Text>
            </View>
          )}
          {ascent.completionType === 'gps' && (
            <MaterialCommunityIcons name="crosshairs-gps" size={14} color={Colors.success} />
          )}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{ascent.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{ascent.duration}</Text>
          </View>
        </View>

        {ascent.difficultyRating != null && ascent.difficultyRating > 0 && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name={star <= ascent.difficultyRating! ? 'star' : 'star-outline'}
                size={14}
                color={star <= ascent.difficultyRating! ? '#FFD700' : Colors.textMuted}
              />
            ))}
          </View>
        )}

        {ascent.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {ascent.notes}
          </Text>
        ) : null}
      </View>

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
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  left: { alignItems: 'center', gap: 4 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ferrataName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.orangeMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  scoreText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.orange,
  },
  meta: { flexDirection: 'row', gap: Spacing.md },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  notes: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  arrow: { marginLeft: 'auto' },
});
