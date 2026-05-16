import Security from '@/assets/icons/security.svg';
import { Colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVerifyUserOTP } from '../api';
import { useAuthStore } from '../hooks/useAuth';

export default function VerifyLoginOtpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { signIn } = useAuthStore();
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const router = useRouter();

  // Get the phone number passed from the login screen
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { mutate: verifyOtp, isPending } = useVerifyUserOTP();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length !== 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6 || !phone) return;

    verifyOtp(
      { phone, otp: otpString },
      {
        onSuccess: async (res) => {
          console.log('Login OTP Verified successfully', res);
          await signIn({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            user: res.user,
          });
          router.replace('/(public)/(tabs)');
        },
        onError: (err) => {
          console.error('Login OTP Verification failed', err);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.imageContainer}>
              <Security width={styles.securityImage.width} height={styles.securityImage.height} />
            </View>

            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>We have sent a 6-digit OTP to</Text>
            <Text style={styles.phoneNumber}>{phone || 'Unknown number'}</Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
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

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Resend OTP in </Text>
              <Text style={styles.resendTimer}>00:45</Text>
            </View>

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

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    keyboardView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: { paddingHorizontal: 16 },
    backButton: { padding: 8, marginLeft: -8 },
    contentSection: { paddingHorizontal: 24, alignItems: 'center' },
    imageContainer: { marginTop: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
    securityImage: { width: 140, height: 140 },
    title: { color: theme.text, fontSize: 26, fontWeight: '700', marginBottom: 8 },
    subtitle: { color: theme.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 4 },
    phoneNumber: { color: theme.primary, fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
    otpContainer: {
      flexDirection: 'row', justifyContent: 'space-between', width: '100%',
      paddingHorizontal: 10, marginBottom: 32,
    },
    otpInput: {
      width: 45, height: 55, borderWidth: 1, borderColor: theme.border,
      borderRadius: 10, backgroundColor: theme.card, textAlign: 'center',
      fontSize: 20, fontWeight: '600', color: theme.text,
    },
    otpInputActive: { borderColor: theme.primary },
    resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
    resendText: { color: theme.textSecondary, fontSize: 15 },
    resendTimer: { color: theme.primary, fontSize: 15, fontWeight: '700' },
    verifyButton: {
      backgroundColor: theme.primary, borderRadius: 10, height: 48, width: '100%',
      alignItems: 'center', justifyContent: 'center', shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
      shadowRadius: 2, elevation: 2,
    },
    verifyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  });