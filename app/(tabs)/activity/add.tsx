import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Timestamp } from 'firebase/firestore';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, addDocument, ViaFerrata, Ascent, orderByClause } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { haversineKm, calculateScore } from '@/lib/utils';

export default function AddActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [ferrate, setFerate] = useState<(ViaFerrata & { id: string })[]>([]);
  const [selectedFerrataId, setSelectedFerrataId] = useState('');
  const [selectedFerrataName, setSelectedFerrataName] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFerrate, setLoadingFerrate] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCollection<ViaFerrata>('via_ferrata', [
          orderByClause('name'),
        ]);
        setFerate(data);
      } catch (e) {
        console.error('Failed to load ferrate:', e);
      } finally {
        setLoadingFerrate(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedFerrataId) {
      Alert.alert('Greška', 'Odaberi feratu.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Greška', 'Unesi datum.');
      return;
    }
    if (!duration.trim()) {
      Alert.alert('Greška', 'Unesi vrijeme trajanja.');
      return;
    }

    setLoading(true);
    try {
      // GPS check — must be within 500m of ferrata
      const ferrata = ferrate.find(f => f.id === selectedFerrataId);
      if (ferrata?.latitude && ferrata?.longitude) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const dist = haversineKm(loc.coords.latitude, loc.coords.longitude, ferrata.latitude, ferrata.longitude);
          if (dist > 0.5) {
            Alert.alert('Predaleko', `Udaljen si ${dist.toFixed(1)} km od ferate. Moraš biti unutar 500 m.`);
            setLoading(false);
            return;
          }
        }
      }

      const score = ferrata ? calculateScore(ferrata.difficulty, ferrata.length, ferrata.heightDiff, ferrata.duration) : 0;

      const ascentData: Omit<Ascent, 'id'> = {
        userId: user!.uid,
        ferrataId: selectedFerrataId,
        ferrataName: selectedFerrataName,
        date: date.trim(),
        duration: duration.trim(),
        difficultyRating: difficultyRating || undefined,
        notes: notes.trim() || undefined,
        photos: [],
        createdAt: Timestamp.now(),
      } as any;

      // Add score to the data (we'll patch the type)
      (ascentData as any).score = score;

      await addDocument('ascents', ascentData);
      router.back();
    } catch (e) {
      console.error('Failed to save ascent:', e);
      Alert.alert('Greška', 'Nije moguće spremiti aktivnost. Pokušaj ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + Spacing.md }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova aktivnost</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Ferrata picker */}
      <Text style={styles.label}>Via ferata staza</Text>
      {loadingFerrate ? (
        <ActivityIndicator size="small" color={Colors.orange} />
      ) : (
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowPicker(!showPicker)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pickerText, !selectedFerrataId && styles.pickerPlaceholder]}>
            {selectedFerrataName || 'Odaberi feratu...'}
          </Text>
          <MaterialCommunityIcons
            name={showPicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      )}

      {showPicker && (
        <View style={styles.pickerList}>
          <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
            {ferrate.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.pickerItem,
                  selectedFerrataId === f.id && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setSelectedFerrataId(f.id);
                  setSelectedFerrataName(f.name);
                  setShowPicker(false);
                }}
              >
                <View style={styles.pickerItemLeft}>
                  <Text style={styles.pickerItemDiff}>{f.difficulty}</Text>
                </View>
                <View style={styles.pickerItemBody}>
                  <Text style={styles.pickerItemName}>{f.name}</Text>
                  <Text style={styles.pickerItemLocation}>{f.location}</Text>
                </View>
                {selectedFerrataId === f.id && (
                  <MaterialCommunityIcons name="check" size={20} color={Colors.orange} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Date */}
      <View style={styles.field}>
        <Text style={styles.label}>Datum</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="DD.MM.GGGG."
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={11}
        />
      </View>

      {/* Duration */}
      <View style={styles.field}>
        <Text style={styles.label}>Trajanje</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="npr. 90 min, 2 h"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      {/* Difficulty rating */}
      <View style={styles.field}>
        <Text style={styles.label}>Ocjena težine (1–5)</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setDifficultyRating(star === difficultyRating ? 0 : star)}>
              <MaterialCommunityIcons
                name={star <= difficultyRating ? 'star' : 'star-outline'}
                size={36}
                color={star <= difficultyRating ? '#FFD700' : Colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.field}>
        <Text style={styles.label}>Bilješke</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Utisci, vrijeme, uslovi na stazi..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.submitBtnText}>Spremi aktivnost</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: { gap: 6 },
  input: {
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  pickerText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  pickerPlaceholder: {
    color: Colors.textMuted,
  },
  pickerList: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    maxHeight: 300,
    overflow: 'hidden',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  pickerItemSelected: {
    backgroundColor: Colors.orangeMuted,
  },
  pickerItemLeft: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemDiff: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.orange,
  },
  pickerItemBody: { flex: 1 },
  pickerItemName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  pickerItemLocation: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
