import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Timestamp } from 'firebase/firestore';
import { TrackPoint } from './firestore';
import { haversineKm } from './utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const LOCATION_TASK = 'GPS_TRACKER_BACKGROUND';
const RECORD_INTERVAL_MS = 5000; // 5 seconds
const GPS_LOSS_THRESHOLD_MS = 30_000; // 30s without signal → auto-pause
const PROXIMITY_THRESHOLD_KM = 1.2; // 1200m — za testiranje

// ─── State ───────────────────────────────────────────────────────────────────

export type TrackerState = 'idle' | 'active' | 'paused';

export interface TrackerStatus {
  state: TrackerState;
  points: TrackPoint[];
  startTime: number | null;
  elapsedMs: number; // total elapsed (excluding pauses)
  currentLat: number | null;
  currentLon: number | null;
  currentAlt: number | null;
  distanceFromStartKm: number | null;
  distanceFromEndKm: number | null;
  signalLost: boolean;
  signalLostSince: number | null;
}

let internalState: TrackerState = 'idle';
let points: TrackPoint[] = [];
let startTime: number | null = null;
let pauseStartTime: number | null = null;
let totalPausedMs = 0;
let currentLat: number | null = null;
let currentLon: number | null = null;
let currentAlt: number | null = null;
let lastSignalTime: number | null = null;
let signalLost = false;
let signalLostSince: number | null = null;

let targetStartLat: number | null = null;
let targetStartLon: number | null = null;
let targetEndLat: number | null = null;
let targetEndLon: number | null = null;

let locationSubscription: Location.LocationSubscription | null = null;
let listeners: Set<(status: TrackerStatus) => void> = new Set();

// ─── Public API ──────────────────────────────────────────────────────────────

export function getTrackerState(): TrackerState {
  return internalState;
}

export function subscribeToTracker(cb: (status: TrackerStatus) => void): () => void {
  listeners.add(cb);
  // Send current status immediately
  cb(buildStatus());
  return () => { listeners.delete(cb); };
}

function notifyListeners(): void {
  const status = buildStatus();
  listeners.forEach((cb) => cb(status));
}

function buildStatus(): TrackerStatus {
  let elapsedMs = 0;
  if (startTime) {
    const now = Date.now();
    if (internalState === 'active') {
      elapsedMs = now - startTime - totalPausedMs;
    } else if (internalState === 'paused') {
      elapsedMs = (pauseStartTime ?? now) - startTime - totalPausedMs;
    }
  }

  let distanceFromStartKm: number | null = null;
  let distanceFromEndKm: number | null = null;
  if (currentLat !== null && currentLon !== null) {
    if (targetStartLat !== null && targetStartLon !== null) {
      distanceFromStartKm = haversineKm(currentLat, currentLon, targetStartLat, targetStartLon);
    }
    if (targetEndLat !== null && targetEndLon !== null) {
      distanceFromEndKm = haversineKm(currentLat, currentLon, targetEndLat, targetEndLon);
    }
  }

  return {
    state: internalState,
    points: [...points],
    startTime,
    elapsedMs,
    currentLat,
    currentLon,
    currentAlt,
    distanceFromStartKm,
    distanceFromEndKm,
    signalLost,
    signalLostSince,
  };
}

/**
 * Start GPS tracking for a specific ferrata.
 * @param startLat Ferrata start latitude
 * @param startLon Ferrata start longitude
 * @param endLat Ferrata end latitude
 * @param endLon Ferrata end longitude
 * @returns Error message if can't start, null on success
 */
export async function startTracking(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): Promise<string | null> {
  if (internalState !== 'idle') return 'Tracker je već aktivan.';

  // Request permissions
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return 'GPS dozvola nije odobrena.';

  // Check proximity to start
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    const dist = haversineKm(
      loc.coords.latitude, loc.coords.longitude,
      startLat, startLon,
    );
    if (dist > PROXIMITY_THRESHOLD_KM) {
      return `Moraš biti bliže početku ferate (min. ${Math.round(PROXIMITY_THRESHOLD_KM * 1000)}m). Udaljen si ${(dist * 1000).toFixed(0)}m.`;
    }
  } catch {
    return 'Nije moguće dobiti GPS poziciju. Provjeri postavke.';
  }

  // Request background permissions
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  // Even if bg denied, we can still track in foreground

  // Store targets
  targetStartLat = startLat;
  targetStartLon = startLon;
  targetEndLat = endLat;
  targetEndLon = endLon;

  // Reset state
  points = [];
  startTime = Date.now();
  totalPausedMs = 0;
  pauseStartTime = null;
  signalLost = false;
  signalLostSince = null;
  lastSignalTime = Date.now();
  internalState = 'active';

  // Start foreground tracking
  await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 1, // 1 meter minimum change
      timeInterval: RECORD_INTERVAL_MS,
    },
    (location) => {
      onLocationUpdate(location);
    },
  ).then((sub) => {
    locationSubscription = sub;
  });

  // Try background tracking
  if (bgStatus === 'granted') {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10,
        timeInterval: RECORD_INTERVAL_MS,
        deferredUpdatesInterval: RECORD_INTERVAL_MS,
        foregroundService: {
          notificationTitle: 'Hooked — Snimanje rute',
          notificationBody: 'GPS track aktivan...',
          notificationColor: '#FF6B1A',
        },
      });
    } catch {
      console.warn('Background location updates not available');
    }
  }

  // Start signal loss monitor
  startSignalMonitor();

  notifyListeners();
  return null;
}

/**
 * Stop tracking and return recorded points.
 * Must be within 200m of target end point.
 */
export async function stopTracking(): Promise<{ points: TrackPoint[]; error: string | null }> {
  if (internalState !== 'active' && internalState !== 'paused') {
    return { points: [], error: 'Tracker nije aktivan.' };
  }

  // Check proximity to end
  if (targetEndLat !== null && targetEndLon !== null && currentLat !== null && currentLon !== null) {
    const dist = haversineKm(currentLat, currentLon, targetEndLat, targetEndLon);
    if (dist > PROXIMITY_THRESHOLD_KM) {
      return {
        points: [],
        error: `Moraš biti bliže kraju ferate (min. ${Math.round(PROXIMITY_THRESHOLD_KM * 1000)}m). Udaljen si ${(dist * 1000).toFixed(0)}m.`,
      };
    }
  }

  // Capture final point
  const finalPoints = [...points];

  // Clean up
  await cleanup();

  return { points: finalPoints, error: null };
}

/**
 * Force stop tracking without proximity checks (for "Odustani").
 */
export async function cancelTracking(): Promise<TrackPoint[]> {
  const finalPoints = [...points];
  await cleanup();
  return finalPoints;
}

export function pauseTracking(): void {
  if (internalState !== 'active') return;
  internalState = 'paused';
  pauseStartTime = Date.now();
  notifyListeners();
}

export function resumeTracking(): void {
  if (internalState !== 'paused') return;
  if (pauseStartTime) {
    totalPausedMs += Date.now() - pauseStartTime;
  }
  pauseStartTime = null;
  internalState = 'active';
  lastSignalTime = Date.now();
  signalLost = false;
  signalLostSince = null;
  notifyListeners();
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function onLocationUpdate(location: Location.LocationObject): void {
  const now = Date.now();
  lastSignalTime = now;
  signalLost = false;
  signalLostSince = null;

  currentLat = location.coords.latitude;
  currentLon = location.coords.longitude;
  currentAlt = location.coords.altitude ?? null;

  if (internalState === 'active') {
    const point: TrackPoint = {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
      alt: location.coords.altitude ?? null,
      ts: Timestamp.fromMillis(now),
    };
    points.push(point);
  }

  notifyListeners();
}

function startSignalMonitor(): void {
  const checkSignal = () => {
    if (internalState !== 'active' && internalState !== 'paused') return;

    const now = Date.now();
    if (lastSignalTime && (now - lastSignalTime) > GPS_LOSS_THRESHOLD_MS) {
      if (!signalLost) {
        signalLost = true;
        signalLostSince = lastSignalTime;
        if (internalState === 'active') {
          // Auto-pause on signal loss
          internalState = 'paused';
          pauseStartTime = lastSignalTime + GPS_LOSS_THRESHOLD_MS;
        }
        notifyListeners();
      }
    } else if (signalLost && lastSignalTime && (now - lastSignalTime) < 5000) {
      // Signal recovered, auto-resume if we were the ones who paused
      signalLost = false;
      signalLostSince = null;
      // Note: We don't auto-resume — user might have intentionally paused
      notifyListeners();
    }

    // Always continue monitoring while tracker is running
    setTimeout(checkSignal, 5000);
  };

  setTimeout(checkSignal, 5000);
}

async function cleanup(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  try {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch { /* may not be registered */ }

  internalState = 'idle';
  points = [];
  startTime = null;
  totalPausedMs = 0;
  pauseStartTime = null;
  currentLat = null;
  currentLon = null;
  currentAlt = null;
  lastSignalTime = null;
  signalLost = false;
  signalLostSince = null;
  targetStartLat = null;
  targetStartLon = null;
  targetEndLat = null;
  targetEndLon = null;

  notifyListeners();
}

/**
 * Get elapsed time in minutes (excluding pauses).
 */
export function getElapsedMinutes(): number {
  const status = buildStatus();
  return Math.round(status.elapsedMs / 60000);
}

// ─── GPX Export ──────────────────────────────────────────────────────────────

/**
 * Export track points to GPX format string.
 */
export function exportToGPX(
  trackPoints: TrackPoint[],
  ferrataName: string = 'Via Ferrata',
): string {
  if (trackPoints.length === 0) return '';

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Hooked App"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <trk>
    <name>${escapeXml(ferrataName)}</name>
    <trkseg>`;

  const points = trackPoints
    .map((p) => {
      const alt = p.alt !== null ? `    <ele>${p.alt}</ele>\n` : '';
      return `    <trkpt lat="${p.lat}" lon="${p.lon}">\n${alt}      <time>${p.ts.toDate().toISOString()}</time>\n    </trkpt>`;
    })
    .join('\n');

  const footer = `    </trkseg>
  </trk>
</gpx>`;

  return header + '\n' + points + '\n' + footer;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
