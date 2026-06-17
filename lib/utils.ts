// ─── Haversine distance (km) ───────────────────────────────────────────────

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Activity scoring ────────────────────────────────────────────────────────

const DIFF_WEIGHT: Record<string, number> = {
  'A':   1,   'A/B': 2,
  'B':   3,   'B/C': 5,
  'C':   7,   'C/D': 10,
  'D':   13,  'E':   17,
  'E/F': 21,  'F':   25,
};

export function getDiffWeight(difficulty: string): number {
  return DIFF_WEIGHT[difficulty] ?? 5;
}

/**
 * Sprint 4 — Nova formula bodovanja:
 *   score = round(diffWeight * heightFactor / timeFactor * completionBonus)
 *
 *   diffWeight      = getDiffWeight(difficulty)
 *   heightFactor    = 1 + (heightDiffMeters / 100) * 0.5
 *   timeFactor      = 1 + (actualTimeMin / expectedTimeMin) * 0.3
 *   completionBonus = 1.0 (GPS track) | 0.5 (ručni unos)
 */
export function calculateScore(
  difficulty: string,
  heightDiffMeters: number,
  actualTimeMin: number,
  expectedTimeMin: number,
  completionType: 'gps' | 'manual' = 'manual',
): number {
  if (!difficulty) return 0;

  const diffWeight = getDiffWeight(difficulty);
  const heightFactor = 1 + (heightDiffMeters / 100) * 0.5;
  const safeActual = Math.max(1, actualTimeMin);
  const safeExpected = Math.max(1, expectedTimeMin);
  const timeFactor = 1 + (safeActual / safeExpected) * 0.3;
  const completionBonus = completionType === 'gps' ? 1.0 : 0.5;

  const raw = (diffWeight * heightFactor) / timeFactor * completionBonus;
  return Math.max(1, Math.round(raw));
}

/**
 * Calculate score from GPS track data.
 * Height is computed from alt diff between first and last point.
 * Elapsed time is computed from timestamp diff (minutes), excluding pauses.
 */
export function calculateScoreFromTrack(
  difficulty: string,
  trackPoints: { alt: number | null }[],
  elapsedTimeMin: number,
  expectedTimeMin: number,
): number {
  // Compute height from altitude readings
  let heightDiffMeters = 0;
  if (trackPoints.length >= 2) {
    const firstAlt = trackPoints[0].alt;
    const lastAlt = trackPoints[trackPoints.length - 1].alt;
    if (firstAlt !== null && firstAlt !== undefined && lastAlt !== null && lastAlt !== undefined) {
      heightDiffMeters = Math.abs(lastAlt - firstAlt);
    }
  }

  return calculateScore(difficulty, heightDiffMeters, elapsedTimeMin, expectedTimeMin, 'gps');
}

/**
 * Parse expected duration from ferrata duration string to minutes.
 * e.g. "2 h 30 min" → 150, "90 min" → 90, "3 h" → 180
 */
export function parseExpectedDurationMinutes(durationStr: string | undefined): number {
  if (!durationStr) return 120; // default 2h
  let total = 0;
  const hMatch = durationStr.match(/(\d+)\s*h/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  const minMatch = durationStr.match(/(\d+)\s*min/);
  if (minMatch) total += parseInt(minMatch[1], 10);
  if (total === 0) {
    // Try plain number
    const num = parseInt(durationStr, 10);
    if (!isNaN(num)) total = durationStr.includes('min') ? num : num * 60;
  }
  return total > 0 ? total : 120;
}

/**
 * Parse height diff from string like "350 m" → 350
 */
export function parseHeightDiffMeters(heightStr: string | undefined): number {
  if (!heightStr) return 0;
  const m = heightStr.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ─── Duration parser for filters ─────────────────────────────────────────────

export function parseDuration(d: string | null): number | null {
  if (!d) return null;
  const num = parseInt(d, 10);
  if (isNaN(num)) return null;
  if (d.includes('min')) return num;
  if (d.includes('h') || d.includes('sata')) return num * 60;
  return null;
}
