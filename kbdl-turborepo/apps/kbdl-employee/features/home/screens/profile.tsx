import CustomButton from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { user, status, signOut } = useAuthStore();

  const handleAuthAction = async () => {
    if (status === 'authenticated') {
      await signOut();
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {status === 'authenticated' && user ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Profile Details</Text>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Name:</Text>
              <Text style={[styles.value, { color: theme.text }]}>{user.name || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Phone:</Text>
              <Text style={[styles.value, { color: theme.text }]}>{user.phone_no || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Language:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {user.preferences?.language || 'en-IN'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Not Logged In</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Please log in to view your profile details.
            </Text>
          </View>
        )}

        <CustomButton
          title={status === 'authenticated' ? 'Logout' : 'Login'}
          onPress={handleAuthAction}
          variant={status === 'authenticated' ? 'outline' : 'primary'}
          containerStyle={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    width: 100,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    marginTop: 10,
  },
});
