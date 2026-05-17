import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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
      route: '/(public)/(shift-swap)',
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
      route: '/find-job',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
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

      {/* Search Box */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#666" />

        <View style={styles.divider} />

        <TextInput placeholder="Search" placeholderTextColor="#999" style={styles.input} />
      </View>

      {/* Cards */}
      {cards.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() => router.push(item.route as any)}
        >
          {/* Icon */}
          <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
            <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>

          {/* Arrow */}
          <Ionicons name="chevron-forward" size={20} color="#333" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
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
    paddingVertical: 10,

    marginBottom: 20,
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

  card: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#fff',

    borderWidth: 1,
    borderColor: '#ddd',

    borderRadius: 16,

    padding: 16,
    marginBottom: 15,
  },

  iconBox: {
    width: 60,
    height: 60,

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});
