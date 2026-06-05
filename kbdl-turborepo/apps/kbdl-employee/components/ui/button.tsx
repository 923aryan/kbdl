import { Colors, Fonts } from '@/constants/theme'; // Adjust this import path to match your setup
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

// Define standard size presets
const BUTTON_SIZES = {
  small: { paddingVertical: 10, fontSize: 14, height: 40 },
  medium: { paddingVertical: 14, fontSize: 16, height: 52 },
  large: { paddingVertical: 18, fontSize: 18, height: 60 },
};

export interface CustomButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'outline' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function CustomButton({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  containerStyle,
  textStyle,
  ...pressableProps
}: CustomButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  console.log('coclor scheam ', colorScheme);
  const themeColors = Colors[colorScheme];

  // 1. Determine Dynamic Colors based on variant
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  const isFilled = isPrimary || isDestructive;

  let backgroundColor = 'transparent';
  if (isPrimary) backgroundColor = themeColors.primary;
  if (isDestructive) backgroundColor = '#EF4444';

  // Note: Your image shows dark text for the outline button, so we use themeColors.text
  const textColor = isFilled ? '#FFFFFF' : themeColors.text;
  const borderColor = isFilled ? 'transparent' : themeColors.primary;

  // 2. Grab sizing values
  const { paddingVertical, fontSize, height } = BUTTON_SIZES[size];

  // 3. Handle opacity for disabled/loading states
  const opacity = disabled || loading ? 0.6 : 1;

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.buttonContainer,
        {
          backgroundColor,
          borderColor,
          paddingVertical,
          height,
          opacity,
          borderWidth: isFilled ? 0 : 1.5,
          overflow: 'hidden', // Ensures the dark overlay doesn't bleed past the border radius
        },
        containerStyle,
      ]}
      {...pressableProps}
    >
      {({ pressed }) => (
        <>
          {/* Overlay to darken background without affecting the text brightness */}
          {pressed && !disabled && !loading && <View style={styles.darkOverlay} />}

          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <View style={styles.contentWrapper}>
              {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

              <Text
                style={[
                  styles.text,
                  {
                    color: textColor,
                    fontSize,
                    fontFamily: Fonts.sans, // Uses the font from your theme
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>

              {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Uniformly darkens any background color beneath it
    zIndex: 1,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // Lifts the text/icons over the dark background overlay
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
