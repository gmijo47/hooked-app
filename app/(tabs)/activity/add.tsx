import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, addDocument, ViaFerrata, Ascent, orderByClause } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  calculateScoreFromTrack,
  parseExpectedDurationMinutes,
} from '@/lib/utils';
import {
  startTracking, stopTracking, cancelTracking,
  pauseTracking, resumeTracking, subscribeToTracker,
  getElapsedMinutes,
  type TrackerStatus,
} from '@/lib/gps-tracker';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDistKm(km: number | null): string {
  if (km === null) return '—';
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(2)} km`;
}

export default function AddActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Ferrata list
  const [ferrate, setFerate] = useState<(ViaFerrata & { id: string })[]>([]);
  const [selectedFerrataId, setSelectedFerrataId] = useState('');
  const [selectedFerrataName, setSelectedFerrataName] = useState('');
  const [loadingFerrate, setLoadingFerrate] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // GPS Track state
  const [trackStatus, setTrackStatus] = useState<TrackerStatus>({
    state: 'idle', points: [], startTime: null, elapsedMs: 0,
    currentLat: null, currentLon: null, currentAlt: null,
    distanceFromStartKm: null, distanceFromEndKm: null,
    signalLost: false, signalLostSince: null,
  });
  const [trackError, setTrackError] = useState<string | null>(null);

  // Subscribe to tracker updates
  useEffect(() => {
    const unsub = subscribeToTracker(setTrackStatus);
    return unsub;
  }, []);

  // Load ferrate
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

  // Selected ferrata object
  const selectedFerrata = ferrate.find(f => f.id === selectedFerrataId);

  // Can we GPS track this ferrata?
  const hasCoords = !!(
    selectedFerrata?.startLat != null && selectedFerrata?.startLon != null &&
    selectedFerrata?.endLat != null && selectedFerrata?.endLon != null
  );

  // ─── GPS Track handlers ─────────────────────────────────────────────────

  const handleStartTrack = async () => {
    if (!selectedFerrata) return;
    setTrackError(null);

    const err = await startTracking(
      selectedFerrata.startLat!, selectedFerrata.startLon!,
      selectedFerrata.endLat!, selectedFerrata.endLon!,
    );

    if (err) {
      setTrackError(err);
      Alert.alert('GPS Track', err);
    }
  };

  const handleStopTrack = async () => {
    const { points, error } = await stopTracking();
    if (error) {
      Alert.alert('GPS Track', error);
      return;
    }

    // Auto-save with GPS data
    await saveAscent(points, getElapsedMinutes());
  };

  const handlePauseTrack = () => {
    if (trackStatus.state === 'active') {
      pauseTracking();
    } else if (trackStatus.state === 'paused') {
      resumeTracking();
    }
  };

  const handleCancelTrack = () => {
    Alert.alert(
      'Odustani od snimanja',
      'Snimljene GPS točke će biti izgubljene. Jesi li siguran/a?',
      [
        { text: 'Ne', style: 'cancel' },
        {
          text: 'Da, odustani',
          style: 'destructive',
          onPress: async () => {
            await cancelTracking();
            setTrackError(null);
          },
        },
      ],
    );
  };

  // ─── Save ascent (GPS track only) ──────────────────────────────────────

  const saveAscent = async (trackPoints: typeof trackStatus.points, gpsElapsedMin: number) => {
    if (!selectedFerrataId) {
      Alert.alert('Greška', 'Odaberi feratu.');
      return;
    }

    setLoading(true);
    try {
      const ferrata = selectedFerrata!;
      const now = new Date();
      const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}.`;

      const expectedMin = parseExpectedDurationMinutes(ferrata.duration);
      const score = calculateScoreFromTrack(
        ferrata.difficulty,
        trackPoints,
        gpsElapsedMin,
        expectedMin,
      );

      // Build ascent data without undefined fields
      const ascentData: Record<string, unknown> = {
        userId: user!.uid,
        ferrataId: selectedFerrataId,
        ferrataName: selectedFerrataName,
        date: dateStr,
        duration: gpsElapsedMin >= 60
          ? `${Math.floor(gpsElapsedMin / 60)} h ${gpsElapsedMin % 60} min`
          : `${gpsElapsedMin} min`,
        photos: [],
        score,
        completionType: 'gps',
        elapsedTimeMin: gpsElapsedMin,
        track: trackPoints,
        createdAt: Timestamp.now(),
      };

      await addDocument('ascents', ascentData);
      router.back();
    } catch (e) {
      console.error('Failed to save ascent:', e);
      Alert.alert('Greška', 'Nije moguće spremiti aktivnost. Pokušaj ponovo.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  const isTracking = trackStatus.state === 'active' || trackStatus.state === 'paused';
  const isPaused = trackStatus.state === 'paused';

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
        <Text style={styles.headerTitle}>Snimi feratu</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ─── GPS Track Card ─────────────────────────────────────────────── */}
      {hasCoords && (
        <View style={[styles.trackCard, isTracking && styles.trackCardActive]}>
          <View style={styles.trackHeader}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={20}
              color={isTracking ? Colors.orange : Colors.textSecondary}
            />
            <Text style={[styles.trackTitle, isTracking && styles.trackTitleActive]}>
              GPS Snimanje rute
            </Text>
            {isTracking && (
              <View style={[styles.liveDot, isPaused && styles.liveDotPaused]} />
            )}
          </View>

          {!isTracking ? (
            <>
              <Text style={styles.trackHint}>
                Pokreni GPS snimanje prije polaska. Track će automatski spremiti tvoj uspon sa preciznim bodovanjem.
              </Text>
              <TouchableOpacity
                style={styles.trackStartBtn}
                onPress={handleStartTrack}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="play-circle" size={22} color={Colors.white} />
                <Text style={styles.trackStartBtnText}>Pokreni Track</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Track stats */}
              <View style={styles.trackStatsRow}>
                <View style={styles.trackStat}>
                  <Text style={styles.trackStatValue}>{formatTime(trackStatus.elapsedMs)}</Text>
                  <Text style={styles.trackStatLabel}>Vrijeme</Text>
                </View>
                <View style={styles.trackStatDivider} />
                <View style={styles.trackStat}>
                  <Text style={styles.trackStatValue}>{trackStatus.points.length}</Text>
                  <Text style={styles.trackStatLabel}>Točaka</Text>
                </View>
                <View style={styles.trackStatDivider} />
                <View style={styles.trackStat}>
                  <Text style={styles.trackStatValue}>
                    {formatDistKm(trackStatus.distanceFromEndKm)}
                  </Text>
                  <Text style={styles.trackStatLabel}>Do kraja</Text>
                </View>
              </View>

              {/* GPS signal warning */}
              {trackStatus.signalLost && (
                <View style={styles.signalLostBanner}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color="#FFD700" />
                  <Text style={styles.signalLostText}>
                    GPS signal izgubljen. Track pauziran.
                  </Text>
                </View>
              )}

              {/* Track controls */}
              <View style={styles.trackControls}>
                <TouchableOpacity
                  style={[styles.trackCtrlBtn, styles.trackPauseBtn]}
                  onPress={handlePauseTrack}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={isPaused ? 'play' : 'pause'}
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.trackCtrlBtnText}>
                    {isPaused ? 'Nastavi' : 'Pauziraj'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.trackCtrlBtn, styles.trackStopBtn]}
                  onPress={handleStopTrack}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="stop-circle" size={20} color={Colors.white} />
                  <Text style={styles.trackCtrlBtnText}>Završi Track</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.trackCancelLink}
                onPress={handleCancelTrack}
              >
                <Text style={styles.trackCancelText}>Odustani od snimanja</Text>
              </TouchableOpacity>
            </>
          )}

          {trackError && !isTracking && (
            <Text style={styles.trackError}>{trackError}</Text>
          )}
        </View>
      )}

      {!hasCoords && selectedFerrataId !== '' && (
        <View style={styles.noCoordsBanner}>
          <MaterialCommunityIcons name="map-marker-off" size={20} color={Colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noCoordsTitle}>GPS track nije dostupan</Text>
            <Text style={styles.noCoordsText}>
              Ova ferata nema definisane GPS koordinate. Odaberi feratu sa{' '}
              <Text style={{ color: Colors.success, fontWeight: '700' }}>GPS</Text> ikonicom za snimanje rute.
            </Text>
          </View>
        </View>
      )}

      {/* ─── Ferrata picker ──────────────────────────────────────────────── */}
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
                {f.startLat != null && (
                  <MaterialCommunityIcons name="crosshairs-gps" size={14} color={Colors.success} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  // ─── Track card ────────────────────────────────────────────────────────
  trackCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  trackCardActive: {
    borderColor: Colors.orange,
    borderWidth: 2,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    flex: 1,
  },
  trackTitleActive: {
    color: Colors.orange,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
  },
  liveDotPaused: {
    backgroundColor: '#FFD700',
  },
  trackHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  trackStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 14,
  },
  trackStartBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  trackStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  trackStat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  trackStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.cardBorder,
  },
  trackStatValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  trackStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signalLostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  signalLostText: {
    fontSize: FontSize.xs,
    color: '#FFD700',
    fontWeight: '600',
  },
  trackControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  trackCtrlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  trackPauseBtn: {
    backgroundColor: '#B8860B',
  },
  trackStopBtn: {
    backgroundColor: '#CC3333',
  },
  trackCtrlBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  trackCancelLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  trackCancelText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  trackError: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },

  // ─── No coords banner ──────────────────────────────────────────────────
  noCoordsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    padding: Spacing.md,
  },
  noCoordsTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 2,
  },
  noCoordsText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },

  // ─── Picker ────────────────────────────────────────────────────────────
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
  scorePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.orangeMuted,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.orange,
    padding: Spacing.md,
  },
  scorePreviewText: {
    fontSize: FontSize.sm,
    color: Colors.orange,
    fontWeight: '600',
    flex: 1,
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

