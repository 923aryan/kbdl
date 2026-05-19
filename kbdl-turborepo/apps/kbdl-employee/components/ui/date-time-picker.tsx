import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DateTimePickerInputProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  icon: React.ReactNode;
  error?: string | null;
  theme: any;
}

export default function DateTimePickerInput({
  label,
  value,
  onChange,
  mode,
  icon,
  error,
  theme,
}: DateTimePickerInputProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false); // Android picker closes automatically
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  // Format display text based on mode
  const displayText = value
    ? mode === 'date'
      ? value.toLocaleDateString('en-GB') // e.g. 28/05/2024
      : value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) // e.g. 07:00 AM
    : mode === 'date'
      ? 'Select Date'
      : 'Select Time';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.background,
            borderColor: error ? '#DC2626' : theme.border,
          },
        ]}
        onPress={() => setShow(true)}
      >
        <View style={styles.iconWrapper}>{icon}</View>
        <View style={[styles.separator, { backgroundColor: theme.border }]} />
        <Text style={[styles.inputText, { color: value ? theme.text : theme.textSecondary }]}>
          {displayText}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleChange}
          textColor={theme.text}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
  },
  iconWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '60%',
  },
  inputText: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
});
