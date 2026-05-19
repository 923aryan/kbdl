import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorMessageBoxProps {
  message: string | null | undefined;
  onClose: () => void;
}

export default function ErrorMessageBox({ message, onClose }: ErrorMessageBoxProps) {
  // If there is no message, don't render anything
  if (!message) return null;

  return (
    <View style={styles.errorBox}>
      <View style={styles.errorIconContainer}>
        <Ionicons name="warning" size={32} color="#F43F5E" />
      </View>
      <Text style={styles.errorBoxText}>{message}</Text>
      <TouchableOpacity
        style={styles.errorCloseButton}
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Makes it easier to tap
      >
        <Feather name="x" size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4D4F',
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8, // Added a slight border radius for a modern look
  },
  errorIconContainer: {
    marginRight: 12,
  },
  errorBoxText: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    paddingRight: 8,
  },
  errorCloseButton: {
    padding: 4,
  },
});
