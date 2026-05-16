import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

// Adjust these imports to match your project structure
import { Colors } from '@/constants/theme';
import CustomButton from '../../components/ui/button';
import CustomInput from '../../components/ui/input';

import { createShiftSchema } from '@repo/validator/shared';

const formSchema = createShiftSchema.shape.body;
type FormData = z.infer<typeof formSchema>;

export default function CreateShiftScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeMobile, setEmployeeMobile] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payType: 'FIXED',
      shift_pay: undefined,
      skill_required: '',
      shift_date: '',
      shift_start: '',
      shift_end: '',
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form Data Submitted:', data);
    // Handle API call here
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Shift details</Text>
            <Text style={styles.subtitle}>Enter the shift Information</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Domain / Skill Required Input */}
            <Controller
              control={control}
              name="skill_required"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Enter Domain :"
                  placeholder="Exp: Welder"
                  icon={<Feather name="tool" size={18} color={theme.icon} />}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.skill_required?.message}
                />
              )}
            />

            {/* Pay Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pay Type :</Text>
              <Controller
                control={control}
                name="payType"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.payTypeContainer}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.payTypeButton,
                        value === 'FIXED' && styles.payTypeButtonActive,
                      ]}
                      onPress={() => onChange('FIXED')}
                    >
                      <Text
                        style={[styles.payTypeText, value === 'FIXED' && styles.payTypeTextActive]}
                      >
                        Fixed
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.payTypeButton,
                        value === 'HOURLY' && styles.payTypeButtonActive,
                      ]}
                      onPress={() => onChange('HOURLY')}
                    >
                      <Text
                        style={[styles.payTypeText, value === 'HOURLY' && styles.payTypeTextActive]}
                      >
                        Hourly
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.payType && <Text style={styles.errorText}>{errors.payType.message}</Text>}
            </View>

            {/* Shift Pay Input */}
            <Controller
              control={control}
              name="shift_pay"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Enter Shift Pay:"
                  placeholder="Exp: Rs.640"
                  prefix="₹"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    const parsed = parseFloat(text);
                    onChange(isNaN(parsed) ? '' : parsed);
                  }}
                  value={value ? String(value) : ''}
                  error={errors.shift_pay?.message}
                />
              )}
            />

            {/* Shift Date Input */}
            <Controller
              control={control}
              name="shift_date"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Enter Date :"
                  placeholder="Exp: 12/05/2026"
                  icon={<Feather name="calendar" size={18} color={theme.icon} />}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.shift_date?.message}
                />
              )}
            />

            {/* Time Row (Shift From & Shift To) */}
            <View style={styles.rowContainer}>
              <View style={styles.halfWidth}>
                <Controller
                  control={control}
                  name="shift_start"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomInput
                      label="Shift From :"
                      placeholder="9:00 AM"
                      icon={<Feather name="clock" size={18} color={theme.icon} />}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.shift_start?.message}
                    />
                  )}
                />
              </View>

              <View style={styles.halfWidth}>
                <Controller
                  control={control}
                  name="shift_end"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomInput
                      label="Shift To :"
                      placeholder="5:00 PM"
                      icon={<Feather name="clock" size={18} color={theme.icon} />}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.shift_end?.message}
                    />
                  )}
                />
              </View>
            </View>

            {/* Add Employee Mobile Number Field */}
            {showAddEmployee && (
              <View style={styles.addEmployeeContainer}>
                <CustomInput
                  label="Enter Mobile Number of Employee :"
                  placeholder="Exp: 9876543210"
                  icon={<Feather name="smartphone" size={18} color={theme.icon} />}
                  keyboardType="phone-pad"
                  value={employeeMobile}
                  onChangeText={setEmployeeMobile}
                />
              </View>
            )}

            {/* Bottom Action Buttons */}
            <View style={styles.actionRow}>
              {!showAddEmployee && (
                <CustomButton
                  title="Add Employee"
                  variant="outline"
                  containerStyle={styles.halfButton}
                  onPress={() => setShowAddEmployee(true)}
                />
              )}
              <CustomButton
                title="Confirm"
                variant="primary"
                loading={isSubmitting}
                containerStyle={styles.halfButton}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Dynamic theme styles
const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    headerContainer: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
    },
    formSection: {
      paddingHorizontal: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
    },
    payTypeContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    payTypeButton: {
      flex: 1,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: theme.card,
    },
    payTypeButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '15',
    },
    payTypeText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    payTypeTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16, // If your RN version doesn't support gap, use margin on child elements
    },
    halfWidth: {
      flex: 1,
    },
    addEmployeeContainer: {
      marginTop: 16,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      gap: 16,
    },
    halfButton: {
      flex: 1,
    },
  });
