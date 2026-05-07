import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
  ActivityIndicator, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store/useAppStore';
import Toast from '../components/Toast';
import CustomAlert from '../components/CustomAlert';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../utils/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CORE_ITEMS, EXTRA_ITEMS } from '../data/inventoryData';
import { notifyDistributor } from '../utils/notifications';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ParticipantDashboard'>;
};

const ALL_ITEMS = [
  ...CORE_ITEMS.map(i => ({ id: i.id, name: i.name, icon: i.icon, unit: i.unit })),
  ...EXTRA_ITEMS.map(i => ({ id: i.id, name: i.name, icon: i.icon, unit: i.unit })),
];

export default function ParticipantDashboard({ navigation }: Props) {
  const { signOut } = useAppStore();
  const [seat, setSeat] = useState<{ row: number; col: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Item request state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', buttons: [] as any[]
  });

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.seat) setSeat(data.seat);
        if (data.name) setUserName(data.name);
      }
      setLoading(false);
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

  const handleSignOut = () => {
    signOut();
    navigation.replace('Login');
  };

  const toggleItem = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendRequest = async () => {
    if (selectedIds.length === 0) return;
    const uid = auth.currentUser?.uid;
    if (!uid || !seat) {
      setAlertConfig({
        visible: true, title: 'No Seat',
        message: 'Please select a seat first so we know your row.',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    setSending(true);
    try {
      const selectedNames = ALL_ITEMS
        .filter(i => selectedIds.includes(i.id))
        .map(i => i.name);

      const rowStr = String(seat.row).padStart(2, '0');

      await addDoc(collection(db, 'itemRequests'), {
        participantId: uid,
        participantName: userName || 'Participant',
        row: rowStr,
        seatRow: seat.row,
        seatCol: seat.col,
        items: selectedNames,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Send push notification to the row's distributor
      await notifyDistributor(
        rowStr,
        userName || 'Participant',
        seat.row,
        seat.col,
        selectedNames
      );

      setSelectedIds([]);
      setAlertConfig({
        visible: true,
        title: '✅ Request Sent!',
        message: `Your request for ${selectedNames.length} item(s) has been sent to the Row ${rowStr} distributor.`,
        buttons: [{ text: 'OK' }]
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true, title: 'Error',
        message: e.message, buttons: [{ text: 'OK' }]
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
        icon="checkmark-circle"
        iconColor={colors.green}
      />

      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.primaryLight, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Welcome {userName || 'Participant'}</Text>
            </View>
            <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={16} color={colors.primary} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>

          {/* Seat info strip */}
          {seat && (
            <Pressable
              style={styles.seatStrip}
              onPress={() => navigation.navigate('SeatSelection')}
            >
              <View style={styles.seatStripLeft}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.seatStripText}>
                  Row {seat.row} · Seat {seat.col}
                </Text>
              </View>
              <View style={styles.seatStripRight}>
                <Text style={styles.seatStripChange}>Change</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </View>
            </Pressable>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* ── Body: Items Grid ── */}
      <Animated.View style={[{ flex: 1, opacity: fadeIn }]}>
        {!seat ? (
          /* No seat selected yet */
          <View style={styles.noSeatWrap}>
            <View style={styles.noSeatIcon}>
              <Ionicons name="grid-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.noSeatTitle}>No Seat Selected</Text>
            <Text style={styles.noSeatSub}>
              Pick your seat first to start requesting havan items.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.selectSeatBtn, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('SeatSelection')}
            >
              <LinearGradient
                colors={[colors.primaryLight, colors.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.selectSeatGradient}
              >
                <Ionicons name="grid" size={20} color="#fff" />
                <Text style={styles.selectSeatText}>Select Your Seat</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          /* Has seat – show items */
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>🌿 Core Havan Items</Text>
            <View style={styles.itemsGrid}>
              {CORE_ITEMS.map(item => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.itemCard,
                      selected && styles.itemCardSelected,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => toggleItem(item.id)}
                  >
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>✨ Additional Items</Text>
            <View style={styles.itemsGrid}>
              {EXTRA_ITEMS.map(item => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.itemCard,
                      selected && styles.itemCardSelected,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                    ]}
                    onPress={() => toggleItem(item.id)}
                  >
                    {selected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 110 }} />
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Bottom bar ── */}
      {selectedIds.length > 0 && seat && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </Text>
            <Text style={styles.bottomSub}>
              Sending to Row {String(seat.row).padStart(2, '0')} distributor
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSendRequest}
            disabled={sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>Send Request</Text>
                </>
            }
          </Pressable>
        </View>
      )}

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    paddingTop: 6,
    marginBottom: 10,
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 30,
    gap: 4,
  },
  signOutText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: typography.bold,
  },

  // Seat strip
  seatStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  seatStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatStripText: {
    fontSize: 14,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  seatStripRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seatStripChange: {
    fontSize: 12,
    fontWeight: typography.bold,
    color: colors.primary,
  },

  // No seat
  noSeatWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  noSeatIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  noSeatTitle: {
    fontSize: typography.h2,
    fontWeight: typography.extrabold,
    color: colors.navy,
  },
  noSeatSub: {
    fontSize: typography.body,
    color: colors.greyText,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectSeatBtn: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  selectSeatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  selectSeatText: {
    color: '#fff', fontSize: 17,
    fontWeight: typography.extrabold,
  },

  // Items
  scrollContent: { padding: 16 },
  sectionTitle: {
    fontSize: 15, fontWeight: typography.bold,
    color: colors.navy, marginBottom: 12, letterSpacing: -0.2,
  },
  itemsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  itemCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 2,
    borderColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  itemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F0',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  itemIcon: { fontSize: 28, marginBottom: 6 },
  itemName: {
    fontSize: 11, fontWeight: typography.bold,
    color: colors.navy, textAlign: 'center', lineHeight: 14,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
  },
  bottomLabel: { fontSize: 15, fontWeight: typography.extrabold, color: colors.navy },
  bottomSub: { fontSize: 11, color: colors.greyText, marginTop: 2 },
  sendBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 14,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: typography.bold },
});
