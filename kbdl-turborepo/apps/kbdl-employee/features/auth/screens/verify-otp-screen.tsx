import Security from '@/assets/icons/security.svg';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Adjust this import path based on your project structure
import { Colors } from '@/constants/theme';

export default function OtpVerificationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  // State to hold the 4 OTP digits (Optional: useful for actual implementation)
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Handle OTP input change and auto-focus next input
  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length !== 0 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to focus previous input
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity activeOpacity={0.7} style={styles.backButton}>
              <Feather name="chevron-left" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Main Content Section */}
          <View style={styles.contentSection}>

            {/* Security Image */}
            <View style={styles.imageContainer}>
              <Security
                width={styles.securityImage.width}
                height={styles.securityImage.height}
              />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We have sent a 4-digit OTP to
            </Text>
            <Text style={styles.phoneNumber}>+91 8956473856</Text>

            {/* OTP Input Boxes */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
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
            <TouchableOpacity style={styles.verifyButton} activeOpacity={0.8}>
              <Text style={styles.verifyButtonText}>Verify</Text>
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
      width: 60,
      height: 65,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.card,
      textAlign: 'center',
      fontSize: 24,
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