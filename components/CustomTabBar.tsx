import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type TabDef = {
  name: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  center?: boolean;
};

const TABS: TabDef[] = [
  { name: 'index',    label: 'Početna',  icon: 'home',                   route: '/'         },
  { name: 'map',      label: 'Mapa',     icon: 'map-outline',             route: '/map'      },
  { name: 'activity', label: 'Aktivnost',icon: 'lightning-bolt',          route: '/activity', center: true },
  { name: 'explore',  label: 'Istraži',  icon: 'compass-outline',         route: '/explore'  },
  { name: 'profile',  label: 'Profil',   icon: 'account-circle-outline',  route: '/profile'  },
];

export default function CustomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isActive = (tab: TabDef) => {
    if (tab.route === '/') return pathname === '/';
    return pathname.startsWith(tab.route);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {TABS.map((tab) => {
        if (tab.center) {
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.centerBtn}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.centerBtnInner, isActive(tab) && styles.centerBtnActive]}>
                <MaterialCommunityIcons name={tab.icon} size={28} color={Colors.white} />
              </View>
            </TouchableOpacity>
          );
        }

        const active = isActive(tab);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={active ? Colors.tabActive : Colors.tabInactive}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 4,
    gap: 2,
  },
  label: {
    fontSize: 10,
    color: Colors.tabInactive,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.tabActive,
  },
  centerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  centerBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  centerBtnActive: {
    backgroundColor: Colors.orangeDim,
  },
});
