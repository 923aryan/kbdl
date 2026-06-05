import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { typography } from '@/constants/typography';

export interface SearchBarProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export default function SearchBar({ containerStyle, onFocus, onBlur, ...props }: SearchBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: isFocused ? theme.primary : theme.border,
        },
        containerStyle,
      ]}
    >
      <Feather name="search" size={20} color={isFocused ? theme.primary : theme.icon} />
      <TextInput
        style={[styles.input, { color: theme.text, fontFamily: typography.body.fontFamily }]}
        placeholderTextColor={theme.textSecondary}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {!!props.value && (
        <TouchableOpacity
          onPress={() => props.onChangeText?.('')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearButton}
        >
          <Feather name="x-circle" size={18} color={theme.icon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26, // Pill shape for a modern search bar look
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    height: '100%', // Fills height to maximize touch area
    paddingVertical: 0, // Fixes Android vertical alignment clipping
  },
  clearButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
