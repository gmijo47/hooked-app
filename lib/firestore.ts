import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Tipovi ───────────────────────────────────────────────────────────────────

export interface ViaFerrata {
  id?: string;
  name: string;
  location: string;
  difficulty: string;
  difficultyLabel: string;
  length: number;
  duration: string;
  description: string;
  detailedDescription?: string;
  targetAudience?: string;
  accessInfo?: string;
  latitude?: number;
  longitude?: number;
  startPoint?: string;
  imageUrl?: string;
  gallery?: string[];
  heightDiff?: string;
  climbingTime?: string;
  accessTime?: string;
  descentTime?: string;
  orientation?: string;
  fitnessLevel?: string;
  skillLevel?: string;
  experience?: string;
  landscape?: string;
  bestSeason?: string[];
  rating: number;
  reviewCount?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Ascent {
  id?: string;
  userId: string;
  ferrataId: string;
  ferrataName?: string;
  date: string;
  duration: string;
  difficultyRating?: number; // 1–5
  notes?: string;
  photos?: string[];
  createdAt: Timestamp;
}

export interface Review {
  id?: string;
  userId: string;
  userName?: string;
  ferrataId: string;
  rating: number;  // 1–5
  comment: string;
  createdAt: Timestamp;
}

export interface Favorite {
  id?: string;
  userId: string;
  ferrataId: string;
  ferrataName?: string;
  createdAt: Timestamp;
}

// ─── Generičke CRUD funkcije ──────────────────────────────────────────────────

export async function getCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<(T & { id: string })[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T & { id: string }));
}

export async function getDocument<T = DocumentData>(
  collectionName: string,
  documentId: string,
): Promise<(T & { id: string }) | null> {
  const ref = doc(db, collectionName, documentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T & { id: string };
}

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function setDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: T,
  merge = true,
): Promise<void> {
  await setDoc(doc(db, collectionName, documentId), data, { merge });
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, collectionName, documentId), data as DocumentData);
}

export async function deleteDocument(
  collectionName: string,
  documentId: string,
): Promise<void> {
  await deleteDoc(doc(db, collectionName, documentId));
}

// ─── Query helper ─────────────────────────────────────────────────────────────

export function whereClause(
  field: string,
  op: WhereFilterOp,
  value: unknown,
): QueryConstraint {
  return where(field, op, value);
}

export function orderByClause(
  field: string,
  direction: OrderByDirection = 'asc',
): QueryConstraint {
  return orderBy(field, direction);
}

export function limitClause(n: number): QueryConstraint {
  return limit(n);
}

// ─── Kolekcije ────────────────────────────────────────────────────────────────

export const COLLECTIONS = {
  USERS: 'users',
  VIA_FERRATA: 'via_ferrata',
  ASCENTS: 'ascents',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
} as const;
