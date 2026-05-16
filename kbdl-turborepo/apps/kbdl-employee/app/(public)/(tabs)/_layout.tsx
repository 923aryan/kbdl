import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeIcon from '@/assets/icons/home.svg';
import NotificationsIcon from '@/assets/icons/notification.svg';
import ProfileIcon from '@/assets/icons/profile.svg';
import { Colors } from '@/constants/theme';

function AnimatedIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.set(
      withTiming(focused ? -25 : 0, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [focused]);

  useEffect(() => {
    console.log('focus ');
  }, [focused]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: '#0658C2',
            // 👇 use inset OR a small gap (not both)
            bottom: Math.max(insets.bottom, 12),
          },
        ],

        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon focused={focused}>
              <ProfileIcon
                width={25}
                height={25}
                fill={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />
            </AnimatedIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon focused={focused}>
              <HomeIcon
                width={40}
                height={40}
                fill={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />
            </AnimatedIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon focused={focused}>
              <NotificationsIcon
                width={25}
                height={25}
                fill={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />
            </AnimatedIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 50,
    borderRadius: 50,
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: 0,
    elevation: 5,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBarIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
