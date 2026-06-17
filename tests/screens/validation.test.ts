/**
 * Unit tests for screen logic
 *
 * Covers:
 * - Registration validation
 * - Login validation
 * - Onboarding step progression
 * - Explore screen filter logic
 * - Ascent form validation and GPS check logic
 * - Activity scoring integration
 */

import { haversineKm, calculateScore, parseDuration } from '../../lib/utils';

// ──────────────────────────────────────────────────────────────────────────
// Registration validation
// ──────────────────────────────────────────────────────────────────────────

describe('Registration validation (register.tsx)', () => {
  const validate = (form: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    password: string;
    confirmPassword: string;
  }): string | null => {
    if (!form.firstName.trim() || !form.lastName.trim())
      return 'Unesite ime i prezime.';
    if (!form.email.trim()) return 'Unesite email.';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(form.dateOfBirth))
      return 'Datum rodjenja mora biti u formatu DD.MM.GGGG';
    if (form.password.length < 6) return 'Lozinka mora imati min. 6 znakova.';
    if (form.password !== form.confirmPassword) return 'Lozinke se ne podudaraju.';
    return null;
  };

  it('rejects empty first name', () => {
    const form = { firstName: '', lastName: 'Horvat', email: 'a@b.com', dateOfBirth: '01.01.1990', password: '123456', confirmPassword: '123456' };
    expect(validate(form)).toBe('Unesite ime i prezime.');
  });

  it('rejects empty email', () => {
    const form = { firstName: 'Ivan', lastName: 'Horvat', email: '', dateOfBirth: '01.01.1990', password: '123456', confirmPassword: '123456' };
    expect(validate(form)).toBe('Unesite email.');
  });

  it('rejects invalid date format', () => {
    const form = { firstName: 'Ivan', lastName: 'Horvat', email: 'a@b.com', dateOfBirth: '1990-01-01', password: '123456', confirmPassword: '123456' };
    expect(validate(form)).toBe('Datum rodjenja mora biti u formatu DD.MM.GGGG');
  });

  it('accepts valid DD.MM.GGGG date', () => {
    expect(/^\d{2}\.\d{2}\.\d{4}$/.test('15.03.1985')).toBe(true);
    expect(/^\d{2}\.\d{2}\.\d{4}$/.test('01.01.2000')).toBe(true);
    expect(/^\d{2}\.\d{2}\.\d{4}$/.test('31.12.1999')).toBe(true);
  });

  it('rejects password shorter than 6 chars', () => {
    const form = { firstName: 'Ivan', lastName: 'Horvat', email: 'a@b.com', dateOfBirth: '01.01.1990', password: '12345', confirmPassword: '12345' };
    expect(validate(form)).toBe('Lozinka mora imati min. 6 znakova.');
  });

  it('rejects mismatched passwords', () => {
    const form = { firstName: 'Ivan', lastName: 'Horvat', email: 'a@b.com', dateOfBirth: '01.01.1990', password: '123456', confirmPassword: '654321' };
    expect(validate(form)).toBe('Lozinke se ne podudaraju.');
  });

  it('passes valid form', () => {
    const form = { firstName: 'Ivan', lastName: 'Horvat', email: 'ivan@email.com', dateOfBirth: '15.03.1985', password: 'siguranPass123', confirmPassword: 'siguranPass123' };
    expect(validate(form)).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Login validation
// ──────────────────────────────────────────────────────────────────────────

describe('Login validation (login.tsx)', () => {
  const validate = (email: string, password: string): string | null => {
    if (!email.trim() || !password) return 'Unesite email i lozinku.';
    return null;
  };

  it('rejects empty email', () => {
    expect(validate('', 'pass')).toBe('Unesite email i lozinku.');
  });

  it('rejects empty password', () => {
    expect(validate('email@test.com', '')).toBe('Unesite email i lozinku.');
  });

  it('rejects both empty', () => {
    expect(validate('', '')).toBe('Unesite email i lozinku.');
  });

  it('passes with valid inputs', () => {
    expect(validate('test@email.com', 'password123')).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Onboarding step progression
// ──────────────────────────────────────────────────────────────────────────

describe('Onboarding step progression (onboarding.tsx)', () => {
  const STEPS = ['experience', 'terrain', 'equipment', 'companionship'];

  it('has 4 steps in correct order', () => {
    expect(STEPS).toHaveLength(4);
    expect(STEPS[0]).toBe('experience');
    expect(STEPS[1]).toBe('terrain');
    expect(STEPS[2]).toBe('equipment');
    expect(STEPS[3]).toBe('companionship');
  });

  it('cannot proceed without selecting an option', () => {
    const answers: Record<string, string> = {};
    const currentStepKey = STEPS[0];
    const canProceed = !!answers[currentStepKey];
    expect(canProceed).toBe(false);
  });

  it('can proceed after selecting an option', () => {
    const answers: Record<string, string> = { experience: '1-5' };
    const currentStepKey = STEPS[0];
    const canProceed = !!answers[currentStepKey];
    expect(canProceed).toBe(true);
  });

  it('progress bar percentage is correct', () => {
    const step = 2; // 0-based, 3rd step
    const progress = (step + 1) / STEPS.length;
    expect(progress).toBe(0.75);
  });

  it('back button available only after step 0', () => {
    expect(0 > 0).toBe(false); // can't go back from step 0
    expect(1 > 0).toBe(true);  // can go back from step 1
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Explore filters
// ──────────────────────────────────────────────────────────────────────────

describe('Explore filter logic (explore.tsx)', () => {
  const sampleFerrate = [
    { id: '1', name: 'Ferata A', location: 'Sarajevo', difficulty: 'A', length: 300, duration: '60 min' },
    { id: '2', name: 'Ferata B', location: 'Mostar', difficulty: 'B/C', length: 800, duration: '120 min' },
    { id: '3', name: 'Ferata C', location: 'Tuzla', difficulty: 'D', length: 500, duration: '90 min' },
    { id: '4', name: 'Ferata D', location: 'Zenica', difficulty: 'E', length: 1200, duration: '3 h' },
  ];

  it('filters by name search (case insensitive)', () => {
    const search = 'ferata a';
    const filtered = sampleFerrate.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()),
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('filters by location search', () => {
    const search = 'mostar';
    const filtered = sampleFerrate.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase()),
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('2');
  });

  it('filters by difficulty', () => {
    const difficulties = ['A', 'B/C'];
    const filtered = sampleFerrate.filter(f =>
      difficulties.includes(f.difficulty),
    );
    expect(filtered).toHaveLength(2);
    expect(filtered.map(f => f.id)).toEqual(['1', '2']);
  });

  it('filters by max length', () => {
    const maxLen = 600;
    const filtered = sampleFerrate.filter(f => f.length <= maxLen);
    expect(filtered).toHaveLength(2);
  });

  it('combines multiple filters', () => {
    const search = 'ferata';
    const difficulties = ['A', 'B/C'];
    const maxLen = 600;
    const filtered = sampleFerrate.filter(f => {
      if (!f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (!difficulties.includes(f.difficulty)) return false;
      if (f.length > maxLen) return false;
      return true;
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('max duration filter works with parseDuration', () => {
    const maxDur = '90 min';
    const maxDurMinutes = parseDuration(maxDur);
    const filtered = sampleFerrate.filter(f => {
      const dur = parseDuration(f.duration);
      return dur !== null && maxDurMinutes !== null && dur <= maxDurMinutes;
    });
    expect(filtered).toHaveLength(2); // 60min and 90min
  });
});

// ──────────────────────────────────────────────────────────────────────────
// GPS check for ascent submission
// ──────────────────────────────────────────────────────────────────────────

describe('Ascent GPS check (activity/add.tsx)', () => {
  const ferrataCoords = { lat: 43.8563, lon: 18.4131 }; // Sarajevo

  it('passes if within 500m', () => {
    // ~10m away
    const userCoords = { lat: 43.8564, lon: 18.4132 };
    const dist = haversineKm(
      userCoords.lat, userCoords.lon,
      ferrataCoords.lat, ferrataCoords.lon,
    );
    expect(dist).toBeLessThan(0.5);
  });

  it('fails if more than 500m away', () => {
    // Mostar is ~75km from Sarajevo
    const userCoords = { lat: 43.3438, lon: 17.8078 };
    const dist = haversineKm(
      userCoords.lat, userCoords.lon,
      ferrataCoords.lat, ferrataCoords.lon,
    );
    expect(dist).toBeGreaterThan(0.5);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Ascent form validation
// ──────────────────────────────────────────────────────────────────────────

describe('Ascent form validation (activity/add.tsx)', () => {
  const validate = (ferrataId: string, date: string, duration: string): string | null => {
    if (!ferrataId) return 'Odaberi feratu.';
    if (!date.trim()) return 'Unesi datum.';
    if (!duration.trim()) return 'Unesi vrijeme trajanja.';
    return null;
  };

  it('rejects empty ferrata selection', () => {
    expect(validate('', '15.06.2026', '90 min')).toBe('Odaberi feratu.');
  });

  it('rejects empty date', () => {
    expect(validate('id-1', '', '90 min')).toBe('Unesi datum.');
  });

  it('rejects empty duration', () => {
    expect(validate('id-1', '15.06.2026', '')).toBe('Unesi vrijeme trajanja.');
  });

  it('passes valid form', () => {
    expect(validate('id-1', '15.06.2026', '90 min')).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Score integration with ascent data (Sprint 4 formula)
// ──────────────────────────────────────────────────────────────────────────

describe('Ascent scoring integration', () => {
  it('calculates score from ferrata parameters', () => {
    const score = calculateScore('C', 350, 150, 180, 'gps');
    expect(score).toBeGreaterThan(0);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('score increases with harder difficulty', () => {
    const scoreA = calculateScore('A', 300, 120, 120, 'manual');
    const scoreC = calculateScore('C', 300, 120, 120, 'manual');
    const scoreF = calculateScore('F', 300, 120, 120, 'manual');
    expect(scoreC).toBeGreaterThan(scoreA);
    expect(scoreF).toBeGreaterThan(scoreC);
  });

  it('GPS completion bonus gives higher score', () => {
    const gpsScore = calculateScore('B', 300, 120, 120, 'gps');
    const manualScore = calculateScore('B', 300, 120, 120, 'manual');
    expect(gpsScore).toBeGreaterThan(manualScore);
  });
});
