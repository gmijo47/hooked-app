import { View } from 'react-native';
import { Slot } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';
import { Colors } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Slot />
      <CustomTabBar />
    </View>
  );
}
