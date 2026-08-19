import Loader from '@/components/ui/loader';
import { Typography } from '@/components/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import type { EmployeePunchCompany } from '@repo/types';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEmployeeAttendanceContext, useEmployeePunchAttendance } from '../api';

export default function EmployeeAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const [employmentId, setEmploymentId] = useState<string | undefined>(undefined);
  const { data, isLoading, isFetching, refetch, error } = useEmployeeAttendanceContext(employmentId);
  const punch = useEmployeePunchAttendance();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.selected?.employment_id && data.selected.employment_id !== employmentId) {
      setEmploymentId(data.selected.employment_id);
    }
  }, [data?.selected?.employment_id, employmentId]);

  const isPunchIn = data?.mode === 'punch_in';
  const isPunchOut = data?.mode === 'punch_out';
  const accent = isPunchOut ? '#EA580C' : '#16A34A';
  const accentSoft = isPunchOut ? '#FFF4E8' : '#E8F8EE';
  const actionLabel = isPunchIn ? 'PUNCH IN' : 'PUNCH OUT';

  const onSelectCompany = (company: EmployeePunchCompany) => {
    setEmploymentId(company.employment_id);
    setLocalError(null);
  };

  const onPunch = async () => {
    if (!data?.selected) return;
    setLocalError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocalError('Location permission is required to mark attendance.');
        return;
      }

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout. Try again outdoors.')), 12000),
      );
      const location = await Promise.race([locationPromise, timeoutPromise]);

      await punch.mutateAsync({
        employment_id: data.selected.employment_id,
        action: isPunchIn ? 'in' : 'out',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not punch attendance.');
    }
  };

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <Loader message="Loading attendance…" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centered}>
        <Typography variant="body" style={styles.muted}>
          {error instanceof Error ? error.message : 'Could not load attendance.'}
        </Typography>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showPicker = data?.mode === 'select_company' || (data && data.companies.length > 1 && !data.selected);
  const canPunch = (isPunchIn || isPunchOut) && !punch.isPending;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {data && data.companies.length > 1 ? (
          <View style={styles.companyList}>
            <Text style={styles.sectionLabel}>Company</Text>
            {data.companies.map((company) => {
              const selected = data.selected?.employment_id === company.employment_id;
              return (
                <Pressable
                  key={company.employment_id}
                  onPress={() => onSelectCompany(company)}
                  style={[styles.companyCard, selected && styles.companyCardSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyName}>{company.company_name}</Text>
                    {company.branch_name ? (
                      <Text style={styles.companyBranch}>{company.branch_name}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selected ? '#0D5EBA' : '#9CA3AF'}
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {showPicker && data.companies.length > 1 ? (
          <Text style={styles.helper}>Select a company to continue.</Text>
        ) : null}

        {data?.selected ? (
          <>
            <View style={[styles.statusCard, { backgroundColor: data.mode === 'blocked' ? '#F3F4F6' : accentSoft }]}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: data.mode === 'blocked' ? '#E5E7EB' : accent },
                ]}
              >
                <Ionicons
                  name={
                    data.mode === 'punch_out'
                      ? 'exit-outline'
                      : data.mode === 'completed'
                        ? 'checkmark-circle-outline'
                        : data.mode === 'blocked'
                          ? 'close-circle-outline'
                          : 'enter-outline'
                  }
                  size={22}
                  color="#fff"
                />
              </View>
              <Text
                style={[
                  styles.statusTitle,
                  { color: data.mode === 'blocked' ? '#374151' : accent },
                ]}
              >
                {data.mode === 'punch_out'
                  ? 'Punch Out'
                  : data.mode === 'completed'
                    ? 'Attendance marked'
                    : data.mode === 'blocked'
                      ? 'Punch unavailable'
                      : 'Punch In'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {data.mode === 'punch_out'
                  ? 'Mark your out-time attendance.'
                  : data.mode === 'completed'
                    ? `In ${data.attendance.check_in ?? '—'} · Out ${data.attendance.check_out ?? '—'}`
                    : data.mode === 'blocked'
                      ? data.punch_blocked_reason
                      : 'Mark your in-time attendance.'}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Shift Details</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailCard}>
                <Ionicons name="calendar-outline" size={18} color={accent} />
                <View>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{data.date_label}</Text>
                </View>
              </View>
              <View style={styles.detailCard}>
                <Ionicons name="time-outline" size={18} color={accent} />
                <View>
                  <Text style={styles.detailLabel}>Shift Time</Text>
                  <Text style={styles.detailValue}>{data.shift?.label ?? 'Not assigned'}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
      </ScrollView>

      {data?.selected ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {(isPunchIn || isPunchOut) && (
            <Pressable
              disabled={!canPunch || isFetching}
              onPress={onPunch}
              style={({ pressed }) => [
                styles.punchButton,
                { backgroundColor: accent, opacity: !canPunch || isFetching ? 0.6 : pressed ? 0.9 : 1 },
              ]}
            >
              <Ionicons name="finger-print" size={22} color="#fff" />
              <Text style={styles.punchButtonText}>
                {punch.isPending ? 'Verifying location…' : actionLabel}
              </Text>
            </Pressable>
          )}
          <View style={styles.disclaimer}>
            <Ionicons name="shield-checkmark" size={16} color={accent} />
            <Text style={[styles.disclaimerText, { color: accent }]}>
              Your location will be captured
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16, gap: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { color: '#6B7280', textAlign: 'center' },
  retry: {
    marginTop: 12,
    backgroundColor: '#0D5EBA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  companyList: { gap: 8 },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  companyCardSelected: {
    borderColor: '#0D5EBA',
    backgroundColor: '#F0F6FF',
  },
  companyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  companyBranch: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  helper: { color: '#6B7280', fontSize: 13 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusCard: {
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusTitle: { fontSize: 22, fontWeight: '800' },
  statusSubtitle: { fontSize: 14, color: '#4B5563', textAlign: 'center' },
  detailRow: { gap: 10 },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  detailLabel: { fontSize: 12, color: '#6B7280' },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#F8F9FA',
    gap: 10,
  },
  punchButton: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  punchButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.6 },
  disclaimer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  disclaimerText: { fontSize: 13, fontWeight: '600' },
});
