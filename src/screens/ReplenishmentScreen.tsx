import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, Alert, Modal } from 'react-native';
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
import ConfirmationModal from '../components/ConfirmationModal';
import { db } from '../utils/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { CORE_ITEMS, EXTRA_ITEMS } from '../data/inventoryData';

// Build a name → icon lookup
const ITEM_ICON_MAP: Record<string, string> = {};
[...CORE_ITEMS, ...EXTRA_ITEMS].forEach(i => { ITEM_ICON_MAP[i.name] = i.icon; });

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Replenishment'>;
};

interface ParticipantReq {
  id: string;
  participantName: string;
  items: string[];
  status: string;
  createdAt: any;
}

export default function ReplenishmentScreen({ navigation }: Props) {
  const { currentRow, openWarehouseSheet, adminRequests, showToastMsg, signOut } = useAppStore();
  const [isSignOutModalVisible, setSignOutModalVisible] = useState(false);

  const [participantRequests, setParticipantRequests] = useState<ParticipantReq[]>([]);
  const [detailReq, setDetailReq] = useState<ParticipantReq | null>(null);
  
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

  // Listen for participant item requests for this distributor's row
  useEffect(() => {
    if (!currentRow) return;
    const q = query(
      collection(db, 'itemRequests'),
      where('row', '==', currentRow)
    );
    const unsub = onSnapshot(q, (snap) => {
      const reqs: ParticipantReq[] = [];
      snap.forEach(d => {
        reqs.push({ id: d.id, ...d.data() } as ParticipantReq);
      });
      // Sort client-side (newest first)
      reqs.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setParticipantRequests(reqs);
    }, (error) => {
      console.warn('Firestore itemRequests listener error:', error.message);
    });
    return () => unsub();
  }, [currentRow]);

  const markFulfilled = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'itemRequests', reqId), { status: 'fulfilled' });
      showToastMsg('Marked as fulfilled!');
    } catch (e: any) {
      showToastMsg(`Error: ${e.message}`);
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

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
            <Pressable 
              style={styles.signOutBtn} 
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={24} color={colors.white} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Body */}
      <ScrollView 
        style={styles.body} 
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Participant Requests Section — TOP */}
        <View style={styles.requestsSection}>
          <Text style={styles.requestsTitle}>🙏 Participant Requests (Row {currentRow})</Text>
          
          {participantRequests.length === 0 ? (
            <SurfaceCard style={styles.emptyRequestsCard}>
              <Ionicons name="people-outline" size={32} color={colors.greyText} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyRequests}>No participant requests yet.</Text>
            </SurfaceCard>
          ) : (
            participantRequests.map(req => (
              <Pressable key={req.id} onPress={() => setDetailReq(req)}>
                <SurfaceCard style={styles.requestItem} innerStyle={styles.requestItemInner}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestItems} numberOfLines={2}>
                      {req.items.join(', ')}
                    </Text>
                    <Text style={styles.requestTime}>
                      From: {req.participantName}
                    </Text>
                  </View>
                  {req.status === 'pending' ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]}>
                      <Text style={[styles.statusText, { color: colors.primary }]}>Pending</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.dispatchBadge]}>
                      <Text style={[styles.statusText, styles.dispatchText]}>Done</Text>
                    </View>
                  )}
                </SurfaceCard>
              </Pressable>
            ))
          )}
        </View>

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
      {/* Detail Modal */}
      <Modal
        visible={!!detailReq}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailReq(null)}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <Pressable style={{ flex: 1 }} onPress={() => setDetailReq(null)} />

          {/* Bottom sheet style card */}
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Details</Text>
                <Text style={styles.modalFrom}>From: {detailReq?.participantName}</Text>
              </View>
              <Pressable onPress={() => setDetailReq(null)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.greyText} />
              </Pressable>
            </View>

            {/* Items list */}
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator
              bounces={false}
            >
              {(detailReq?.items ?? []).map((name, idx) => (
                <View key={idx} style={styles.modalItem}>
                  <Text style={styles.modalItemIcon}>{ITEM_ICON_MAP[name] || '📦'}</Text>
                  <Text style={styles.modalItemName}>{name}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <View style={[
                styles.modalStatusBadge,
                { backgroundColor: detailReq?.status === 'pending' ? '#FFF3E0' : '#E8FBF0' }
              ]}>
                <Text style={[
                  styles.modalStatusText,
                  { color: detailReq?.status === 'pending' ? colors.primary : colors.green }
                ]}>
                  {detailReq?.status === 'pending' ? '⏳ Pending' : '✅ Fulfilled'}
                </Text>
              </View>

              {detailReq?.status === 'pending' && (
                <Pressable
                  style={({ pressed }) => [styles.modalFulfillBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    if (detailReq) markFulfilled(detailReq.id);
                    setDetailReq(null);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.modalFulfillText}>Mark as Fulfilled</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  signOutBtn: {
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

  // Detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: typography.extrabold,
    color: colors.navy,
  },
  modalFrom: {
    fontSize: 13,
    color: colors.greyText,
    marginTop: 3,
  },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F0F2F5',
    alignItems: 'center', justifyContent: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  modalItemIcon: { fontSize: 24 },
  modalItemName: {
    fontSize: 15,
    fontWeight: typography.bold,
    color: colors.navy,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: typography.bold,
  },
  modalFulfillBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalFulfillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.bold,
  },
});
