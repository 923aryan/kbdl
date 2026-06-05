import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TRACK_WIDTH = width * 0.4;
const FILL_WIDTH = TRACK_WIDTH * 0.4; // The moving part is 40% of the track width

export default function CustomSplashScreen() {
  const [dots, setDots] = useState('.');
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Text animation (cycling dots)
    const textInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '.';
        if (prev === '..') return '...';
        return '..';
      });
    }, 400);

    // Progress bar animation (left to right continuously)
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();

    return () => clearInterval(textInterval);
  }, [progressAnim]);

  // Interpolate animation value to translate the bar smoothly across the track
  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-FILL_WIDTH, TRACK_WIDTH],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Center content (Logo, Divider, Tagline) */}
      <View style={styles.centerContent}>
        <Image
          source={require('@/assets/images/splash-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* <View style={styles.divider} /> */}
      </View>

      {/* Bottom content (Progress Bar, Loading text) */}
      <View style={styles.loadingSection}>
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { transform: [{ translateX }] }]} />
        </View>

        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingText}>Loading</Text>
          <Text style={styles.dotsText}>{dots}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001A4D', // Dark navy blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
    transform: [{ translateY: -40 }], // Visually balances the center given the bottom loader
  },
  logo: {
    width: width * 0.2, // Roughly 20% of screen width
    aspectRatio: 1.5, // Maintains aspect ratio
  },
  divider: {
    width: '85%', // 80-90% of screen width
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 24,
  },
  tagline: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium', // Modern geometric font appearance
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 16,
  },
  loadingSection: {
    position: 'absolute',
    bottom: '25%', // Near lower-middle section
    alignItems: 'center',
    width: '100%',
  },
  progressBarTrack: {
    width: TRACK_WIDTH, // Approx 40% of screen width
    height: 4, // Slim
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2, // Fully rounded
    overflow: 'hidden',
  },
  progressBarFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    width: FILL_WIDTH,
    borderRadius: 2,
  },
  loadingTextContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
  },
  dotsText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    width: 24, // Fixed width prevents the text block from resizing and bouncing
  },
});
