import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Step = {
  key: string;
  question: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  options: { value: string; label: string; emoji: string }[];
};

const STEPS: Step[] = [
  {
    key: 'experience',
    question: 'Koliko si via ferata odradio/la?',
    icon: 'chart-line',
    options: [
      { value: 'never',  label: 'Nikad nisam bio/la', emoji: '🌱' },
      { value: '1-5',    label: '1 – 5 ferata',       emoji: '🧗' },
      { value: '5-20',   label: '5 – 20 ferata',      emoji: '⛰️' },
      { value: '20+',    label: '20+ ferata',          emoji: '🏔️' },
    ],
  },
  {
    key: 'terrain',
    question: 'Kakav teren ti najviše odgovara?',
    icon: 'terrain',
    options: [
      { value: 'rock',     label: 'Stijene & klisure', emoji: '🪨' },
      { value: 'mountain', label: 'Visoke planine',    emoji: '🏔️' },
      { value: 'mixed',    label: 'Kombinirani teren', emoji: '🌄' },
      { value: 'unknown',  label: 'Još ne znam',       emoji: '🤷' },
    ],
  },
  {
    key: 'equipment',
    question: 'Imaš li vlastitu opremu za feratu?',
    icon: 'shield-check-outline',
    options: [
      { value: 'full',    label: 'Imam kompletnu opremu', emoji: '✅' },
      { value: 'partial', label: 'Imam dijelimično',      emoji: '🔧' },
      { value: 'none',    label: 'Nemam opremu',          emoji: '❌' },
    ],
  },
  {
    key: 'companionship',
    question: 'Kako najčešće ideš na ferata?',
    icon: 'account-group-outline',
    options: [
      { value: 'solo',   label: 'Sam/Sama',             emoji: '🧍' },
      { value: 'friend', label: 'S prijateljem/icom',   emoji: '👥' },
      { value: 'group',  label: 'U organiziranoj grupi', emoji: '👨‍👩‍👧‍👦' },
    ],
  },
];

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];
  const progress = (step + 1) / STEPS.length;

  const selectOption = (value: string) => {
    setAnswers((a) => ({ ...a, [current.key]: value }));
  };

  const next = async () => {
    if (!answers[current.key]) return;

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Last step – save to Firestore
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user!.uid), {
        ...answers,
        onboardingComplete: true,
      }, { merge: true });
      await refreshProfile();
      // Root guard redirects to (tabs)
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Text style={styles.stepLabel}>
          {step + 1} / {STEPS.length}
        </Text>

        {/* Question */}
        <View style={styles.questionWrap}>
          <MaterialCommunityIcons
            name={current.icon}
            size={40}
            color={Colors.orange}
            style={styles.qIcon}
          />
          <Text style={styles.question}>{current.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {current.options.map((opt) => {
            const selected = answers[current.key] === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => selectOption(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {selected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={Colors.orange}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation */}
        <View style={styles.nav}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={back}>
              <Text style={styles.backBtnText}>← Nazad</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextBtn,
              !answers[current.key] && styles.nextBtnDisabled,
              step === 0 && styles.nextBtnFull,
            ]}
            onPress={next}
            disabled={!answers[current.key] || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : (
                <Text style={styles.nextBtnText}>
                  {step < STEPS.length - 1 ? 'Dalje →' : 'Završi 🎉'}
                </Text>
              )
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: Radius.full,
    marginVertical: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.orange,
    borderRadius: Radius.full,
  },
  stepLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: Spacing.xl,
  },
  questionWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  qIcon: { marginBottom: Spacing.xs },
  question: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  options: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  optionSelected: {
    borderColor: Colors.orange,
    backgroundColor: Colors.orangeMuted,
  },
  optionEmoji: { fontSize: 22 },
  optionLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  optionLabelSelected: {
    color: Colors.orange,
    fontWeight: '700',
  },
  nav: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextBtnFull: { flex: 1 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
