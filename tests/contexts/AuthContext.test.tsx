/**
 * Unit tests for contexts/AuthContext.tsx
 *
 * Tests the authentication context provider and hook.
 * Mocks Firebase Auth and Firestore to test state transitions.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockOnAuthStateChanged = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../lib/firebase', () => ({
  auth: { _isAuth: true },
  db: { _isDb: true },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: any, _col: string, _id: string) => `doc:${_col}/${_id}`),
  getDoc: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDoc } = require('firebase/firestore');

// ─── Wrapper ─────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider',
    );
    spy.mockRestore();
  });

  it('provides loading=true initially', () => {
    // Don't call the auth state changed callback yet
    let capturedCallback: any = null;
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      capturedCallback = cb;
      return jest.fn(); // unsubscribe
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('sets user to null and profile to null when logged out', async () => {
    let capturedCallback: any = null;
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      capturedCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      capturedCallback(null); // null user = logged out
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('sets user when Firebase auth returns a user', async () => {
    const mockUser = { uid: 'user-123', email: 'test@test.com' };
    let capturedCallback: any = null;
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      capturedCallback = cb;
      return jest.fn();
    });

    // getDoc returns a profile
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        firstName: 'John',
        lastName: 'Doe',
        onboardingComplete: true,
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await capturedCallback(mockUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      onboardingComplete: true,
    });
  });

  it('handles profile fetch error gracefully', async () => {
    const mockUser = { uid: 'user-456', email: 'fail@test.com' };
    let capturedCallback: any = null;
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      capturedCallback = cb;
      return jest.fn();
    });

    getDoc.mockRejectedValueOnce(new Error('Firestore down'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await capturedCallback(mockUser);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toBeNull(); // failed gracefully
  });

  it('logout calls signOut', async () => {
    let capturedCallback: any = null;
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      capturedCallback = cb;
      return jest.fn();
    });
    getDoc.mockResolvedValueOnce({ exists: () => false });
    mockSignOut.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await capturedCallback({ uid: 'u1', email: 'e@e.com' });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('refreshProfile updates the profile from Firestore', async () => {
    const mockUser = { uid: 'user-refresh', email: 'r@test.com' };
    let capturedCallback: any = null;
    mockOnAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      capturedCallback = cb;
      return jest.fn();
    });

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ firstName: 'Old', lastName: 'Name', onboardingComplete: true }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await capturedCallback(mockUser);
    });

    expect(result.current.profile?.firstName).toBe('Old');

    // Simulate Firestore returning updated data
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ firstName: 'New', lastName: 'Name', onboardingComplete: true }),
    });

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(result.current.profile?.firstName).toBe('New');
  });
});
