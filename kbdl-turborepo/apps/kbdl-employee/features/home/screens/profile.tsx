import CustomButton from '@/components/ui/button';
import CustomInput from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { LANGUAGES } from '@/constants/languages';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { useUpdateProfile } from '@/features/profile/api';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Profile() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const { user, status, signOut, updateUser } = useAuthStore();
  const [isLangModalVisible, setLangModalVisible] = useState(false);
  const [isEditProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '', experience: '', skills: '' });
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();

  const handleAuthAction = async () => {
    if (status === 'authenticated') {
      await signOut();
    } else {
      router.push('/auth/login');
    }
  };

  const currentLangCode = user?.preferences?.language || 'en-IN';

  const onChangeLanguage = (langCode: string) => {
    const preferences = {
      theme: (user?.preferences?.theme || 'system') as 'light' | 'dark' | 'system',
      language: langCode,
    };

    updateUser({
      preferences,
    });
    setLangModalVisible(false);

    // Sync language preference up to the server
    updateProfile({ preferences });
  };

  const isExtraShiftEnabled = (user as any)?.extra_shift || false;

  const toggleExtraShift = (value: boolean) => {
    // Optimistic update
    updateUser({ extra_shift: value } as any);

    updateProfile(
      { extra_shift: value },
      {
        onSuccess: () => {
          Toast.show({
            text1: 'Extra shift preference updated!',
            type: 'success',
          });
        },
        onError: () => {
          // Rollback on error
          updateUser({ extra_shift: !value } as any);
          Toast.show({
            text1: 'Failed to update preference',
            type: 'error',
          });
        },
      },
    );
  };

  const openEditProfile = () => {
    setEditForm({
      name: user?.name || '',
      city: (user as any)?.city || '',
      experience: (user as any)?.experience?.toString() || '',
      skills: (user as any)?.skills?.join(', ') || '',
    });
    setEditProfileModalVisible(true);
  };

  const handleProfileUpdate = () => {
    const payload: any = {};
    if (editForm.name !== undefined) payload.name = editForm.name;
    if (editForm.city !== undefined) payload.city = editForm.city;

    if (editForm.experience) {
      const exp = parseInt(editForm.experience, 10);
      if (!isNaN(exp)) {
        payload.experience = exp;
      }
    }
    if (editForm.skills !== undefined) {
      payload.skills = editForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    updateProfile(payload, {
      onSuccess: () => {
        updateUser(payload);
        Toast.show({
          text1: 'Profile updated successfully!',
          type: 'success',
        });
        setEditProfileModalVisible(false);
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h2" style={{ color: theme.text }}>
            Profile
          </Typography>
        </View>

        {status === 'authenticated' && user ? (
          <View style={styles.content}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '15' }]}>
              <Typography variant="h1" style={{ color: theme.primary, marginTop: 4 }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Typography>
            </View>

            <Typography variant="h3" style={[styles.userName, { color: theme.text }]}>
              {user.name || 'User'}
            </Typography>
            <Typography variant="body" style={[styles.userPhone, { color: theme.textSecondary }]}>
              {user.phone_no || 'N/A'}
            </Typography>

            <View style={styles.settingsSection}>
              <Typography variant="h3" style={[styles.sectionTitle, { color: theme.text }]}>
                Settings
              </Typography>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openEditProfile}
                style={[
                  styles.settingRow,
                  { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12 },
                ]}
              >
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                    <Feather name="user" size={20} color={theme.primary} />
                  </View>
                  <Typography variant="body" style={{ color: theme.text, marginLeft: 12 }}>
                    Edit Profile
                  </Typography>
                </View>
                <View style={styles.settingRowRight}>
                  <Feather name="chevron-right" size={20} color={theme.icon} />
                </View>
              </TouchableOpacity>

              <View
                style={[
                  styles.settingRow,
                  { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12 },
                ]}
              >
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                    <Feather name="clock" size={20} color={theme.primary} />
                  </View>
                  <Typography variant="body" style={{ color: theme.text, marginLeft: 12 }}>
                    Extra Shifts
                  </Typography>
                </View>
                <View style={styles.settingRowRight}>
                  <Switch
                    value={isExtraShiftEnabled}
                    onValueChange={toggleExtraShift}
                    trackColor={{ false: theme.border, true: theme.primary }}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLangModalVisible(true)}
                style={[
                  styles.settingRow,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.primary + '10' }]}>
                    <Feather name="globe" size={20} color={theme.primary} />
                  </View>
                  <Typography variant="body" style={{ color: theme.text, marginLeft: 12 }}>
                    Language
                  </Typography>
                </View>
                <View style={styles.settingRowRight}>
                  <Typography
                    variant="bodySmall"
                    style={{ color: theme.textSecondary, marginRight: 8 }}
                  >
                    {LANGUAGES.find((l) => l.code === currentLangCode)?.label || 'English'}
                  </Typography>
                  <Feather name="chevron-right" size={20} color={theme.icon} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Typography variant="h3" style={[styles.title, { color: theme.text }]}>
              Not Logged In
            </Typography>
            <Typography variant="body" style={[styles.description, { color: theme.textSecondary }]}>
              Please log in to view your profile details.
            </Typography>
          </View>
        )}

        <View style={styles.footer}>
          <CustomButton
            title={status === 'authenticated' ? 'Logout' : 'Login'}
            onPress={handleAuthAction}
            variant={status === 'authenticated' ? 'outline' : 'primary'}
            leftIcon={
              status === 'authenticated' ? (
                <Feather name="log-out" size={18} color={theme.text} />
              ) : undefined
            }
          />
        </View>
      </ScrollView>

      <Modal
        visible={isLangModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.background,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <Typography variant="h3" style={[styles.modalTitle, { color: theme.text }]}>
              Select Language
            </Typography>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.modalOption, { borderBottomColor: theme.border }]}
                onPress={() => onChangeLanguage(lang.code)}
              >
                <Typography
                  variant="body"
                  style={{
                    color: currentLangCode === lang.code ? theme.primary : theme.text,
                    fontWeight: currentLangCode === lang.code ? '600' : 'normal',
                  }}
                >
                  {lang.label}
                </Typography>
                {currentLangCode === lang.code && (
                  <Feather name="check" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isEditProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditProfileModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.background,
                maxHeight: '85%',
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View style={styles.modalHeader}>
                <Typography variant="h3" style={{ color: theme.text }}>
                  Edit Profile
                </Typography>
                <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                  <Feather name="x" size={24} color={theme.icon} />
                </TouchableOpacity>
              </View>

              <CustomInput
                label="Full Name"
                placeholder="Enter your name"
                value={editForm.name}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                icon={<Feather name="user" size={18} color={theme.icon} />}
              />
              <CustomInput
                label="City"
                placeholder="Enter your city"
                value={editForm.city}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, city: text }))}
                icon={<Feather name="map-pin" size={18} color={theme.icon} />}
              />
              <CustomInput
                label="Experience (Years)"
                placeholder="e.g. 3"
                keyboardType="numeric"
                value={editForm.experience}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, experience: text }))}
                icon={<Feather name="briefcase" size={18} color={theme.icon} />}
              />
              <CustomInput
                label="Skills (comma separated)"
                placeholder="e.g. Welder, Forklift"
                value={editForm.skills}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, skills: text }))}
                icon={<Feather name="tool" size={18} color={theme.icon} />}
              />

              <CustomButton
                title="Save Changes"
                onPress={handleProfileUpdate}
                loading={isUpdatingProfile}
                containerStyle={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    marginBottom: 4,
  },
  userPhone: {
    marginBottom: 32,
  },
  settingsSection: {
    width: '100%',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
});
