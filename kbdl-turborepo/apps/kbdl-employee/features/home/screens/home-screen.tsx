import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BlueCollars from '@/assets/images/blue-collars.svg';
import CompleteProfile from '@/assets/images/complete-your-profile.svg';
import EmployeesImage from '@/assets/images/employees-image.svg';
import FindJobChair from '@/assets/images/find-job-chair.svg';
import FindJobIcon from '@/assets/images/find-job.svg';
import NearbyJobs from '@/assets/images/nearby-jobs.svg';
import ShiftsCalendar from '@/assets/images/shifts-calendar.svg';
import ShiftsIcon from '@/assets/images/shifts.svg';
import TimelyPayment from '@/assets/images/timely-payment.svg';
import VerifiedEmployers from '@/assets/images/verified-employers.svg';
import Loader from '@/components/ui/loader';
import OnboardRequestCard from '@/components/ui/onboard-request-card';
import ShiftCard from '@/components/ui/shift-swap-card';
import { useGetPendingEmployments } from '@/features/operations/hooks/use-operation-hook';
import { useGetOpenShifts } from '@/features/shift-swap/api';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuthStore();
  const [hideProfileBanner, setHideProfileBanner] = useState(false);
  const { data, isLoading: isLoadingShifts } = useGetOpenShifts();
  const { data: pendingEmployments, isLoading: isLoadingEmployments } = useGetPendingEmployments();
  const setShifts = useShiftSwapStore((s) => s.setShifts);
  const scrollViewRef = useRef<ScrollView>(null);
  const name = user?.name || user?.phone_no || 'Alok';

  // Check if skills exist and contain at least one non-empty string
  const hasSkills = user?.skills && user.skills.some((skill) => skill.trim() !== '');
  const showProfileBanner = !hasSkills && !hideProfileBanner;

  useEffect(() => {
    if (data) {
      console.log('shfits : ', data);
      setShifts(data);
    }
  }, [data, setShifts]);

  // Bounce animation effect to indicate scrollability
  useEffect(() => {
    if (data && data.length > 1) {
      const scrollDownTimeout = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 50, animated: true });

        const scrollUpTimeout = setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 400);

        return () => clearTimeout(scrollUpTimeout);
      }, 600); // 600ms delay gives the user a moment to see the screen first

      return () => clearTimeout(scrollDownTimeout);
    }
  }, [data]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.greetingText}>Hello {name}</Text>
            <TouchableOpacity style={styles.locationRow}>
              <Ionicons name="navigate" size={12} color="#000" />
              <Text style={styles.locationText}>Chandig...</Text>
              <Ionicons name="chevron-down" size={12} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroTextContent}>
          <Text style={styles.heroTitle}>
            Har din Kaam,{'\n'}
            <Text style={styles.heroTitleUnderline}>Behtar</Text> kal.
          </Text>
          <Text style={styles.heroSubtitle}>
            Trusted shifts and jobs for skilled people like you
          </Text>
        </View>
        {/* Render Image with Absolute Positioning */}
        <EmployeesImage style={styles.heroImage} width={160} height={180} />
      </View>

      {/* Onboard Requests List */}
      {isLoadingEmployments ? (
        <View style={styles.shiftListContainer}>
          <Loader />
        </View>
      ) : (
        pendingEmployments &&
        pendingEmployments.length > 0 && (
          <View style={styles.shiftListContainer}>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {pendingEmployments.map((employment) => (
                <OnboardRequestCard key={employment.id} employment={employment} />
              ))}
            </ScrollView>
          </View>
        )
      )}

      {/* Shift Cards List */}
      <View style={styles.shiftListContainer}>
        {isLoadingShifts ? (
          <Loader />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {data?.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} buttonTitle="Notification" />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Shifts Card */}
      <View style={[styles.mainCard, { backgroundColor: '#F8F4FF' }]}>
        <View style={styles.mainCardTop}>
          {/* Constrain text width so it doesn't overlap the image */}
          <View style={styles.mainCardTextContainer}>
            <ShiftsCalendar style={styles.cardIcon} width={48} height={48} />
            <Text style={styles.cardTitle}>Shifts</Text>
            <Text style={styles.cardSubtitle}>Find nearby shifts that fit your time.</Text>
          </View>
          {/* Big Illustration on the right */}
          <ShiftsIcon style={styles.shiftsIllustration} width={130} height={130} />
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9333EA' }]}
          onPress={() => router.push('/shift-swap')}
        >
          <Text style={styles.actionButtonText}>Explore Shifts</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Find Job Card */}
      <View style={[styles.mainCard, { backgroundColor: '#F0F6FF' }]}>
        <View style={styles.mainCardTop}>
          {/* Constrain text width so it doesn't overlap the image */}
          <View style={styles.mainCardTextContainer}>
            <FindJobIcon style={styles.cardIcon} width={48} height={48} />
            <Text style={styles.cardTitle}>Find Job</Text>
            <Text style={styles.cardSubtitle}>Find the right job for your skills.</Text>
          </View>
          {/* Chair Illustration on the right */}
          <FindJobChair style={styles.jobIllustration} width={100} height={120} />
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#0D5EBA' }]}
          onPress={() => router.push('/jobs/find-jobs')}
        >
          <Text style={styles.actionButtonText}>Find Jobs</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
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
              <Text style={styles.profileTitle}>Complete your profile</Text>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setHideProfileBanner(true)}
              >
                <Ionicons name="close" size={18} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileSubtitle}>
              Add your skills and experience to get better matches.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Features Grid */}
      <View style={styles.featuresCard}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <VerifiedEmployers width={20} height={20} />
          </View>
          <Text style={styles.featureTitle}>Verified Employers</Text>
          <Text style={styles.featureSubtitle}>Trusted & safe workplace</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.featureItem}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#FFF7ED' }]}>
            <TimelyPayment width={20} height={20} />
          </View>
          <Text style={styles.featureTitle}>Timely Payment</Text>
          <Text style={styles.featureSubtitle}>Get paid on time, always</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.featureItem}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#F5F3FF' }]}>
            <NearbyJobs width={20} height={20} />
          </View>
          <Text style={styles.featureTitle}>Nearby Jobs</Text>
          <Text style={styles.featureSubtitle}>Work close to home</Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.featureItem}>
          <View style={[styles.featureIconContainer, { backgroundColor: '#EFF6FF' }]}>
            <BlueCollars width={20} height={20} />
          </View>
          <Text style={styles.featureTitle}>For Blue collar Heroes</Text>
          <Text style={styles.featureSubtitle}>Built for your hard work</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  shiftListContainer: {
    paddingTop: 10,
    maxHeight: 250, // Sets the height to roughly show only one card at a time
    marginBottom: 10,
  },
  /* Header Styles */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
    marginBottom: 0,
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
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 4499,
  },
  mainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    minHeight: 110,
    position: 'relative',
  },
  mainCardTextContainer: {
    width: '55%', // Restricts text width to leave space for right-side illustration
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
    position: 'absolute',
    right: -15,
    bottom: -10,
    zIndex: 1,
  },
  jobIllustration: {
    position: 'absolute',
    right: -5,
    bottom: -15,
    zIndex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 20,
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
