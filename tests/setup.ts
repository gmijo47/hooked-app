// Jest setup for React Native + Expo tests

// Note: @testing-library/jest-native extend-expect has been deprecated.
// Use built-in Jest matchers instead (toBeOnTheScreen, toHaveTextContent, etc.
// are now available in @testing-library/react-native v12.4+ natively).

// Mock expo modules that are commonly used
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => ['(tabs)'],
  useRootNavigationState: () => ({ key: 'test-key' }),
  useFocusEffect: jest.fn((cb: () => void) => cb()),
  Link: 'Link',
  Stack: 'Stack',
  Slot: 'Slot',
  Tabs: 'Tabs',
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 43.8563, longitude: 18.4131 },
    }),
  ),
  Accuracy: { Balanced: 3 },
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock(
  'react-native-safe-area-context',
  () => ({
    useSafeAreaInsets: () => ({
      top: 0, bottom: 0, left: 0, right: 0,
    }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
  }),
);

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Silence console.error in tests (optional)
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Not implemented:'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
