import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';

interface Loader {
  /** Diameter of the loader in pixels */
  size?: number;
  /** Optional loading text to display below the spinner */
  message?: string;
  /** Ensures the loader fills the parent container and centers itself */
  fullScreen?: boolean;
}

export default function Loader({ size = 40, message, fullScreen = false }: Loader) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // 1. Create a reference to hold the animation value
  const spinValue = useRef(new Animated.Value(0)).current;

  // 2. Start the endless spinning loop when the component mounts
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear, // Constant speed
        useNativeDriver: true, // Offloads animation to native UI thread for smooth performance
      }),
    ).start();
  }, [spinValue]);

  // 3. Interpolate the 0-1 value into a 0-360 degree rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreenContainer,
        fullScreen && { backgroundColor: theme.background },
      ]}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size * 0.1, // dynamically size the thickness based on the loader size
            borderTopColor: theme.primary,
            borderRightColor: theme.border,
            borderBottomColor: theme.border,
            borderLeftColor: theme.border,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* Conditionally render the typography component if a message is passed */}
      {message && (
        <Typography variant="caption" style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    padding: 0,
  },
  message: {
    marginTop: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
