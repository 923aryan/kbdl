import CheckMark from '@/assets/images/check-mark.svg'; // Using the pre-imported SVG
import { Colors } from '@/constants/theme';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface SuccessCardProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

export function SuccessCard({ visible, message, onClose }: SuccessCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          {/* Main action header - a circular button containing the SVG */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <CheckMark width={32} height={32} />
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>

          {/* Main message - your prop, now used as a bold title */}
          <Text style={[styles.messageTitle, { color: theme.text }]}>{message}</Text>
          {/* Secondary close button, using the onClose prop */}
          <TouchableOpacity style={styles.closeButtonContainer} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center', // Centers the card on the screen
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    padding: 24,
    borderRadius: 16, // All-around border radius
    alignItems: 'center',
    marginHorizontal: 20, // Adds padding from the screen edges
  },
  headerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -50, // Pushes the top half of the header outside the card
  },
  doneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  messageTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20, // Improves readability
  },
  closeButtonContainer: {
    marginBottom: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
