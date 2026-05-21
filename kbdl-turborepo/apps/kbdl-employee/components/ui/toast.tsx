import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast, { BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  // We override the default 'error' type
  error: (props: BaseToastProps) => (
    <View style={styles.errorBox}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={32} color="#F43F5E" />
      </View>

      {/* We use props.text2 because in your API client you pass the actual error message there */}
      <Text style={styles.boxText}>{props.text2 || props.text1}</Text>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => Toast.hide()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="x" size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  ),

  // We override the default 'success' type
  success: (props: BaseToastProps) => (
    <View style={styles.successBox}>
      <View style={styles.iconContainer}>
        <Feather name="check-circle" size={32} color="#22C55E" />
      </View>

      {/* We use props.text1 for the success message */}
      <Text style={styles.boxText}>{props.text1}</Text>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => Toast.hide()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="x" size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  ),
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4D4F',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%', // Ensures it doesn't stretch to the very edges of the screen
    shadowColor: '#000', // Optional: adds a slight drop shadow for the floating effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successBox: {
    backgroundColor: '#E6FBEB',
    borderColor: '#22C55E',
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 12,
  },
  boxText: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    paddingRight: 8,
  },
  closeButton: {
    padding: 4,
  },
});
