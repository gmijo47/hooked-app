import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom AsyncStorage persistence adapter for Firebase Auth SDK v12+
// (getReactNativePersistence was removed from the public API)
const asyncStoragePersistence = {
  type: 'LOCAL' as const,
  async _isAvailable() { return true; },
  async _get(key: string) { return AsyncStorage.getItem(key); },
  async _set(key: string, value: string) { await AsyncStorage.setItem(key, value); },
  async _remove(key: string) { await AsyncStorage.removeItem(key); },
  _addListener(_key: string, _listener: () => void) {},
  _removeListener(_key: string, _listener: () => void) {},
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : asyncStoragePersistence as any,
});

export const db = getFirestore(app);
