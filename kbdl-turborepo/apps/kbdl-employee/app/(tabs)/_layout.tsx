import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

function AnimatedIcon({ focused, theme, children }: { focused: boolean; theme: any; children: React.ReactNode }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.set(
      withTiming(focused ? -12 : 0, {
        duration: 250,
        easing: Easing.out(Easing.back(1.5)),
      }),
    );
    scale.set(
      withTiming(focused ? 1.1 : 1, {
        duration: 250,
        easing: Easing.out(Easing.back(1.5)),
      }),
    );
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }, { scale: scale.get() }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <View style={[
        styles.iconCircle,
        { backgroundColor: focused ? theme.primary : 'transparent' }
      ]}>
        {children}
      </View>
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
            backgroundColor: theme.card,
            borderColor: theme.border,
            bottom: Math.max(insets.bottom, 16),
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
            <AnimatedIcon focused={focused} theme={theme}>
              <Feather
                name="user"
                size={24}
                color={focused ? '#FFFFFF' : theme.tabIconDefault}
              />
            </AnimatedIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon focused={focused} theme={theme}>
              <Feather
                name="home"
                size={24}
                color={focused ? '#FFFFFF' : theme.tabIconDefault}
              />
            </AnimatedIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon focused={focused} theme={theme}>
              <Feather
                name="bell"
                size={24}
                color={focused ? '#FFFFFF' : theme.tabIconDefault}
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
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderTopWidth: 1,
    paddingBottom: 0,
    paddingTop: 0,
    elevation: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
