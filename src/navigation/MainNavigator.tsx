import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/colors';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Attendance: undefined;
  Profile: undefined;
  Admin: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  emoji: string;
  focused: boolean;
  color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ emoji, focused, color }) => (
  <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
  </View>
);

const MainNavigator = ({ role }: { role: 'admin' | 'employee' }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, string> = {
            Home: '🏠',
            Tasks: '📋',
            Attendance: '📊',
            Profile: '👤',
            Admin: '🛡️',
          };
          return (
            <TabIcon emoji={icons[route.name] ?? '●'} focused={focused} color={color} />
          );
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Home', headerShown: false }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'My Tasks', tabBarLabel: 'Tasks', headerShown: false }}
      />
      {role === 'admin' && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: 'Admin Panel', tabBarLabel: 'Admin', headerShown: false }}
        />
      )}
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: 'Attendance', tabBarLabel: 'Attendance', headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile', tabBarLabel: 'Profile', headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconWrap: {
    width: 36,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  tabIconActive: {
    backgroundColor: `${Colors.primary}25`,
  },
  tabEmoji: {
    fontSize: 20,
  },
});

export default MainNavigator;
