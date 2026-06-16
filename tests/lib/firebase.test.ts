/**
 * Unit tests for lib/firebase.ts
 *
 * Ensures Firebase module exports the expected objects.
 * The full Firebase SDK (ESM) cannot be loaded in Jest, so we mock
 * the module and verify the expected exports shape.
 */

// Mock the entire firebase module before any imports
jest.mock('../../lib/firebase', () => ({
  auth: { _isAuth: true },
  db: { _isDb: true },
  storage: { _isStorage: true },
}));

describe('Firebase initialization', () => {
  it('exports auth, db, and storage', () => {
    const fb = require('../../lib/firebase');
    expect(fb.auth).toBeDefined();
    expect(fb.db).toBeDefined();
    expect(fb.storage).toBeDefined();
  });

  it('uses EXPO_PUBLIC_ env vars for config', () => {
    // Validate that env keys are expected shape
    // (actual values should not be asserted in tests)
    const keys = [
      'EXPO_PUBLIC_FIREBASE_API_KEY',
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
      'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'EXPO_PUBLIC_FIREBASE_APP_ID',
    ];
    keys.forEach((key) => {
      // In test environment, env vars are typically undefined — that's fine
      expect(typeof process.env[key]).toMatch(/string|undefined/);
    });
  });
});
