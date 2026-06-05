import { Colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSendOtpSchema } from '@repo/validator/shared';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import translations from '../../../translations';
import { useSendUserOTP } from '../api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const formSchema = userSendOtpSchema.shape.body;
type FormData = z.input<typeof formSchema>;

export default function LoginScreen() {
  console.log('this is login');
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const router = useRouter();
  const { mutate: sendOtp, isPending } = useSendUserOTP();

  // Using local state for language on this screen (sync with your store if needed)
  const [selectedLanguage] = useState('en-IN');
  const isHindi = selectedLanguage?.startsWith('hi');
  const t = isHindi ? translations.hi : translations.en;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '+91',
    },
  });

  const onSubmit = (data: FormData) => {
    sendOtp(data as any, {
      onSuccess: (res) => {
        console.log('OTP sent successfully', res);
        // Pass the phone number directly via params to the verify screen
        router.push({
          pathname: '/auth/verify-login-otp',
          params: { phone: data.phone },
        });
      },
      onError: (err) => {
        Toast.show({
          text1: err.message,
          type: 'error',
        });
        // console.error('Failed to send OTP', err);
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Header Image Section */}
          <Image
            source={require('@/assets/images/at-login.png')}
            style={styles.headerImage}
            resizeMode="cover"
          />

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Mobile Number Input */}
            <View style={styles.inputContainerLarge}>
              <Text style={styles.inputLabel}>{t.enterMobileNumber || 'Enter Mobile Number'}</Text>

              {/* NOTE: Replace this raw TextInput wrapper with your custom <Input /> component from `ui` if preferred */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                      <Feather name="smartphone" size={20} color={theme.icon} />
                      <Text style={styles.countryCode}>+91</Text>
                      <View style={styles.divider} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={t.expMobile || 'e.g. 9876543210'}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onBlur={onBlur}
                        onChangeText={(text) => {
                          // Only allow numeric input to form the actual phone
                          const numericText = text.replace(/[^0-9]/g, '');
                          onChange(`+91${numericText}`);
                        }}
                        // Strip +91 out from displaying in the Input so the UI feels fluid
                        value={value ? value.replace(/^\+91/, '') : ''}
                      />
                    </View>
                    {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                  </>
                )}
              />
            </View>

            {/* Submit Button */}
            {/* NOTE: Replace this with your custom <Button /> from `ui` if preferred */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{t.sendOtp || 'Send OTP'}</Text>
              )}
            </TouchableOpacity>

            {/* Bottom Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t.dontHaveAccount || "Don't have an account? "}
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/auth/register')}>
                <Text style={styles.footerLink}>{t.registerNow || 'Sign up now'}</Text>
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
    safeArea: { flex: 1, backgroundColor: theme.background },
    keyboardView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    headerImage: { width: '100%', height: SCREEN_HEIGHT * 0.3 },
    formSection: { paddingHorizontal: 24, marginTop: 12 },
    inputContainerLarge: { marginBottom: 20 },
    inputLabel: { color: theme.text, fontSize: 13, fontWeight: '500', marginBottom: 6 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      height: 48,
      backgroundColor: theme.card,
    },
    divider: { width: 1, height: 20, backgroundColor: theme.border, marginHorizontal: 10 },
    textInput: { flex: 1, color: theme.text, fontSize: 15 },
    inputError: { borderColor: 'red' },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },
    countryCode: { color: theme.text, fontSize: 15, fontWeight: '500', marginLeft: 6 },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
    footerText: { color: theme.textSecondary, fontSize: 15 },
    footerLink: { color: theme.primary, fontSize: 15, fontWeight: 'bold' },
  });
