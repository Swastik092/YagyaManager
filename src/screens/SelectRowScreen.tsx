import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Pressable, ScrollView,
  StyleSheet, Animated, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import Toast from '../components/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import ConfirmationModal from '../components/ConfirmationModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SelectRow'>;
};

const TOTAL_ROWS = 15;

export default function SelectRowScreen({ navigation }: Props) {
  const { setCurrentRow, signOut, showToastMsg } = useAppStore();
  const [isSignOutModalVisible, setSignOutModalVisible] = useState(false);

  const scaleValues = useRef(
    Array.from({ length: TOTAL_ROWS }, () => new Animated.Value(1))
  ).current;

  const cardAnims = useRef(
    Array.from({ length: TOTAL_ROWS }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    cardAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(anim.translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start();
      }, 60 * i);
    });
  }, []);

  const handleRowPress = (num: number, idx: number) => {
    Animated.sequence([
      Animated.timing(scaleValues[idx], { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleValues[idx], { toValue: 1, useNativeDriver: true, tension: 150 }),
    ]).start();

    const rowStr = String(num).padStart(2, '0');
    setCurrentRow(rowStr);
    showToastMsg(`Row ${rowStr} Selected!`);
    setTimeout(() => navigation.navigate('Replenishment'), 350);
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
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
            <Text style={styles.headerTitle}>Select Your Row</Text>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={15} color={colors.primary} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
          <Text style={styles.headerSub}>Anand · Line Distributor</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Grid */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1).map((num, idx) => (
            <Animated.View
              key={num}
              style={{
                width: '30%',
                opacity: cardAnims[idx].opacity,
                transform: [
                  { translateY: cardAnims[idx].translateY },
                  { scale: scaleValues[idx] },
                ],
              }}
            >
              <Pressable style={styles.card} onPress={() => handleRowPress(num, idx)}>
                <Text style={styles.cardLabel}>ROW</Text>
                <Text style={styles.cardNum}>
                  {String(num).padStart(2, '0')}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast />
      <ConfirmationModal
        visible={isSignOutModalVisible}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
        iconName="log-out-outline"
        onConfirm={() => {
          setSignOutModalVisible(false);
          signOut();
          navigation.replace('Login');
        }}
        onCancel={() => setSignOutModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: 'rgba(255,107,0)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: typography.h1,
    fontWeight: typography.extrabold,
    color: colors.white,
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: typography.small,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: typography.semibold,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 30,
    gap: 5,
  },
  signOutText: {
    fontSize: typography.small,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingTop: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: typography.bold,
    color: colors.greyText,
    letterSpacing: 2.5,
  },
  cardNum: {
    fontSize: 30,
    fontWeight: typography.extrabold,
    color: colors.navy,
    letterSpacing: -1,
    marginTop: 2,
  },
});
