import { Colors, Fonts } from '@/constants/theme';
import React, { ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
  ViewStyle
} from 'react-native';


export interface CustomInputProps extends TextInputProps {
  label?: string;
  icon?: ReactNode;
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
}

export default function CustomInput({
  label,
  icon,
  prefix,
  containerStyle,
  error,
  ...textInputProps
}: CustomInputProps) {
  // Fallback to 'light' if colorScheme is null/undefined
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  // Standard error color (Red)
  const errorColor = '#EF4444';

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, { color: themeColors.text, fontFamily: Fonts.sans }]}>
          {label}
        </Text>
      )}

      {/* Main Input Box */}
      <View style={[
        styles.inputWrapper,
        {
          backgroundColor: themeColors.background,
          // Highlight border red if there is an error
          borderColor: error ? errorColor : themeColors.border
        }
      ]}>

        {/* Left Section */}
        <View style={styles.leftSection}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {prefix && (
            <Text style={[styles.prefixText, { color: themeColors.text, fontFamily: Fonts.sans }]}>
              {prefix}
            </Text>
          )}
        </View>

        {/* Separator */}
        <View style={[
          styles.separator,
          { backgroundColor: error ? errorColor : themeColors.border }
        ]} />

        {/* Text Input */}
        <TextInput
          style={[styles.input, { color: themeColors.text, fontFamily: Fonts.sans }]}
          placeholderTextColor={themeColors.textSecondary}
          {...textInputProps}
        />
      </View>

      {/* Error Message Text */}
      {error && (
        <Text style={[styles.errorText, { color: errorColor, fontFamily: Fonts.sans }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 52,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 14,
    marginLeft: 6,
  },
  separator: {
    width: 1,
    height: '60%',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingRight: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  }
});