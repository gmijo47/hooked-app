import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111111' },
        headerTintColor: '#F0F0F0',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Nazad',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="edit" options={{ title: 'Uredi profil' }} />
    </Stack>
  );
}
