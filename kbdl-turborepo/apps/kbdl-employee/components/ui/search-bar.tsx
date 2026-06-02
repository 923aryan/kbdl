import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { typography } from '@/constants/typography';

export interface SearchBarProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export default function SearchBar({ containerStyle, ...props }: SearchBarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        containerStyle,
      ]}
    >
      <Feather name="search" size={20} color={theme.icon} />
      <TextInput
        style={[styles.input, { color: theme.text, fontFamily: typography.body.fontFamily }]}
        placeholderTextColor={theme.textSecondary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
});
