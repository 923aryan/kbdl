import { Colors, Fonts } from '@/constants/theme'; // Adjust this import path to match your setup
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

// Define standard size presets
const BUTTON_SIZES = {
  small: { paddingVertical: 10, fontSize: 14, height: 40 },
  medium: { paddingVertical: 14, fontSize: 16, height: 52 },
  large: { paddingVertical: 18, fontSize: 18, height: 60 },
};

export interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline';
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
  ...touchableProps
}: CustomButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  // 1. Determine Dynamic Colors based on variant
  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? themeColors.primary : 'transparent';
  // Note: Your image shows dark text for the outline button, so we use themeColors.text
  const textColor = isPrimary ? '#FFFFFF' : themeColors.text;
  const borderColor = isPrimary ? 'transparent' : themeColors.primary;

  // 2. Grab sizing values
  const { paddingVertical, fontSize, height } = BUTTON_SIZES[size];

  // 3. Handle opacity for disabled/loading states
  const opacity = disabled || loading ? 0.6 : 1;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.buttonContainer,
        {
          backgroundColor,
          borderColor,
          paddingVertical,
          height,
          opacity,
          borderWidth: isPrimary ? 0 : 1.5,
        },
        containerStyle,
      ]}
      {...touchableProps}
    >
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
    </TouchableOpacity>
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
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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