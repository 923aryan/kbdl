import { Colors } from '@/constants/theme';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreatedShiftsScreen from './created-shifts-screen';
import ScheduledShiftScreen from './scheduled-shifts-screen';

type SubTab = 'scheduled' | 'created' | 'saved';

const { width } = Dimensions.get('window');

export default function MyActivityScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('scheduled');
  const [visitedTabs, setVisitedTabs] = useState<SubTab[]>(['scheduled']);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const handleTabPress = (tab: SubTab, index: number) => {
    setActiveTab(tab);
    if (!visitedTabs.includes(tab)) {
      setVisitedTabs((prev) => [...prev, tab]);
    }
    scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      {/* <View style={styles.container}> */}
      <View style={styles.tabsContainer}>
        <ScrollView
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
          }}
        >
          <View style={{ width, height: '100%' }}>
            {visitedTabs.includes('scheduled') && <ScheduledShiftScreen />}
          </View>
          <View style={{ width, height: '100%' }}>
            {visitedTabs.includes('created') && <CreatedShiftsScreen />}
          </View>
          <View style={[styles.placeholder, { width, height: '100%' }]}>
            <Text style={styles.placeholderText}>No Saved Shifts Yet</Text>
          </View>
        </ScrollView>
      </View>
      {/* </View> */}
    </SafeAreaView>
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
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
});
