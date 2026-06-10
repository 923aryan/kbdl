import Security from '@/assets/icons/security.svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuth';
// Adjust this import path based on your project structure
import { Colors } from '@/constants/theme';
import { useVerifyRegisterUser } from '../api';

export default function OtpVerificationScreen() {
  const colorScheme = useColorScheme();
  const phone = useAuthStore((state) => state.registerData.phone_no);
  const router = useRouter();
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const { mutate: verifyOtp, isPending } = useVerifyRegisterUser();
  const { signIn } = useAuthStore();

  // State to hold the 6 OTP digits
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Handle OTP input change and auto-focus next input
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length !== 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to focus previous input
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    verifyOtp(
      { phone_no: phone, otp: otpString },
      {
        onSuccess: async (res) => {
          console.log('OTP Verified successfully', res);
          await signIn({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            user: res.user,
          });
          router.replace('/(tabs)');
        },
        onError: (err) => {
          console.error('OTP Verification failed', err);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Main Content Section */}
          <View style={styles.contentSection}>
            {/* Security Image */}
            <View style={styles.imageContainer}>
              <Security width={styles.securityImage.width} height={styles.securityImage.height} />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>We have sent a 6-digit OTP to</Text>
            <Text style={styles.phoneNumber}>+91 {phone}</Text>

            {/* OTP Input Boxes */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    // Highlight border if input has a value or is active (simplified logic)
                    digit !== '' ? styles.otpInputActive : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend Timer */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Resend OTP in </Text>
              <Text style={styles.resendTimer}>00:45</Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, otp.join('').length !== 6 && { opacity: 0.7 }]}
              activeOpacity={0.8}
              onPress={handleVerify}
              disabled={isPending || otp.join('').length !== 6}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
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
    header: {
      paddingHorizontal: 16,
    },
    backButton: {
      padding: 8,
      marginLeft: -8, // Offset padding to align icon with edge
    },
    contentSection: {
      paddingHorizontal: 24,
      alignItems: 'center', // Centers text and image horizontally
    },
    imageContainer: {
      marginTop: 20,
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityImage: {
      width: 140,
      height: 140,
    },
    title: {
      color: theme.text,
      fontSize: 26,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 4,
    },
    phoneNumber: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 32,
    },
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 10,
      marginBottom: 32,
    },
    otpInput: {
      width: 45,
      height: 55,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      backgroundColor: theme.card,
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
    },
    otpInputActive: {
      borderColor: theme.primary,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 24,
    },
    resendText: {
      color: theme.textSecondary,
      fontSize: 15,
    },
    resendTimer: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    verifyButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      height: 48,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    verifyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
