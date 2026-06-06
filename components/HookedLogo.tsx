import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type LogoSize = 'sm' | 'md' | 'lg';

interface Props {
  size?: LogoSize;
  showTagline?: boolean;
  iconOnly?: boolean;
}

const SIZES = {
  sm: { icon: 44, ring: 36, border: 5, inner: 26, gateW: 6, gateH: 12, gateTop: 7, noseSize: 8, noseBottom: 2, noseRight: 5, fontSize: 17, taglineSize: 7, gap: 6 },
  md: { icon: 72, ring: 60, border: 8, inner: 44, gateW: 10, gateH: 20, gateTop: 12, noseSize: 14, noseBottom: 4, noseRight: 8, fontSize: 28, taglineSize: 11, gap: 10 },
  lg: { icon: 100, ring: 84, border: 11, inner: 62, gateW: 14, gateH: 28, gateTop: 17, noseSize: 20, noseBottom: 6, noseRight: 11, fontSize: 39, taglineSize: 15, gap: 14 },
};

export default function HookedLogo({ size = 'md', showTagline = false, iconOnly = false }: Props) {
  const s = SIZES[size];

  return (
    <View style={[styles.wrapper, { gap: s.gap }]}>
      {/* Icon mark – stylised carabiner */}
      <View style={[styles.iconWrap, { width: s.icon, height: s.icon }]}>
        <View style={[
          styles.ring,
          {
            width: s.ring,
            height: s.ring,
            borderRadius: s.ring / 2,
            borderWidth: s.border,
          },
        ]}>
          <View style={[
            styles.ringInner,
            {
              width: s.inner,
              height: s.inner,
              borderRadius: s.inner / 2,
            },
          ]} />
          <View style={[
            styles.gate,
            {
              width: s.gateW,
              height: s.gateH,
              top: s.gateTop,
              right: -s.gateW / 2,
            },
          ]} />
        </View>
        <View style={[
          styles.nose,
          {
            width: s.noseSize,
            height: s.noseSize,
            borderRadius: s.noseSize / 2,
            bottom: s.noseBottom,
            right: s.noseRight,
            borderWidth: Math.max(1, s.border * 0.4),
          },
        ]} />
      </View>

      {/* Wordmark */}
      {!iconOnly && (
        <View>
          <Text style={[styles.wordmark, { fontSize: s.fontSize }]}>
            <Text style={styles.wordmarkAccent}>H</Text>OOKED
          </Text>
          {showTagline && (
            <Text style={[styles.tagline, { fontSize: s.taglineSize }]}>
              Via Ferrata Companion
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringInner: {
    backgroundColor: Colors.bg,
  },
  gate: {
    position: 'absolute',
    backgroundColor: Colors.bg,
    borderRadius: 2,
  },
  nose: {
    position: 'absolute',
    backgroundColor: Colors.orange,
    borderColor: Colors.bg,
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: 6,
    color: Colors.text,
    textAlign: 'center',
  },
  wordmarkAccent: {
    color: Colors.orange,
  },
  tagline: {
    color: Colors.textSecondary,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
