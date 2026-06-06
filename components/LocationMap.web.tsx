import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';

type Props = {
  latitude: number;
  longitude: number;
  name: string;
};

export default function LocationMap({ latitude, longitude, name }: Props) {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <TouchableOpacity
      style={styles.fallback}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name="map" size={32} color={Colors.orange} />
      <Text style={styles.title}>Prikaži lokaciju</Text>
      <Text style={styles.coords}>
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
      <View style={styles.openBtn}>
        <MaterialCommunityIcons name="google-maps" size={16} color={Colors.orange} />
        <Text style={styles.openText}>Otvori u Google Maps</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  coords: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  openText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.orange,
  },
});
