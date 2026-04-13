import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function Toast() {
  const { showToast, toastMsg } = useAppStore();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showToast) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 100, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [showToast]);

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }], opacity }]}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.text}>{toastMsg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },
  icon: {
    color: colors.green,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  text: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.semibold,
    flex: 1,
  },
});
