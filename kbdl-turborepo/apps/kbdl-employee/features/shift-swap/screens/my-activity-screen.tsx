import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreatedShiftsScreen from './created-shifts-screen';
import SavedShiftsScreen from './saved-shifts-screen';
import ScheduledShiftScreen from './scheduled-shifts-screen';

type SubTab = 'scheduled' | 'created' | 'saved';

const { width } = Dimensions.get('window');

export default function MyActivityScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('scheduled');
  const [visitedTabs, setVisitedTabs] = useState<SubTab[]>(['scheduled']);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabsScrollRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const syncTabsScroll = (index: number) => {
    if (index === 0) {
      tabsScrollRef.current?.scrollTo({ x: 0, animated: true });
    } else if (index === 2) {
      tabsScrollRef.current?.scrollToEnd({ animated: true });
    } else {
      // Give it a generic offset to ensure middle tab centers properly on smaller devices
      tabsScrollRef.current?.scrollTo({ x: 60, animated: true });
    }
  };

  const handleTabPress = (tab: SubTab, index: number) => {
    setActiveTab(tab);
    if (!visitedTabs.includes(tab)) {
      setVisitedTabs((prev) => [...prev, tab]);
    }
    scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
    syncTabsScroll(index);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={['bottom']}
      >
        {/* <View style={styles.container}> */}
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            <TouchableOpacity onPress={() => handleTabPress('scheduled', 0)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabText]}>
                Scheduled Shifts
              </Text>
              {activeTab === 'scheduled' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleTabPress('created', 1)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
                Created Shifts
              </Text>
              {activeTab === 'created' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleTabPress('saved', 2)} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
                Saved Shifts
              </Text>
              {activeTab === 'saved' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </ScrollView>
        </View>
        <View style={styles.contentArea}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1 }}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const page = Math.round(offsetX / width);
              const tabs: SubTab[] = ['scheduled', 'created', 'saved'];
              const newTab = tabs[page];
              setActiveTab(newTab);
              if (!visitedTabs.includes(newTab)) {
                setVisitedTabs((prev) => [...prev, newTab]);
              }
              syncTabsScroll(page);
            }}
          >
            <View style={{ width, flex: 1 }}>
              {visitedTabs.includes('scheduled') && <ScheduledShiftScreen />}
            </View>
            <View style={{ width, flex: 1 }}>
              {visitedTabs.includes('created') && <CreatedShiftsScreen />}
            </View>
            <View style={{ width, flex: 1 }}>
              {visitedTabs.includes('saved') && <SavedShiftsScreen />}
            </View>
          </ScrollView>
        </View>
        {/* </View> */}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1D4ED8',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1D4ED8',
  },
  contentArea: { flex: 1 },
});
