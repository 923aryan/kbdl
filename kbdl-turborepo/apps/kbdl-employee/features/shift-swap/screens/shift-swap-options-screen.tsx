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
import CreateShiftScreen from './create-shift-swap-screen';
import ExtraShiftScreen from './extra-shifts-screen';

type SubTab = 'create' | 'extra';

const { width } = Dimensions.get('window');

export default function ShiftSwapOptionsScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('create');

  const scrollViewRef = useRef<ScrollView>(null);

  const handleTabPress = (tab: SubTab) => {
    setActiveTab(tab);
    if (tab === 'create') {
      scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    } else {
      scrollViewRef.current?.scrollTo({ x: width, animated: true });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          <TouchableOpacity onPress={() => handleTabPress('create')} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
              Create shift swap
            </Text>
            {activeTab === 'create' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleTabPress('extra')} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === 'extra' && styles.activeTabText]}>
              Extra shifts
            </Text>
            {activeTab === 'extra' && <View style={styles.activeTabIndicator} />}
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
            setActiveTab(page === 0 ? 'create' : 'extra');
          }}
        >
          <View style={{ width, flex: 1 }}>
            <CreateShiftScreen />
          </View>
          <View style={{ width, flex: 1 }}>
            <ExtraShiftScreen />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
