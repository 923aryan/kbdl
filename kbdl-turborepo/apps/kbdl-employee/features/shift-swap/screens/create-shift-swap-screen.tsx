import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

// Adjust these imports to match your project structure
import DateTimePickerInput from '@/components/ui/date-time-picker';
import ErrorMessageBox from '@/components/ui/error-message-box';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { createShiftSchema } from '@repo/validator/shared';
import CustomButton from '../../../components/ui/button';
import CustomInput from '../../../components/ui/input';
import { SuccessCard } from '../../../components/ui/success-card';
import { useCreateShiftSwap, useGetReferredEmployee } from '../api';

const formSchema = createShiftSchema.shape.body;
type FormData = z.infer<typeof formSchema>;

export default function CreateShiftScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const router = useRouter();

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeMobile, setEmployeeMobile] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { user } = useAuthStore();
  const { mutate: getReferredEmployee } = useGetReferredEmployee();
  const { mutate: createShift, isSuccess, reset: resetCreateShift } = useCreateShiftSwap();

  const {
    control,
    handleSubmit,
    watch,
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

  console.log('errors', errors);
  console.log('values', watch());

  const shiftDateVal = watch('shift_date');

  const onSubmit = (data: FormData) => {
    console.log('data is ', data);

    setErrorMessage('');

    const proceedWithShiftCreation = (replacement_employee_id?: string) => {
      const baseDate = new Date(data.shift_date);
      const startTime = new Date(data.shift_start);
      const endTime = new Date(data.shift_end);

      startTime.setFullYear(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

      endTime.setFullYear(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

      const payload = {
        original_employee_id: user?.id || '',
        payType: data.payType,
        shift_pay: Number(data.shift_pay),
        skill_required: data.skill_required,
        shift_date: baseDate.toISOString(),
        shift_start: startTime.toISOString(),
        shift_end: endTime.toISOString(),
        ...(replacement_employee_id && {
          replacement_employee_id,
        }),
      };

      console.log('payload', payload);

      createShift(payload as any, {
        onSuccess: (res) => {
          console.log('createShift success', res);
        },

        onError: (error: any) => {
          console.log('createShift error', error);

          const msg = error?.message || 'Failed to create shift swap';

          setErrorMessage(msg);

          // Toast.show({
          //   type: 'error',
          //   text1: 'Error',
          //   text2: msg,
          // });
        },
      });
    };

    if (showAddEmployee && !employeeMobile.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter employee mobile number',
      });
      return;
    }

    // no replacement employee flow
    if (!showAddEmployee) {
      proceedWithShiftCreation();
      return;
    }

    const phone_no = employeeMobile.startsWith('+91') ? employeeMobile : `+91${employeeMobile}`;

    getReferredEmployee(
      { phone_no },
      {
        onSuccess: (res) => {
          console.log('employee found', res);

          proceedWithShiftCreation(res.data.id);
        },

        onError: (error: any) => {
          console.log('getReferredEmployee error', error);

          const msg = error?.message || 'Error fetching referred employee';

          setErrorMessage(msg);

          // Toast.show({
          //   type: 'error',
          //   text1: 'Error',
          //   text2: msg,
          // });
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Shift details</Text>
          <Text style={styles.subtitle}>Enter the shift Information</Text>
        </View>

        <View style={styles.formSection}>
          <ErrorMessageBox message={errorMessage} onClose={() => setErrorMessage('')} />

          <Controller
            control={control}
            name="skill_required"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Enter Skills :"
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
                    style={[styles.payTypeButton, value === 'FIXED' && styles.payTypeButtonActive]}
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
                    style={[styles.payTypeButton, value === 'HOURLY' && styles.payTypeButtonActive]}
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

          {/* Shift Date Input (Replaced with DateTimePickerInput) */}
          <Controller
            control={control}
            name="shift_date"
            render={({ field: { onChange, value } }) => (
              <DateTimePickerInput
                label="Enter Date :"
                mode="date"
                value={value ? new Date(value) : null}
                onChange={(date) => onChange(date.toISOString())}
                icon={<Feather name="calendar" size={18} color={theme.icon} />}
                error={errors.shift_date?.message}
                theme={theme}
              />
            )}
          />

          {/* Time Row (Shift From & Shift To) */}
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              {/* Shift Start (Replaced with DateTimePickerInput) */}
              <Controller
                control={control}
                name="shift_start"
                render={({ field: { onChange, value } }) => (
                  <DateTimePickerInput
                    label="Shift From :"
                    mode="time"
                    value={value ? new Date(value) : null}
                    onChange={(date) => {
                      if (shiftDateVal) {
                        const baseDate = new Date(shiftDateVal);
                        date.setFullYear(
                          baseDate.getFullYear(),
                          baseDate.getMonth(),
                          baseDate.getDate(),
                        );
                      }
                      onChange(date.toISOString());
                    }}
                    icon={<Feather name="clock" size={18} color={theme.icon} />}
                    error={errors.shift_start?.message}
                    theme={theme}
                    disabled={!shiftDateVal}
                  />
                )}
              />
            </View>

            <View style={styles.halfWidth}>
              {/* Shift End (Replaced with DateTimePickerInput) */}
              <Controller
                control={control}
                name="shift_end"
                render={({ field: { onChange, value } }) => (
                  <DateTimePickerInput
                    label="Shift To :"
                    mode="time"
                    value={value ? new Date(value) : null}
                    onChange={(date) => {
                      if (shiftDateVal) {
                        const baseDate = new Date(shiftDateVal);
                        date.setFullYear(
                          baseDate.getFullYear(),
                          baseDate.getMonth(),
                          baseDate.getDate(),
                        );
                      }
                      onChange(date.toISOString());
                    }}
                    icon={<Feather name="clock" size={18} color={theme.icon} />}
                    error={errors.shift_end?.message}
                    theme={theme}
                    disabled={!shiftDateVal}
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
            <CustomButton
              title={showAddEmployee ? 'Remove Employee' : 'Add Employee'}
              variant="outline"
              containerStyle={styles.halfButton}
              onPress={() => {
                setShowAddEmployee(!showAddEmployee);
                if (showAddEmployee) {
                  setEmployeeMobile(''); // Clear out previous input
                }
              }}
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

      {/* Success Modal */}
      <SuccessCard
        visible={isSuccess}
        message="Shift swap created successfully!"
        onClose={() => {
          resetCreateShift(); // Resets the React Query mutation state
          router.back(); // Navigates the user back to the main Shifts menu
        }}
      />
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
    scrollContent: {
      paddingBottom: 40,
    },
    headerContainer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '500',
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
      gap: 16,
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
