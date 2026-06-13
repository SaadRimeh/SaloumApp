import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../utils/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme, isArabic, isDark } = useAppContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          height: 50 + insets.top, // Reduced header height accounting for notch
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#C5A880',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#C5A880',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isArabic ? 'الرئيسية' : 'Home',
          tabBarLabel: isArabic ? 'الرئيسية' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="products"
        options={{
          title: isArabic ? 'المتجر' : 'Shop',
          tabBarLabel: isArabic ? 'المتجر' : 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: isArabic ? 'مواعيدي' : 'My Appointments',
          tabBarLabel: isArabic ? 'الحجوزات' : 'Appointments',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: isArabic ? 'عطورات' : 'Perfumes',
          tabBarLabel: isArabic ? 'عطورات' : 'Perfumes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flask' : 'flask-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
