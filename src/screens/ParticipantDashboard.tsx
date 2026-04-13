import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import Toast from '../components/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ParticipantDashboard'>;
};

export default function ParticipantDashboard({ navigation }: Props) {
  const { signOut } = useAppStore();

  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const text1Opacity = useRef(new Animated.Value(0)).current;
  const text1Y = useRef(new Animated.Value(20)).current;
  const text2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }, 200);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(text1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(text1Y, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 400);

    setTimeout(() => {
      Animated.timing(text2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 500);
  }, []);

  const handleSignOut = () => {
    signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B00', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Participant Dashboard</Text>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={16} color={colors.primary} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Body */}
      <View style={styles.body}>
        <Animated.View style={[styles.iconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
          <Text style={styles.iconEmoji}>🙏</Text>
        </Animated.View>

        <Animated.Text
          style={[styles.mainText, { opacity: text1Opacity, transform: [{ translateY: text1Y }] }]}
        >
          Welcome to the Yagya details.
        </Animated.Text>

        <Animated.Text style={[styles.subText, { opacity: text2Opacity }]}>
          (Participant features arriving soon)
        </Animated.Text>
      </View>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: 'rgba(255,107,0)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: typography.extrabold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 30,
    gap: 4,
  },
  signOutText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: typography.bold,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,107,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 48,
  },
  mainText: {
    fontSize: typography.subtitle,
    fontWeight: '500',
    color: colors.greyText,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: colors.greyText,
    opacity: 0.7,
    textAlign: 'center',
  },
});
