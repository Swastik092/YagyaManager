import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../utils/firebase';
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import CustomAlert from '../components/CustomAlert';
import { CORE_ITEMS, EXTRA_ITEMS } from '../data/inventoryData';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ItemRequest'>;
};

// Merge both item lists for display
const ALL_ITEMS = [
  ...CORE_ITEMS.map(i => ({ id: i.id, name: i.name, icon: i.icon, unit: i.unit })),
  ...EXTRA_ITEMS.map(i => ({ id: i.id, name: i.name, icon: i.icon, unit: i.unit })),
];

export default function ItemRequestScreen({ navigation }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [seatRow, setSeatRow] = useState<number | null>(null);
  const [userName, setUserName] = useState('Participant');
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', buttons: [] as any[]
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const uid = auth.currentUser?.uid;
    if (uid) {
      getDoc(doc(db, 'users', uid)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.seat) setSeatRow(data.seat.row);
          if (data.name) setUserName(data.name);
        }
      });
    }
  }, []);

  const toggleItem = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSendRequest = async () => {
    if (selectedIds.length === 0) return;
    const uid = auth.currentUser?.uid;
    if (!uid || seatRow === null) {
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

      // Pad row to 2 digits to match distributor format (e.g. "01", "07")
      const rowStr = String(seatRow).padStart(2, '0');

      await addDoc(collection(db, 'itemRequests'), {
        participantId: uid,
        participantName: userName,
        row: rowStr,
        seatRow: seatRow,
        items: selectedNames,
        status: 'pending', // pending → seen → fulfilled
        createdAt: serverTimestamp(),
      });

      setSelectedIds([]);
      setAlertConfig({
        visible: true,
        title: '✅ Request Sent!',
        message: `Your request for ${selectedNames.length} item(s) has been sent to the Row ${rowStr} distributor.`,
        buttons: [{ text: 'Back to Dashboard', onPress: () => navigation.replace('ParticipantDashboard') }]
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

      {/* Header */}
      <LinearGradient
        colors={[colors.primaryLight, colors.primaryDark]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Havan Ingredients</Text>
              <Text style={styles.headerSub}>
                {seatRow ? `Row ${seatRow}` : 'Loading...'}
                {' · '}Select items you need
              </Text>
            </View>
            <View style={{ width: 34 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Items Grid */}
      <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Core Havan Items */}
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

          {/* Section: Additional Items */}
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

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      {/* Bottom bar */}
      {selectedIds.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</Text>
            <Text style={styles.bottomSub}>Will be sent to Row {seatRow ? String(seatRow).padStart(2, '0') : '--'} distributor</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 8,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: typography.extrabold, color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scrollContent: { padding: 16 },

  sectionTitle: {
    fontSize: 15, fontWeight: typography.bold, color: colors.navy,
    marginBottom: 12, letterSpacing: -0.2,
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
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  itemIcon: { fontSize: 28, marginBottom: 6 },
  itemName: {
    fontSize: 11, fontWeight: typography.bold,
    color: colors.navy, textAlign: 'center', lineHeight: 14,
  },

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
