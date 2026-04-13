import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  const iconScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Icon spring entrance at 200ms
    const iconAnim = setTimeout(() => {
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }, 200);

    // Title fade + slide at 1000ms
    const titleAnim = setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 1000);

    // Subtitle fade at 1500ms
    const subtitleAnim = setTimeout(() => {
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1500);

    // Navigate at 2500ms
    const navTimer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => {
      clearTimeout(iconAnim);
      clearTimeout(titleAnim);
      clearTimeout(subtitleAnim);
      clearTimeout(navTimer);
    };
  }, []);

  return (
    <LinearGradient
      colors={['#FF6B00', '#FF8C00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Icon */}
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}>
        <Text style={styles.iconEmoji}>🔥</Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
      >
        Yagya Manager
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Havan Inventory System
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 46,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.extrabold,
    color: colors.white,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.subtitle,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: typography.regular,
  },
});
