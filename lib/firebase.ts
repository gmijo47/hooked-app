import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Firebase Auth v12 on React Native expects a class-based persistence object,
// so plain object adapters don't work. We use getAuth() which gives in-memory
// persistence by default on non-web platforms => auth state won't survive
// app restarts, but at least the app doesn't crash.
// TODO: Switch to @react-native-firebase/auth for proper native persistence.
export const auth = Platform.OS === 'web'
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
