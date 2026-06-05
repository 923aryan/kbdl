import { Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

function AnimatedTabIcon({
  icon,
  active,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  theme: any;
}) {
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 250,
    });
  }, [active]);

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [0, -10]),
      },
      {
        scale: interpolate(progress.value, [0, 1], [1, 1.08]),
      },
    ],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <Animated.View style={iconContainerStyle}>
      <View
        style={{
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, inactiveIconStyle]}>
          <Feather name={icon} size={24} color={theme.tabIconDefault} />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, styles.center, activeIconStyle]}>
          <Feather name={icon} size={24} color="#FFFFFF" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [barWidth, setBarWidth] = React.useState(0);
  const isFirstRender = React.useRef(true);

  const indicatorX = useSharedValue(0);

  const PILL_SIZE = 44;

  useEffect(() => {
    if (!barWidth) return;

    const tabWidth = barWidth / state.routes.length;
    const targetX = tabWidth * state.index + (tabWidth - PILL_SIZE) / 2;

    if (isFirstRender.current) {
      indicatorX.value = targetX;
      isFirstRender.current = false;
    } else {
      indicatorX.value = withSpring(targetX, {
        damping: 90,
        stiffness: 1000,
      });
    }
  }, [state.index, barWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: indicatorX.value,
      },
    ],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.tabBar,
        {
          bottom: Math.max(insets.bottom, 16),
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {barWidth > 0 && (
        <Animated.View
          style={[
            styles.activePill,
            {
              width: PILL_SIZE,
              height: PILL_SIZE,
              backgroundColor: theme.primary,
            },
            pillStyle,
          ]}
        />
      )}

      {state.routes.map((route, index) => {
        const focused = state.index === index;

        let icon: keyof typeof Feather.glyphMap = 'home';

        if (route.name === 'profile') {
          icon = 'user';
        } else if (route.name === 'notifications') {
          icon = 'bell';
        }

        return (
          <Pressable
            key={route.key}
            style={styles.tabButton}
            onPress={() => navigation.navigate(route.name)}
          >
            <AnimatedTabIcon icon={icon} active={focused} theme={theme} />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      backBehavior="history"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="notifications" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'visible',

    elevation: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  activePill: {
    position: 'absolute',
    top: -6,
    borderRadius: 22,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 6,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
