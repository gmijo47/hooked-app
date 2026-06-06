import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

function RootGuard() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();
  const navigating = useRef(false);

  useEffect(() => {
    if (loading || !navState?.key || navigating.current) return;

    const inAuth = segments[0] === '(auth)';

    if (!user) {
      if (!inAuth) {
        navigating.current = true;
        router.replace('/(auth)/login');
      }
    } else if (!profile?.onboardingComplete) {
      if (segments[1] !== 'onboarding') {
        navigating.current = true;
        router.replace('/(auth)/onboarding');
      }
    } else {
      if (inAuth) {
        navigating.current = true;
        router.replace('/(tabs)');
      }
    }
  }, [user, profile, loading, segments, navState?.key]);

  // Reset navigating flag when segments change (navigation completed)
  useEffect(() => {
    navigating.current = false;
  }, [segments]);

  if (loading || !navState?.key) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootGuard />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
