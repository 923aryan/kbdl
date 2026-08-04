import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';

export default function FindJobsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
          <Feather name="briefcase" size={48} color={theme.primary} />
        </View>
        <Typography variant="h2" style={[styles.title, { color: theme.text }]}>
          {/* Coming Soon! */}
          Aniket Here
        </Typography>
        <Typography variant="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {/* We are working hard to bring you the best job finding experience. Stay tuned! */}
          Hii Its Aniket Working on this screen. Will be live soon. Thanks for your patience.
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
});
