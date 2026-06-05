// src/components/auth/protected-screen.tsx

import { router, Stack } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import CustomButton from '@/components/ui/button';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '../hooks/useAuth';

interface Props {
  children: ReactNode;
}

export function ProtectedScreen({ children }: Props) {
  const status = useAuthStore((s) => s.status);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  if (status === 'loading') {
    return null;
  }

  if (status !== 'authenticated') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                },
              ]}
            >
              Login Required
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              Please login to access this feature and continue using the app.
            </Text>

            <CustomButton
              title="Login"
              size="medium"
              onPress={() => router.push('/auth/login')}
              containerStyle={styles.button}
            />
          </View>
        </View>
      </>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.sans,
    marginBottom: 12,
    textAlign: 'center',
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginBottom: 24,
  },

  button: {
    marginTop: 4,
  },
});
