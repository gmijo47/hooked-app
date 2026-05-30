import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '@/constants/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MaterialCommunityIcons name="home-outline" size={72} color={Colors.orange} />
      <Text style={styles.title}>Početna</Text>
      <Text style={styles.sub}>
        Dashboard s pregledom tvojih aktivnosti,{'\n'}statistikama i preporukama. Dolazi uskoro!
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


