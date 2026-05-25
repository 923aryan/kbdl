import { OptionCard } from '@/components/option-card';
import ShiftCard from '@/components/ui/shift-swap-card';
import { Colors } from '@/constants/theme';
import { useGetOpenShifts } from '@/features/shift-swap/api';
import { useShiftSwapStore } from '@/features/shift-swap/hooks/use-shift-swap';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { data } = useGetOpenShifts();
  const setShifts = useShiftSwapStore((s) => s.setShifts);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (data) {
      console.log('shfits : ', data);
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

  const [showDropdown, setShowDropdown] = useState(false);
  const [location, setLocation] = useState('Chandigarh');

  // Cards Data
  const cards = [
    {
      id: 1,
      title: 'Shifts',
      subtitle: 'Browse job by your preferred shift',
      icon: 'swap-horizontal',
      iconColor: '#2F80ED',
      bgColor: '#EAF2FF',
      route: 'shift-swap',
    },
    {
      id: 2,
      title: 'Alert',
      subtitle: 'Find jobs that match your skills',
      icon: 'notifications-outline',
      iconColor: '#EB5757',
      bgColor: '#FDECEA',
      route: '/alerts',
    },
    {
      id: 3,
      title: 'Find Job',
      subtitle: 'Search and apply for the best job',
      icon: 'search',
      iconColor: '#F2994A',
      bgColor: '#FFF4E5',
      route: '/jobs/find-jobs',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      {/* Location Dropdown */}
      <View style={styles.locationWrapper}>
        <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} />

            <Text style={styles.locationText}>{location}</Text>

            <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={16} />
          </View>
        </TouchableOpacity>

        {/* Popup Dropdown */}
        {showDropdown && (
          <View style={styles.dropdown}>
            {['Chandigarh', 'Delhi', 'Mumbai'].map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.dropdownItem}
                onPress={() => {
                  setLocation(city);
                  setShowDropdown(false);
                }}
              >
                <Text>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Search Box */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#666" />

        <View style={styles.divider} />

        <TextInput placeholder="Search" placeholderTextColor="#999" style={styles.input} />
      </View>
      {/* Shift Cards List */}
      <View style={styles.shiftListContainer}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {data?.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} buttonTitle="Approve" />
            <ShiftCard key={shift.id} shift={shift} buttonTitle="Approve" />
          ))}
        </ScrollView>
      </View>

      {/* Header */}
      <View style={styles.header}>
        {/* Refer Button */}
        <TouchableOpacity
          style={styles.referBtn}
        // onPress={() => router.push("/refer")}
        >
          <View style={styles.referContent}>
            <FontAwesome name="whatsapp" size={17} color="#25D366" style={{ marginTop: 2 }} />

            <Text style={styles.referText}>Refer</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Cards */}
      {cards.map((item) => (
        <OptionCard
          key={item.id}
          title={item.title}
          description={item.subtitle}
          IconComponent={() => (
            <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
          )}
          IconComponent={() => (
            <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
          )}
          iconBgColor={item.bgColor}
          onPress={() => router.push(item.route as any)}
          theme={theme}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110, // Gives plenty of space to scroll past the absolute bottom tab bar
  },

  shiftListContainer: {
    maxHeight: 240, // Sets the height to roughly show only one card at a time
    marginBottom: 10,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 999,
  },

  locationWrapper: {
    position: 'relative',
    paddingBottom: 10,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },

  dropdown: {
    position: 'absolute',
    top: 35,
    left: 0,
    width: 150,

    backgroundColor: '#fff',
    borderRadius: 10,

    borderWidth: 1,
    borderColor: '#eee',

    paddingVertical: 5,

    elevation: 5,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    zIndex: 999,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  referBtn: {
    backgroundColor: '#E6F7EC',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },

  referContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  referText: {
    color: 'green',
    fontWeight: '500',
    marginLeft: 6,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },

  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },

  input: {
    flex: 1,
    fontSize: 14,
  },
});
