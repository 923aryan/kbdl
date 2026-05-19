import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- Import this

interface CustomHeaderProps {
  title: string;
  onBackPress?: () => void; // optional: override default router.back()
  showBackButton?: boolean; // optional: hide back button if not needed
}

export function CustomHeader({ title, onBackPress, showBackButton = true }: CustomHeaderProps) {
  // This gets the exact pixel height of the notch/status bar for the current device
  const insets = useSafeAreaInsets();

  return (
    // Outer container applies the background color AND the top padding
    <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
      {/* Inner container handles the actual 56px header layout */}
      <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={onBackPress ?? (() => router.back())}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}

        <Text style={styles.headerTitle}>{title}</Text>

        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#01122E', // Navy color spans behind the status bar too!
  },
  headerContent: {
    height: 56, // Standard mobile header height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8, // Adds a little breathing room from the edge
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    // Removes hidden padding on Android to guarantee perfect vertical center
    ...(Platform.OS === 'android' && { includeFontPadding: false }),
  },
  rightPlaceholder: {
    width: 40,
  },
});
