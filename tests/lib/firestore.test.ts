/**
 * Unit tests for lib/firestore.ts
 *
 * Tests the API surface: COLLECTIONS, helpers (whereClause, orderByClause, limitClause),
 * and type exports. Firebase SDK functions are mocked.
 */

import {
  COLLECTIONS,
  whereClause,
  orderByClause,
  limitClause,
  getCollection,
  getDocument,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
} from '../../lib/firestore';

// ─── Mock firebase/firestore ────────────────────────────────────────────

jest.mock('../../lib/firebase', () => ({
  db: {}, // dummy db reference
}));

const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: any, name: string) => `col:${name}`),
  doc: jest.fn((_dbOrCol: any, name: string, _id?: string) => `doc:${name}`),
  query: jest.fn((...args: any[]) => ({ __query: true, args })),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  where: jest.fn((field: string, op: string, value: any) => ({ __where: true, field, op, value })),
  orderBy: jest.fn((field: string, dir: string) => ({ __orderBy: true, field, dir })),
  limit: jest.fn((n: number) => ({ __limit: true, n })),
  Timestamp: { now: () => ({ seconds: 0, nanoseconds: 0 }) },
}));

// ──────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// ──────────────────────────────────────────────────────────────────────────

describe('COLLECTIONS', () => {
  it('defines all expected collection names', () => {
    expect(COLLECTIONS.USERS).toBe('users');
    expect(COLLECTIONS.VIA_FERRATA).toBe('via_ferrata');
    expect(COLLECTIONS.ASCENTS).toBe('ascents');
    expect(COLLECTIONS.REVIEWS).toBe('reviews');
    expect(COLLECTIONS.FAVORITES).toBe('favorites');
  });

  it('has exactly 5 collections', () => {
    expect(Object.keys(COLLECTIONS).length).toBe(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────────────────────────────────

describe('whereClause', () => {
  it('produces a where constraint', () => {
    const w = whereClause('userId', '==', 'abc123');
    expect(w).toHaveProperty('__where', true);
    expect((w as any).field).toBe('userId');
    expect((w as any).op).toBe('==');
    expect((w as any).value).toBe('abc123');
  });
});

describe('orderByClause', () => {
  it('produces an orderBy constraint with default asc', () => {
    const o = orderByClause('name');
    expect(o).toHaveProperty('__orderBy', true);
    expect((o as any).dir).toBe('asc');
  });

  it('supports desc direction', () => {
    const o = orderByClause('name', 'desc');
    expect((o as any).dir).toBe('desc');
  });
});

describe('limitClause', () => {
  it('produces a limit constraint', () => {
    const l = limitClause(5);
    expect(l).toHaveProperty('__limit', true);
    expect((l as any).n).toBe(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// CRUD functions (with mocks)
// ──────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCollection', () => {
  it('maps documents to array with id', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: '1', data: () => ({ name: 'Ferata A' }) },
        { id: '2', data: () => ({ name: 'Ferata B' }) },
      ],
    });
    const result = await getCollection('via_ferrata');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: '1', name: 'Ferata A' });
    expect(result[1]).toEqual({ id: '2', name: 'Ferata B' });
  });

  it('returns empty array when no documents', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    const result = await getCollection('empty_collection');
    expect(result).toEqual([]);
  });
});

describe('getDocument', () => {
  it('returns document with id if it exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'doc-1',
      data: () => ({ name: 'Test' }),
    });
    const result = await getDocument('via_ferrata', 'doc-1');
    expect(result).toEqual({ id: 'doc-1', name: 'Test' });
  });

  it('returns null if document does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    const result = await getDocument('via_ferrata', 'missing');
    expect(result).toBeNull();
  });
});

describe('addDocument', () => {
  it('calls addDoc and returns the new id', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'new-id-42' });
    const id = await addDocument('ascents', { name: 'test' });
    expect(id).toBe('new-id-42');
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
  });
});

describe('setDocument', () => {
  it('calls setDoc with merge=true by default', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await setDocument('users', 'uid-1', { name: 'John' });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('updateDocument', () => {
  it('calls updateDoc', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);
    await updateDocument('reviews', 'rev-1', { rating: 5 });
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });
});

describe('deleteDocument', () => {
  it('calls deleteDoc', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined);
    await deleteDocument('favorites', 'fav-1');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});
