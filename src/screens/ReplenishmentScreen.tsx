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
  return (
    <View style={styles.container}>
      {/* Premium Navy Header */}
      <LinearGradient
        colors={[colors.navy, colors.navyLight]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable 
              style={styles.backBtn} 
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons name="apps-outline" size={20} color={colors.white} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Distributor Portal</Text>
              {currentRow && (
                <View style={styles.activeRowIndicator}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.headerRow2}>Row {currentRow} • Live</Text>
                </View>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Body */}
      <ScrollView 
        style={styles.body} 
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <SurfaceCard style={styles.mainCard}>
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
            <LinearGradient
              colors={[colors.primarySubtle, 'rgba(255,107,0,0.02)']}
              style={styles.iconCircle}
            >
              <Ionicons name="cube" size={48} color={colors.primary} />
            </LinearGradient>
          </Animated.View>

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

        {/* Recent Requests Section */}
        <Animated.View style={[styles.requestsSection, { opacity: contentOpacity }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.requestsTitle}>Row {currentRow} History</Text>
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>LIVE</Text>
            </View>
          </View>
          
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
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color={colors.greyText} />
                      <Text style={styles.requestTime}>{req.time}</Text>
                    </View>
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
        </Animated.View>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  activeRowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  headerRow2: {
    fontSize: 11,
    color: colors.green,
    fontWeight: typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  mainCard: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 32,
  },
  iconWrap: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primarySubtle,
  },
  mainTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 8,
  },
  subText: {
    fontSize: typography.body,
    color: colors.greyText,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  btnWrap: {
    width: '100%',
    marginTop: 24,
  },
  requestBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  requestBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: typography.bold,
  },
  requestsSection: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  historyBadge: {
    backgroundColor: colors.navySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: typography.extrabold,
    color: colors.navy,
  },
  emptyRequestsCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyRequests: {
    fontSize: 14,
    color: colors.greyText,
    fontWeight: typography.medium,
  },
  requestItem: {
    marginBottom: 12,
  },
  requestItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  requestInfo: {
    flex: 1,
    marginRight: 16,
  },
  requestItems: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTime: {
    fontSize: 12,
    color: colors.greyText,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  pendingBadge: { backgroundColor: colors.surfaceAlt },
  ackBadge: { backgroundColor: colors.navySubtle },
  dispatchBadge: { backgroundColor: colors.greenSubtle },
  statusText: {
    fontSize: 11,
    fontWeight: typography.bold,
    textTransform: 'uppercase',
  },
  pendingText: { color: colors.greyText },
  ackText: { color: colors.navy },
  dispatchText: { color: colors.green },
});
