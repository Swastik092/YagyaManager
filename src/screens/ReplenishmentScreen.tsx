import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import RefillRequestSheet from '../components/RefillRequestSheet';
import Toast from '../components/Toast';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import SurfaceCard from '../components/SurfaceCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Replenishment'>;
};

export default function ReplenishmentScreen({ navigation }: Props) {
  const { currentRow, openWarehouseSheet, adminRequests, showToastMsg } = useAppStore();
  
  // Track previous statuses to show toast on change
  const prevStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    // Look for requests for this row
    const myRequests = adminRequests.filter(r => r.row === currentRow);
    
    myRequests.forEach(req => {
      const prev = prevStatuses.current[req.id];
      if (prev === 'pending' && req.status === 'acknowledged') {
        showToastMsg(`Admin has acknowledged your request for Row ${currentRow}!`);
      }
      prevStatuses.current[req.id] = req.status;
    });
  }, [adminRequests, currentRow]);

  // Entrance animations
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Icon spring at 200ms
    setTimeout(() => {
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    }, 200);

    // Subtext at 400ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 400);

    // Button at 500ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 500);
  }, []);

  return (
    <View style={styles.container}>
      {/* Orange Header Container */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable 
              style={styles.backBtn} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="apps-outline" size={24} color={colors.white} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Replenishment</Text>
              {currentRow && (
                <Text style={styles.headerRowLabel}>Current Row: {currentRow}</Text>
              )}
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Body */}
      <ScrollView 
        style={styles.body} 
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SurfaceCard style={styles.mainCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="cube" size={54} color={colors.primary} />
          </View>

          <Animated.Text
            style={[styles.mainTitle, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}
          >
            Inventory Status
          </Animated.Text>

          <Animated.Text
            style={[styles.subText, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}
          >
            Running low on Yagya items? Request an immediate refill from the warehouse.
          </Animated.Text>

          {/* CTA Button */}
          <Animated.View style={[styles.btnWrap, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}>
            <Pressable 
              style={styles.requestBtn} 
              onPress={() => {
                openWarehouseSheet();
              }}
            >
              <Ionicons name="add" size={24} color={colors.white} />
              <Text style={styles.requestBtnText}>New Refill Request</Text>
            </Pressable>
          </Animated.View>
        </SurfaceCard>

        <View style={styles.requestsSection}>
          <Text style={styles.requestsTitle}>Recent Requests (Row {currentRow})</Text>
          
          {adminRequests.filter(r => r.row === currentRow).length === 0 ? (
            <SurfaceCard style={styles.emptyRequestsCard}>
              <Ionicons name="document-text-outline" size={32} color={colors.greyText} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyRequests}>No recent activity for this row.</Text>
            </SurfaceCard>
          ) : (
            adminRequests
              .filter(r => r.row === currentRow)
              .slice(0, 8)
              .map(req => (
                <SurfaceCard key={req.id} style={styles.requestItem} innerStyle={styles.requestItemInner}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestItems} numberOfLines={1}>{req.items}</Text>
                    <Text style={styles.requestTime}>{req.time}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    req.status === 'pending' ? styles.pendingBadge :
                    req.status === 'acknowledged' ? styles.ackBadge : styles.dispatchBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      req.status === 'pending' ? styles.pendingText :
                      req.status === 'acknowledged' ? styles.ackText : styles.dispatchText
                    ]}>
                      {req.status === 'pending' ? 'Pending' : 
                       req.status === 'acknowledged' ? 'ACK' : 'Sent'}
                    </Text>
                  </View>
                </SurfaceCard>
              ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <RefillRequestSheet />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  headerRowLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginTop: 2,
    fontWeight: typography.bold,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: 24,
    fontWeight: typography.bold,
    color: colors.white,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  mainCard: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 25,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: colors.greyText,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  btnWrap: {
    width: '100%',
    marginTop: 24,
  },
  requestBtn: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  requestBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: typography.bold,
  },
  requestsSection: {
    width: '100%',
  },
  requestsTitle: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.greyText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyRequestsCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyRequests: {
    fontSize: 14,
    color: colors.greyText,
  },
  requestItem: {
    marginBottom: 10,
  },
  requestItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  requestInfo: {
    flex: 1,
  },
  requestItems: {
    fontSize: 16,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  requestTime: {
    fontSize: 12,
    color: colors.greyText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  pendingBadge: { backgroundColor: '#F0F0F0' },
  ackBadge: { backgroundColor: '#E8E8FF' },
  dispatchBadge: { backgroundColor: '#E8FBF0' },
  statusText: {
    fontSize: 10,
    fontWeight: typography.bold,
  },
  pendingText: { color: '#666' },
  ackText: { color: colors.navy },
  dispatchText: { color: colors.green },
});
