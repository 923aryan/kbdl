import { Colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { userRegisterSchema } from '@repo/validator/shared';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useRegisterUser } from '../api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const formSchema = userRegisterSchema.shape.body;
type FormData = z.input<typeof formSchema>;

export default function SignupScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const { mutate: registerUser, isPending } = useRegisterUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone_no: '+91',
      preferences: {
        language: 'en-US',
        theme: 'system',
      },
    },
  });

  const onSubmit = (data: FormData) => {
    registerUser(data as any, {
      onSuccess: (res) => {
        console.log('Registration successful', res);
      },
      onError: (err) => {
        console.error('Registration failed', err);
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

          {/* Header Image Section */}
          <Image
            source={require('@/assets/images/at-login.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />

          {/* Form Section */}
          <View style={styles.formSection}>

            {/* Language Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Language</Text>
              <Controller
                control={control}
                name="preferences.language"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.preferences?.language && styles.inputError,
                      ]}
                    >
                      <Feather name="globe" size={20} color={theme.icon} />
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g., en-US, hi-IN"
                        placeholderTextColor={theme.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    </View>
                    {errors.preferences?.language && (
                      <Text style={styles.errorText}>
                        {errors.preferences.language.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.name && styles.inputError,
                      ]}
                    >
                      <Feather name="user" size={20} color={theme.icon} />
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Exp: Ramesh Kumar"
                        placeholderTextColor={theme.textSecondary}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value || ''}
                      />
                    </View>
                    {errors.name && (
                      <Text style={styles.errorText}>{errors.name.message}</Text>
                    )}
                  </>
                )}
              />
            </View>

            {/* Mobile Number Input */}
            <View style={styles.inputContainerLarge}>
              <Text style={styles.inputLabel}>Enter Mobile Number</Text>
              <Controller
                control={control}
                name="phone_no"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={[
                        styles.inputWrapper,
                        errors.phone_no && styles.inputError,
                      ]}
                    >
                      <Feather name="smartphone" size={20} color={theme.icon} />
                      <Text style={styles.countryCode}>+91</Text>
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Exp: 8360170..."
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onBlur={onBlur}
                        onChangeText={(text) => {
                          // Only allow numeric input to form the actual phone_no
                          const numericText = text.replace(/[^0-9]/g, '');
                          onChange(`+91${numericText}`);
                        }}
                        // Strip +91 out from displaying in the Input so the UI feels fluid
                        value={value ? value.replace(/^\+91/, '') : ''}
                      />
                    </View>
                    {errors.phone_no && (
                      <Text style={styles.errorText}>
                        {errors.phone_no.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>OTP Bhejo</Text>
              )}
            </TouchableOpacity>

            {/* Bottom Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Pehle se account hai, </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.footerLink}>Login Kro</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Function to generate dynamic styles based on the active theme
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
    headerImage: {
      width: '100%',
      height: SCREEN_HEIGHT * 0.30,
    },
    formSection: {
      paddingHorizontal: 24,
      marginTop: 12, // Reduced from 16
    },
    inputContainer: {
      marginBottom: 16, // Reduced from 24
    },
    inputContainerLarge: {
      marginBottom: 20, // Reduced from 32
    },
    inputLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10, // Slightly reduced radius from 12
      paddingHorizontal: 14, // Reduced from 16
      // 5. Reduced input height to compact the inputs
      height: 48, // Reduced from 56
      backgroundColor: theme.card,
    },
    divider: {
      width: 1,
      height: 20, // Reduced from 24
      backgroundColor: theme.border,
      marginHorizontal: 10, // Reduced from 12
    },
    textInput: {
      flex: 1,
      color: theme.text,
      // 6. Slightly reduced input text font size
      fontSize: 15, // Reduced from 16
    },
    inputError: {
      borderColor: 'red',
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
    },
    countryCode: {
      color: theme.text,
      fontSize: 15, // Reduced from 16
      fontWeight: '500',
      marginLeft: 6, // Reduced from 8
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 10, // Slightly reduced radius from 12
      // 7. Reduced button height to compact the button
      height: 48, // Reduced from 56
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 18,
    },
    footerText: {
      color: theme.textSecondary,
      fontSize: 15,
    },
    footerLink: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: 'bold',
    },
  });