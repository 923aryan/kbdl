import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import CustomButton from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Colors } from '@/constants/theme';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'destructive' | 'outline';
  loading?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
}: ConfirmationModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <Typography variant="h2" style={[styles.title, { color: theme.text }]}>
            {title}
          </Typography>

          <Typography variant="body" style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Typography>

          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <CustomButton
                title={cancelText}
                variant="outline"
                onPress={onCancel}
                disabled={loading}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <CustomButton
                title={confirmText}
                variant={confirmVariant}
                onPress={onConfirm}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  title: { fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  message: { textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  buttonWrapper: { flex: 1 },
});
