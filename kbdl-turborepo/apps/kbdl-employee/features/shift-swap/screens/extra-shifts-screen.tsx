import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import DateTimePickerInput from '@/components/ui/date-time-picker';
import ErrorMessageBox from '@/components/ui/error-message-box';
import Loader from '@/components/ui/loader';
import { Colors } from '@/constants/theme';
import { getExtraShiftsSchema } from '@repo/validator/shared';
import CustomButton from '../../../components/ui/button';
import CustomInput from '../../../components/ui/input';
import ShiftCard from '../../../components/ui/shift-swap-card';
import { useGetExtraShifts } from '../api';
const formSchema = getExtraShiftsSchema.shape.query;
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export default function ExtraShiftScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);

  const [filterQuery, setFilterQuery] = useState<string | null>(null);
  const [locationMsg, setLocationMsg] = useState('Fetching location...');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      skill: '',
      date: undefined,
      latitude: 25.2467,
      longitude: 87.399434,
      limit: undefined,
      page: undefined,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationMsg('Location permission denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        setValue('latitude', lat);
        setValue('longitude', lon);

        const geocode = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const cityName =
            place.street ||
            place.name ||
            place.city ||
            place.district ||
            place.subregion ||
            place.region ||
            'Unknown Location';
          setLocationMsg(`${cityName} ✓`);
        } else {
          setLocationMsg('Location Fetched ✓');
        }
        console.log('fetched locaiton: ', `${lat}, ${lon}`);
      } catch (e) {
        setLocationMsg('Error fetching location');
      }
    })();
  }, [setValue]);

  const onSubmit = (data: FormOutput) => {
    const params = [];

    if (data.skill && data.skill.trim() !== '') {
      params.push(`skill=${encodeURIComponent(data.skill.trim())}`);
    }

    if (data.date) {
      const selectedDate = new Date(data.date);

      const utcDate = new Date(
        Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()),
      );

      params.push(`date=${encodeURIComponent(utcDate.toISOString())}`);
    }

    params.push(`limit=${data.limit ?? 10}`);
    params.push(`page=${data.page ?? 1}`);
    params.push(`latitude=${data.latitude}`);
    params.push(`longitude=${data.longitude}`);

    const finalQueryString = params.join('&');

    setFilterQuery(finalQueryString);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Extra Shifts</Text>
            <Text style={styles.subtitle}>Find and apply for extra shifts</Text>
          </View>

          <View style={styles.formSection}>
            <CustomInput
              label="Current Location:"
              placeholder="Fetching location..."
              icon={<Feather name="map-pin" size={18} color={theme.icon} />}
              value={locationMsg}
              editable={false}
            />

            <Controller
              control={control}
              name="skill"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Skill Required (Optional):"
                  placeholder="e.g. Forklift"
                  icon={<Feather name="tool" size={18} color={theme.icon} />}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ''}
                  error={errors.skill?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, value } }) => (
                <DateTimePickerInput
                  label="Shift Date (On and After) (Optional):"
                  mode="date"
                  value={value ? new Date(value) : null}
                  onChange={(date) => onChange(date.toISOString())}
                  icon={<Feather name="calendar" size={18} color={theme.icon} />}
                  error={errors.date?.message}
                  theme={theme}
                />
              )}
            />

            <View style={styles.actionRow}>
              <CustomButton
                title="Search Shifts"
                variant="primary"
                onPress={handleSubmit(onSubmit)}
              />
            </View>
          </View>

          <View style={styles.resultsSection}>
            {filterQuery ? (
              <ShiftResults query={filterQuery} styles={styles} />
            ) : (
              <Text style={styles.noResultsText}>
                Tap "Search Shifts" to find available shifts.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    headerContainer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
    },
    formSection: {
      paddingHorizontal: 24,
    },
    actionRow: {
      marginTop: 8,
    },
    resultsSection: {
      paddingHorizontal: 24,
      marginTop: 24,
    },
    noResultsText: {
      textAlign: 'center',
      color: theme.textSecondary,
      marginTop: 20,
    },
  });
function ShiftResults({ query, styles }: { query: string; styles: any }) {
  console.log('getting it: ', query);
  const { data: response, isLoading, isError, error } = useGetExtraShifts(query);

  // Safely grab the `data` array out of the backend's response object
  const shifts = response || [];

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return (
      <ErrorMessageBox message={error?.message || 'Error fetching shifts'} onClose={() => {}} />
    );
  }

  if (shifts.length === 0) {
    return <Text style={styles.noResultsText}>No extra shifts found.</Text>;
  }

  return (
    <>
      {shifts.map((shift: any) => (
        <ShiftCard key={shift.id} shift={shift} buttonTitle="Apply" />
      ))}
    </>
  );
}
