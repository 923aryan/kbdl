import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import DateTimePickerInput from '@/components/ui/date-time-picker';
import { Colors } from '@/constants/theme';
import { getExtraShiftsSchema } from '@repo/validator/shared';
import CustomButton from '../../../components/ui/button';
import CustomInput from '../../../components/ui/input';
import { useGetSearchAddress } from '../../operations/hooks/use-operation-hook';
const formSchema = getExtraShiftsSchema.shape.query;
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export default function ExtraShiftScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const styles = createStyles(theme);
  const router = useRouter();

  const [locationStatus, setLocationStatus] = useState<'fetching' | 'fetched' | 'error'>(
    'fetching',
  );

  const [addressQuery, setAddressQuery] = useState('');
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddress(addressQuery);
    }, 1000);
    return () => clearTimeout(timer);
  }, [addressQuery]);

  const { data: searchResults, isFetching: isSearching } = useGetSearchAddress({
    query: debouncedAddress,
  });

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
      radius: 10,
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
          setLocationStatus('error');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        setValue('latitude', lat);
        setValue('longitude', lon);

        setLocationStatus('fetched');
        console.log('fetched location: ', `${lat}, ${lon}`);
      } catch (e) {
        setLocationStatus('error');
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

    if (data.radius !== undefined) {
      params.push(`radius=${data.radius}`);
    }

    params.push(`limit=${data.limit ?? 10}`);
    params.push(`page=${data.page ?? 1}`);
    params.push(`latitude=${data.latitude}`);
    params.push(`longitude=${data.longitude}`);

    const finalQueryString = params.join('&');

    router.push({
      pathname: '/shift-swap/lists',
      params: { type: 'extra-shifts', query: finalQueryString },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>Find and apply for extra shifts</Text>
        </View>

        <View style={styles.formSection}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
              If no address is searched, your current location will be used by default.
            </Text>
            {locationStatus === 'fetching' && (
              <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: '500' }}>
                Fetching location...
              </Text>
            )}
            {locationStatus === 'fetched' && (
              <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '500' }}>
                Location fetched ✓
              </Text>
            )}
            {locationStatus === 'error' && (
              <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '500' }}>
                Failed to fetch location. Please enable location permissions.
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <CustomInput
              label="Search Address (Optional):"
              placeholder="Search for an address..."
              icon={<Feather name="search" size={18} color={theme.icon} />}
              onChangeText={(text) => {
                setAddressQuery(text);
                setIsDropdownVisible(true);
                if (selectedAddress && text !== selectedAddress) {
                  setSelectedAddress(null);
                }
              }}
              value={addressQuery}
            />
            {isDropdownVisible && debouncedAddress.length >= 2 && searchResults?.features && (
              <ScrollView
                style={[
                  styles.dropdown,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {isSearching && (
                  <Text style={{ padding: 8, color: theme.textSecondary }}>Searching...</Text>
                )}
                {!isSearching && searchResults.features.length === 0 && (
                  <Text style={{ padding: 8, color: theme.textSecondary }}>No results found.</Text>
                )}
                {!isSearching &&
                  searchResults.features.map((feature: any, index: number) => (
                    <TouchableOpacity
                      key={feature.properties.place_id || index}
                      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                      onPress={() => {
                        const lat = feature.properties.lat;
                        const lon = feature.properties.lon;
                        setValue('latitude', lat);
                        setValue('longitude', lon);
                        setAddressQuery(feature.properties.formatted);
                        setSelectedAddress(feature.properties.formatted);
                        setIsDropdownVisible(false);
                      }}
                    >
                      <Text style={{ color: theme.text }}>{feature.properties.formatted}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
          </View>

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

          <Controller
            control={control}
            name="radius"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomInput
                label="Search Radius (km):"
                placeholder="e.g. 10"
                icon={<Feather name="map-pin" size={18} color={theme.icon} />}
                onBlur={onBlur}
                onChangeText={(text) => onChange(text)}
                value={value ? value.toString() : ''}
                error={errors.radius?.message}
                keyboardType="numeric"
              />
            )}
          />

          <View style={styles.actionRow}>
            <CustomButton
              title="Search Shifts"
              variant="primary"
              onPress={handleSubmit(onSubmit)}
              disabled={locationStatus !== 'fetched'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    headerContainer: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 24,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
    },
    formSection: {
      paddingHorizontal: 24,
    },
    dropdown: {
      maxHeight: 200,
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 4,
      zIndex: 1000,
    },
    dropdownItem: {
      padding: 12,
      borderBottomWidth: 1,
    },
    actionRow: {
      marginTop: 24,
      marginBottom: 20,
    },
    errorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
    },
  });
