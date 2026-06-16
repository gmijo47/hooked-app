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
// calculateScore
// ──────────────────────────────────────────────────────────────────────────

describe('calculateScore', () => {
  it('returns 0 for empty difficulty', () => {
    expect(calculateScore('', 500, '300 m', '2 h')).toBe(0);
  });

  it('base score = difficulty weight * 10', () => {
    // 'A' weight = 1 → base = 10
    expect(calculateScore('A', 0, undefined, undefined)).toBe(10);
    // 'B' weight = 3 → base = 30
    expect(calculateScore('B', 0, undefined, undefined)).toBe(30);
    // 'D' weight = 13 → base = 130
    expect(calculateScore('D', 0, undefined, undefined)).toBe(130);
    // 'F' weight = 25 → base = 250
    expect(calculateScore('F', 0, undefined, undefined)).toBe(250);
  });

  it('adds length bonus: +0.02 per meter', () => {
    // base 10 + 500m * 0.02 = 10 + 10 = 20
    expect(calculateScore('A', 500, undefined, undefined)).toBe(20);
    // base 30 + 1000m * 0.02 = 30 + 20 = 50
    expect(calculateScore('B', 1000, undefined, undefined)).toBe(50);
  });

  it('adds height bonus: +0.05 per meter', () => {
    // base 10 + 300m * 0.05 = 10 + 15 = 25
    expect(calculateScore('A', 0, '300 m', undefined)).toBe(25);
    // base 30 + 500m * 0.05 = 30 + 25 = 55
    expect(calculateScore('B', 0, '500 m', undefined)).toBe(55);
  });

  it('parses height from string like "450 m"', () => {
    expect(calculateScore('A', 0, '450 m visine', undefined)).toBe(
      10 + Math.round(450 * 0.05),
    );
  });

  it('adds duration bonus: +0.1 per minute', () => {
    // base 10 + 90min * 0.1 = 10 + 9 = 19
    expect(calculateScore('A', 0, undefined, '90 min')).toBe(19);
    // base 30 + 2h * 0.1 = 30 + 120*0.1 = 42
    expect(calculateScore('B', 0, undefined, '2 h')).toBe(42);
  });

  it('combines all parameters correctly', () => {
    const score = calculateScore('C', 800, '350 m', '3 h');
    // base = 7*10 = 70
    // length = 800*0.02 = 16
    // height = 350*0.05 = 17.5
    // duration = 180*0.1 = 18
    // total ≈ 121.5 → 122
    expect(score).toBeGreaterThanOrEqual(121);
    expect(score).toBeLessThanOrEqual(122);
  });

  it('returns integer (Math.round)', () => {
    const score = calculateScore('A', 333, '111 m', '55 min');
    expect(Number.isInteger(score)).toBe(true);
  });

  it('handles missing optional params gracefully', () => {
    expect(calculateScore('A', 0, undefined, undefined)).toBe(10);
    expect(calculateScore('C/D', 200, '', '')).toBeGreaterThan(0);
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
