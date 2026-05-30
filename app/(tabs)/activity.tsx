import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '@/constants/colors';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MaterialCommunityIcons name="lightning-bolt-circle" size={72} color={Colors.orange} />
      <Text style={styles.title}>Moje aktivnosti</Text>
      <Text style={styles.sub}>
        Evidentiraj svoje ferata ture, bilježi napredak{'\n'}i dijeli s prijateljima. Dolazi uskoro!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  sub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
