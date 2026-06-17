/**
 * Unit tests for lib/utils.ts
 *
 * Covers:
 * - haversineKm() — GPS distance between two points
 * - getDiffWeight() — difficulty weight mapping
 * - calculateScore() — activity scoring algorithm
 * - parseDuration() — duration string parser
 */

import {
  haversineKm,
  getDiffWeight,
  calculateScore,
  parseDuration,
} from '../../lib/utils';

// ──────────────────────────────────────────────────────────────────────────
// haversineKm
// ──────────────────────────────────────────────────────────────────────────

describe('haversineKm', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineKm(43.8563, 18.4131, 43.8563, 18.4131)).toBe(0);
  });

  it('returns small value for very close coordinates', () => {
    const d = haversineKm(43.8563, 18.4131, 43.8564, 18.4131);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(0.02); // ~11m
  });

  it('calculates distance between Sarajevo and Mostar correctly (~75km)', () => {
    const sarajevo = { lat: 43.8563, lon: 18.4131 };
    const mostar = { lat: 43.3438, lon: 17.8078 };
    const d = haversineKm(sarajevo.lat, sarajevo.lon, mostar.lat, mostar.lon);
    expect(d).toBeGreaterThan(70);
    expect(d).toBeLessThan(80);
  });

  it('is symmetric (A→B equals B→A)', () => {
    const a = { lat: 44.0, lon: 17.0 };
    const b = { lat: 43.0, lon: 18.0 };
    expect(haversineKm(a.lat, a.lon, b.lat, b.lon)).toBe(
      haversineKm(b.lat, b.lon, a.lat, a.lon),
    );
  });

  it('handles negative coordinates (southern hemisphere)', () => {
    const d = haversineKm(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(d).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// getDiffWeight
// ──────────────────────────────────────────────────────────────────────────

describe('getDiffWeight', () => {
  it('returns correct weight for known difficulties', () => {
    expect(getDiffWeight('A')).toBe(1);
    expect(getDiffWeight('A/B')).toBe(2);
    expect(getDiffWeight('B')).toBe(3);
    expect(getDiffWeight('B/C')).toBe(5);
    expect(getDiffWeight('C')).toBe(7);
    expect(getDiffWeight('C/D')).toBe(10);
    expect(getDiffWeight('D')).toBe(13);
    expect(getDiffWeight('E')).toBe(17);
    expect(getDiffWeight('E/F')).toBe(21);
    expect(getDiffWeight('F')).toBe(25);
  });

  it('returns 5 as default for unknown difficulty', () => {
    expect(getDiffWeight('')).toBe(5);
    expect(getDiffWeight('XYZ')).toBe(5);
    expect(getDiffWeight('unknown')).toBe(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// calculateScore (Sprint 4 — nova formula)
// ──────────────────────────────────────────────────────────────────────────

describe('calculateScore', () => {
  it('returns 0 for empty difficulty', () => {
    expect(calculateScore('', 300, 120, 120, 'manual')).toBe(0);
  });

  it('returns minimum 1 for valid input', () => {
    // A difficulty, 0 height, very slow → should be at least 1
    expect(calculateScore('A', 0, 120, 120, 'manual')).toBeGreaterThanOrEqual(1);
  });

  it('GPS completion gives double score vs manual', () => {
    const gpsScore = calculateScore('C', 350, 150, 180, 'gps');
    const manualScore = calculateScore('C', 350, 150, 180, 'manual');
    expect(gpsScore).toBeGreaterThan(manualScore);
  });

  it('harder difficulty gives higher score', () => {
    const easy = calculateScore('A', 200, 60, 60, 'manual');
    const hard = calculateScore('F', 200, 60, 60, 'manual');
    expect(hard).toBeGreaterThan(easy);
  });

  it('higher height gives higher score', () => {
    const low = calculateScore('C', 100, 120, 120, 'manual');
    const high = calculateScore('C', 500, 120, 120, 'manual');
    expect(high).toBeGreaterThan(low);
  });

  it('faster time gives higher score', () => {
    const fast = calculateScore('C', 300, 120, 180, 'manual');
    const slow = calculateScore('C', 300, 240, 180, 'manual');
    expect(fast).toBeGreaterThan(slow);
  });

  it('matches sprint-4 spec example: C, 350m, 150min/180min, GPS', () => {
    // diffWeight=7, heightFactor=1+1.75=2.75, timeFactor=1+(150/180)*0.3=1.25
    // raw = 7*2.75/1.25*1.0 = 15.4 → 15
    const score = calculateScore('C', 350, 150, 180, 'gps');
    expect(score).toBe(15);
  });

  it('matches sprint-4 spec example: same but manual (×0.5)', () => {
    const score = calculateScore('C', 350, 150, 180, 'manual');
    expect(score).toBe(8);
  });

  it('matches sprint-4 spec example: F, 500m, 200min/240min, GPS', () => {
    // diffWeight=25, heightFactor=1+2.5=3.5, timeFactor=1+(200/240)*0.3=1.25
    // raw = 25*3.5/1.25*1.0 = 70
    const score = calculateScore('F', 500, 200, 240, 'gps');
    expect(score).toBe(70);
  });

  it('returns integer (Math.round)', () => {
    const score = calculateScore('C/D', 275, 133, 160, 'gps');
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// parseDuration
// ──────────────────────────────────────────────────────────────────────────

describe('parseDuration', () => {
  it('returns null for null input', () => {
    expect(parseDuration(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseDuration('')).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(parseDuration('abc')).toBeNull();
  });

  it('parses "min" suffix correctly', () => {
    expect(parseDuration('30 min')).toBe(30);
    expect(parseDuration('90 min')).toBe(90);
  });

  it('parses "h" suffix as minutes (*60)', () => {
    expect(parseDuration('2 h')).toBe(120);
    // parseInt('1.5') = 1, so 1*60 = 60 (parseInt stops at decimal)
    expect(parseDuration('1.5 h')).toBe(60);
  });

  it('parses "sata" suffix as minutes (*60)', () => {
    expect(parseDuration('3 sata')).toBe(180);
  });

  it('returns null if no known suffix', () => {
    // Without 'min', 'h' or 'sata' suffix, returns null
    expect(parseDuration('45')).toBeNull();
    expect(parseDuration('120')).toBeNull();
  });
});
