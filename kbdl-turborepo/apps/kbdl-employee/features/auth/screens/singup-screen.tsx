import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
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

// Adjust this import path based on your project structure
import { Colors } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignupScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} >

          {/* Header Image Section */}
          < Image
            source={require('@/assets/images/at-login.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />

          {/* Form Section */}
          < View style={styles.formSection} >

            {/* Name Input */}
            < View style={styles.inputContainer} >
              <Text style={styles.inputLabel}>
                Enter Name
              </Text>
              < View style={styles.inputWrapper} >
                <Feather name="user" size={20} color={theme.icon} />
                <View style={styles.divider} />
                < TextInput
                  style={styles.textInput}
                  placeholder="Exp: Ramesh Kumar"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            {/* Mobile Number Input */}
            <View style={styles.inputContainerLarge}>
              <Text style={styles.inputLabel}>
                Enter Mobile Number
              </Text>
              < View style={styles.inputWrapper} >
                <Feather name="smartphone" size={20} color={theme.icon} />
                <Text style={styles.countryCode}>
                  +91
                </Text>
                < View style={styles.divider} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Exp: 8360170..."
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                OTP Bhejo
              </Text>
            </TouchableOpacity>

            {/* Bottom Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Pehle se account hai, {' '}
              </Text>
              < TouchableOpacity activeOpacity={0.7} >
                <Text style={styles.footerLink}>
                  Login Kro
                </Text>
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
      flexGrow: 1,
    },
    headerImage: {
      backgroundColor: "red",
      width: '100%',
      height: SCREEN_HEIGHT * 0.35, // Translates h-[35vh]
    },
    formSection: {
      paddingHorizontal: 24,
      marginTop: 16,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputContainerLarge: {
      marginBottom: 32,
    },
    inputLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
      backgroundColor: theme.card,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: theme.border,
      marginHorizontal: 12,
    },
    textInput: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
    },
    countryCode: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2, // For Android shadow
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    footerLink: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });