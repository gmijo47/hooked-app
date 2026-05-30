import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type LogoSize = 'sm' | 'md' | 'lg';

interface Props {
  size?: LogoSize;
  showTagline?: boolean;
}

export default function HookedLogo({ size = 'md', showTagline = false }: Props) {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.4 : 1;

  return (
    <View style={styles.wrapper}>
      {/* Icon mark – stylised carabiner */}
      <View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        <View style={styles.ring}>
          <View style={styles.ringInner} />
          <View style={styles.gate} />
        </View>
        <View style={styles.nose} />
      </View>

      {/* Wordmark */}
      <View style={{ transform: [{ scale }] }}>
        <Text style={styles.wordmark}>
          <Text style={styles.wordmarkAccent}>H</Text>OOKED
        </Text>
        {showTagline && (
          <Text style={styles.tagline}>Via Ferrata Companion</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 8,
    borderColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg,
  },
  gate: {
    position: 'absolute',
    right: -5,
    top: 12,
    width: 10,
    height: 20,
    backgroundColor: Colors.bg,
    borderRadius: 2,
  },
  nose: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.orange,
    borderWidth: 3,
    borderColor: Colors.bg,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    color: Colors.text,
    textAlign: 'center',
  },
  wordmarkAccent: {
    color: Colors.orange,
  },
  tagline: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
