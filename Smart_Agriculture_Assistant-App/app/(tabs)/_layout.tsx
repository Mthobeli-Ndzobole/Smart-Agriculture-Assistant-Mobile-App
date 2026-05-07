import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/appTheme';

const iconForRoute = {
  index: 'home',
  weather: 'cloud',
  alerts: 'notifications',
  farmrecords: 'bar-chart',
  croplogs: 'leaf',
  marketprice: 'cash',
  disease: 'camera',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#7B8A82',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#DDE9DF',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconForRoute[route.name] || 'ellipse'} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="weather" options={{ title: 'Weather' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="farmrecords" options={{ title: 'Records' }} />
      <Tabs.Screen name="croplogs" options={{ title: 'Crop Logs' }} />
      <Tabs.Screen name="marketprice" options={{ title: 'Market' }} />
      <Tabs.Screen name="disease" options={{ title: 'AI Scan' }} />
    </Tabs>
  );
}
