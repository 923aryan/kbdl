import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

interface CollapsibleHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CollapsibleHeader({ title, isExpanded, onToggle }: CollapsibleHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1, // Prevents text from pushing the icon down to the next line
    marginRight: 8,
  },
});
