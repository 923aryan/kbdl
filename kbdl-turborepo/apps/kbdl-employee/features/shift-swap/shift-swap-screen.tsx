import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

            {/* Bottom Action Buttons */}
            <View style={styles.actionRow}>
              <CustomButton
                title="Add Employe"
                variant="outline"
                containerStyle={styles.halfButton}
                onPress={() => console.log('Add Employee clicked')}
              />
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
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16, // If your RN version doesn't support gap, use margin on child elements
    },
    halfWidth: {
      flex: 1,
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