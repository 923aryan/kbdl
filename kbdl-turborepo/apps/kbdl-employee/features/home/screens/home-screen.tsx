import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import BlueCollars from '@/assets/images/blue-collars.svg';
import CompleteProfile from '@/assets/images/complete-your-profile.svg';
import EmployeesImage from '@/assets/images/employees-image.svg';
import FindJobChair from '@/assets/images/find-job-chair.svg';
import NearbyJobs from '@/assets/images/nearby-jobs.svg';
import ShiftsIcon from '@/assets/images/shifts.svg';
import TimelyPayment from '@/assets/images/timely-payment.svg';
import VerifiedEmployers from '@/assets/images/verified-employers.svg';
import { Colors } from '@/constants/theme';
import { useGetPendingEmployments } from '@/features/operations/hooks/use-operation-hook';
import { useGetOpenShifts } from '@/features/shift-swap/api';
import translations from '@/translations';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, status } = useAuthStore();
  const selectedLanguage = user?.preferences?.language || 'en-IN';
  const isHindi = selectedLanguage.startsWith('hi');
  const t = isHindi ? translations.hi : translations.en;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const [hideProfileBanner, setHideProfileBanner] = useState(false);
  const { data, isLoading: isLoadingShifts } = useGetOpenShifts();
  const { data: pendingEmployments, isLoading: isLoadingEmployments } = useGetPendingEmployments();
  const name = user?.name || user?.phone_no || 'Alok';

  // Check if skills exist and contain at least one non-empty string
  const hasSkills = user?.skills && user.skills.some((skill) => skill.trim() !== '');
  const showProfileBanner = !hasSkills && !hideProfileBanner;

  const jobsCount = pendingEmployments?.length || 0;
  const shiftsCount = data?.length || 0;
  const updateMessageParts = [];
  if (jobsCount > 0) updateMessageParts.push(`${jobsCount}${t.jobRequests}`);
  if (shiftsCount > 0) updateMessageParts.push(`${shiftsCount}${t.shiftsText}`);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: 10 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View>
              {status === 'authenticated' && (
                <Text style={[styles.greetingText, { color: theme.text }]}>
                  <Text style={{ fontWeight: '500', color: theme.primary }}>{t.hello}, </Text>
                  <Text style={{ color: theme.primary }}>{name}</Text> 👋
                </Text>
              )}
              {/* <TouchableOpacity style={styles.locationRow}>
                <Ionicons name="navigate" size={12} color="#000" />
                <Text style={styles.locationText}>{t.locationText}</Text>
                <Ionicons name="chevron-down" size={12} color="#6B7280" />
              </TouchableOpacity> */}
            </View>
          </View>
          <TouchableOpacity>
            {/* <Ionicons name="menu" size={28} color="#000" /> */}
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroTextContent}>
            <Text style={styles.heroTitle}>
              {t.heroTitlePart1}
              <Text style={styles.heroTitleUnderline}>{t.heroTitlePart2}</Text>
              {t.heroTitlePart3}
            </Text>
            <Text style={styles.heroSubtitle}>{t.heroSubtitle}</Text>
          </View>
          {/* Render Image with Absolute Positioning */}
          <EmployeesImage style={styles.heroImage} width={160} height={180} />
        </View>

        {/* Feeds / Notifications Summary Card */}
        {!isLoadingShifts &&
        !isLoadingEmployments &&
        ((data && data.length > 0) || (pendingEmployments && pendingEmployments.length > 0)) ? (
          <View style={[styles.mainCard, { backgroundColor: '#FFFBEB' }]}>
            <View style={styles.mainCardTop}>
              <View style={styles.mainCardTextContainer}>
                <Text style={styles.cardTitle}>{t.recentUpdates}</Text>
                <Text style={styles.cardSubtitle}>
                  {t.youHave}
                  {updateMessageParts.join(t.and)}
                  {t.available}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: '#D97706', overflow: 'hidden' },
              ]}
              onPress={() => router.push('/notifications')}
            >
              {({ pressed }) => (
                <>
                  {pressed && <View style={styles.darkOverlay} />}
                  <Text style={styles.actionButtonText}>{t.viewNotifications}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Shifts Card */}
        <View style={[styles.mainCard, { backgroundColor: '#F8F4FF' }]}>
          <View style={styles.mainCardTop}>
            {/* Constrain text width so it doesn't overlap the image */}
            <View style={styles.mainCardTextContainer}>
              <Text style={styles.cardTitle}>{t.shiftsCardTitle}</Text>
              <Text style={styles.cardSubtitle}>{t.shiftsCardSubtitle}</Text>
            </View>
            {/* Big Illustration on the right */}
            <ShiftsIcon style={styles.shiftsIllustration} width={70} height={70} />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: '#9333EA', overflow: 'hidden' },
            ]}
            onPress={() => router.push('/shift-swap')}
          >
            {({ pressed }) => (
              <>
                {pressed && <View style={styles.darkOverlay} />}
                <Text style={styles.actionButtonText}>{t.exploreShifts}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>

        {/* Find Job Card */}
        <View style={[styles.mainCard, { backgroundColor: '#F0F6FF' }]}>
          <View style={styles.mainCardTop}>
            {/* Constrain text width so it doesn't overlap the image */}
            <View style={styles.mainCardTextContainer}>
              <Text style={styles.cardTitle}>{t.findJobCardTitle}</Text>
              <Text style={styles.cardSubtitle}>{t.findJobCardSubtitle}</Text>
            </View>
            {/* Chair Illustration on the right */}
            <FindJobChair style={styles.jobIllustration} width={60} height={72} />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: '#0D5EBA', overflow: 'hidden' },
            ]}
            onPress={() => router.push('/jobs/find-jobs')}
          >
            {({ pressed }) => (
              <>
                {pressed && <View style={styles.darkOverlay} />}
                <Text style={styles.actionButtonText}>{t.findJobs}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>

        {/* Complete Profile Banner */}
        {showProfileBanner && (
          <TouchableOpacity
            style={styles.profileBanner}
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
          >
            <CompleteProfile style={styles.profileImage} width={60} height={60} />
            <View style={styles.profileTextContent}>
              <View style={styles.profileHeaderRow}>
                <Text style={styles.profileTitle}>{t.completeProfileTitle}</Text>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => setHideProfileBanner(true)}
                >
                  <Ionicons name="close" size={18} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.profileSubtitle}>{t.completeProfileSubtitle}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Features Grid */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <VerifiedEmployers width={20} height={20} />
            </View>
            <Text style={styles.featureTitle}>{t.verifiedEmployers}</Text>
            {/* <Text style={styles.featureSubtitle}>Trusted & safe workplace</Text> */}
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#FFF7ED' }]}>
              <TimelyPayment width={20} height={20} />
            </View>
            <Text style={styles.featureTitle}>{t.timelyPayment}</Text>
            {/* <Text style={styles.featureSubtitle}>Get paid on time, always</Text> */}
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#F5F3FF' }]}>
              <NearbyJobs width={20} height={20} />
            </View>
            <Text style={styles.featureTitle}>{t.nearbyJobs}</Text>
            {/* <Text style={styles.featureSubtitle}>Work close to home</Text> */}
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.featureItem}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <BlueCollars width={20} height={20} />
            </View>
            <Text style={styles.featureTitle}>{t.blueCollarHeroes}</Text>
            {/* <Text style={styles.featureSubtitle}>Built for your hard work</Text> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  /* Header Styles */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#4B5563',
  },

  /* Hero Section Styles */
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 120,
    position: 'relative',
    zIndex: 10,
  },
  heroTextContent: {
    width: '55%', // Restricts text width so it doesn't cross over the image
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 32,
  },
  heroTitleUnderline: {
    textDecorationLine: 'underline',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  heroImage: {
    position: 'absolute',
    right: 0,
    bottom: -35,
    zIndex: 1,
  },

  /* Main Cards Styles (Shifts & Jobs) */
  mainCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    zIndex: 4499,
  },
  mainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  mainCardTextContainer: {
    width: '70%', // Restricts text width to leave space for right-side illustration
    zIndex: 2,
  },
  cardIcon: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  shiftsIllustration: {
    zIndex: 1,
  },
  jobIllustration: {
    zIndex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },

  /* Profile Banner Styles */
  profileBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  profileImage: {
    marginRight: 12,
  },
  profileTextContent: {
    flex: 1,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  /* Features Grid Styles */
  featuresCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 28,
  },
  featureSubtitle: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 12,
  },
  verticalDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
});
