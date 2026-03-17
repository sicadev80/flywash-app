import { Tabs } from 'expo-router';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111', borderTopColor: colors.border, height: 72, paddingTop: 8 },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: '#7B7B7B',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} /> }} />
      <Tabs.Screen name="dilution" options={{ title: 'Dilution', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="beaker-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="surface" options={{ title: 'Surface', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-roof" color={color} size={size} /> }} />
      <Tabs.Screen name="pricing" options={{ title: 'Prix', tabBarIcon: ({ color, size }) => <FontAwesome5 name="calculator" color={color} size={size} /> }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-month" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
