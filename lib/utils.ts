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

/** Calculate activity score based on ferrata parameters */
export function calculateScore(
  difficulty: string,
  lengthMeters: number,
  heightDiffMeters: string | undefined,
  duration: string | undefined,
): number {
  if (!difficulty) return 0;

  const diff = getDiffWeight(difficulty);
  const len = lengthMeters || 0;
  const height = parseHeight(heightDiffMeters);
  const durMin = parseDurationMinutes(duration);

  // Base: difficulty weight * 10
  let score = diff * 10;

  // Length bonus: +1 per 50m (0.02 per meter)
  score += len * 0.02;

  // Height bonus: +1 per 20m
  score += height * 0.05;

  // Duration bonus: +1 per 10 min
  score += durMin * 0.1;

  return Math.round(score);
}

function parseHeight(h: string | undefined): number {
  if (!h) return 0;
  const m = h.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseDurationMinutes(d: string | undefined): number {
  if (!d) return 0;
  const num = parseInt(d, 10) || 0;
  if (d.includes('min')) return num;
  if (d.includes('sata') || d.includes('h')) return num * 60;
  return num;
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
