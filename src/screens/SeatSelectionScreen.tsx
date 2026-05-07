import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ActivityIndicator, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../utils/firebase';
import { collection, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import CustomAlert from '../components/CustomAlert';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SeatSelection'>;
};

const TOTAL_ROWS = 15;
const SEATS_PER_ROW = 15;
const GAP = 3;
const ROW_LABEL_W = 22;
const H_PADDING = 12; // padding each side

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Seat size so all 15 cols fit in width
const AVAILABLE_W = SCREEN_W - H_PADDING * 2 - ROW_LABEL_W - GAP * SEATS_PER_ROW;
const SEAT_W = Math.floor(AVAILABLE_W / SEATS_PER_ROW);

// Seat size so all 15 rows fit in height
// Estimated fixed chrome: header ~130, stage ~30, legend ~36, confirmBar ~80, colHeader ~18
const FIXED_H = 294;
const AVAILABLE_H = SCREEN_H - FIXED_H - GAP * TOTAL_ROWS - 18;
const SEAT_H = Math.floor(AVAILABLE_H / TOTAL_ROWS);

// Use the smaller to keep cells square and ensure both axes fit
const SEAT = Math.min(SEAT_W, SEAT_H);

interface SeatData {
  row: number;
  col: number;
  takenBy: string | null;
}

export default function SeatSelectionScreen({ navigation }: Props) {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [myCurrentSeat, setMyCurrentSeat] = useState<{ row: number; col: number } | null>(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', buttons: [] as any[]
  });

  const headerAnim = useRef(new Animated.Value(0)).current;
  const gridAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(gridAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    const uid = auth.currentUser?.uid;
    if (uid) {
      getDoc(doc(db, 'users', uid)).then((snap) => {
        if (snap.exists() && snap.data().seat) {
          setMyCurrentSeat(snap.data().seat);
        }
      });
    }

    const unsubscribe = onSnapshot(collection(db, 'seats'), (snapshot) => {
      const takenMap: Record<string, string> = {};
      snapshot.forEach((d) => { takenMap[d.id] = d.data().takenBy; });

      const grid: SeatData[] = [];
      for (let r = 1; r <= TOTAL_ROWS; r++) {
        for (let c = 1; c <= SEATS_PER_ROW; c++) {
          grid.push({ row: r, col: c, takenBy: takenMap[`${r}-${c}`] ?? null });
        }
      }
      setSeats(grid);
    });

    return () => unsubscribe();
  }, []);

  const getSeatStatus = (seat: SeatData): 'mine' | 'taken' | 'selected' | 'free' => {
    const uid = auth.currentUser?.uid;
    if (seat.takenBy === uid) return 'mine';
    if (seat.takenBy) return 'taken';
    if (selectedSeat?.row === seat.row && selectedSeat?.col === seat.col) return 'selected';
    return 'free';
  };

  const handleSeatPress = (seat: SeatData) => {
    const uid = auth.currentUser?.uid;
    if (seat.takenBy && seat.takenBy !== uid) return;
    if (getSeatStatus(seat) === 'mine') {
      navigation.replace('ParticipantDashboard');
      return;
    }
    setSelectedSeat({ row: seat.row, col: seat.col });
  };

  const handleConfirm = async () => {
    if (!selectedSeat) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setConfirming(true);
    try {
      if (myCurrentSeat) {
        const oldKey = `${myCurrentSeat.row}-${myCurrentSeat.col}`;
        await setDoc(doc(db, 'seats', oldKey), { takenBy: null, row: myCurrentSeat.row, col: myCurrentSeat.col });
      }
      const seatKey = `${selectedSeat.row}-${selectedSeat.col}`;
      await setDoc(doc(db, 'seats', seatKey), {
        takenBy: uid, row: selectedSeat.row, col: selectedSeat.col, claimedAt: new Date(),
      });
      await setDoc(doc(db, 'users', uid), { seat: { row: selectedSeat.row, col: selectedSeat.col } }, { merge: true });
      setMyCurrentSeat(selectedSeat);
      setSelectedSeat(null);
      setAlertConfig({
        visible: true,
        title: '🎉 Seat Confirmed!',
        message: `You are now seated at Row ${selectedSeat.row}, Seat ${selectedSeat.col}.`,
        buttons: [{ text: 'Dashboard', onPress: () => navigation.replace('ParticipantDashboard') }]
      });
    } catch (e: any) {
      setAlertConfig({ visible: true, title: 'Error', message: e.message, buttons: [{ text: 'OK' }] });
    } finally {
      setConfirming(false);
    }
  };

  const taken = seats.filter(s => s.takenBy).length;
  const free = seats.length - taken;

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
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Animated.View style={{ opacity: headerAnim }}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Choose Your Seat</Text>
                <Text style={styles.headerSub}>Tap a seat to select it</Text>
              </View>
              <Pressable style={styles.iconBtn} onPress={() => navigation.replace('ParticipantDashboard')}>
                <Ionicons name="home-outline" size={18} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <StatChip color="#2ECC71" label={`${free} Free`} />
              <StatChip color="#E74C3C" label={`${taken} Taken`} />
              {myCurrentSeat && (
                <StatChip color="#FFD700" label={`Mine: R${myCurrentSeat.row} S${myCurrentSeat.col}`} />
              )}
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Stage Indicator ── */}
      <View style={styles.stageBar}>
        <Ionicons name="flame" size={11} color={colors.primary} />
        <Text style={styles.stageText}>🔥  YAGNA KUND — FRONT  🔥</Text>
        <Ionicons name="flame" size={11} color={colors.primary} />
      </View>

      {/* ── Grid ── */}
      <Animated.View style={[styles.gridContainer, { opacity: gridAnim }]}>
        {/* Column header numbers */}
        <View style={styles.colHeaderRow}>
          <View style={{ width: ROW_LABEL_W }} />
          {Array.from({ length: SEATS_PER_ROW }, (_, i) => i + 1).map(col => (
            <View key={col} style={{ width: SEAT, marginHorizontal: GAP / 2, alignItems: 'center' }}>
              <Text style={styles.colHeaderText}>{col}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {Array.from({ length: TOTAL_ROWS }, (_, ri) => ri + 1).map((rowNum) => {
          const rowSeats = seats.filter(s => s.row === rowNum);
          return (
            <View key={rowNum} style={styles.rowWrap}>
              <View style={{ width: ROW_LABEL_W, alignItems: 'center' }}>
                <Text style={styles.rowLabelText}>{rowNum}</Text>
              </View>
              {rowSeats.map((seat) => {
                const status = getSeatStatus(seat);
                return (
                  <Pressable
                    key={`${seat.row}-${seat.col}`}
                    style={({ pressed }) => [
                      styles.seat,
                      status === 'free' && styles.seatFree,
                      status === 'taken' && styles.seatTaken,
                      status === 'selected' && styles.seatSelected,
                      status === 'mine' && styles.seatMine,
                      pressed && status !== 'taken' && { opacity: 0.7, transform: [{ scale: 0.88 }] },
                    ]}
                    onPress={() => handleSeatPress(seat)}
                    disabled={status === 'taken'}
                  >
                    {status === 'taken' && <Ionicons name="person" size={SEAT * 0.4} color="#fff" />}
                    {status === 'mine' && <Ionicons name="star" size={SEAT * 0.4} color="#fff" />}
                    {status === 'selected' && <Ionicons name="checkmark" size={SEAT * 0.4} color="#fff" />}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </Animated.View>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <LegendItem color="#2ECC71" label="Free" />
        <LegendItem color="#E74C3C" label="Taken" />
        <LegendItem color={colors.primary} label="Selected" />
        <LegendItem color="#FFD700" label="Mine" />
      </View>

      {/* ── Confirm / Dashboard bar ── */}
      {(selectedSeat || myCurrentSeat) && (
        <View style={styles.confirmBar}>
          <View>
            <Text style={styles.confirmLabel}>
              {selectedSeat ? 'Selected' : 'Your Seat'}
            </Text>
            <Text style={styles.confirmSeat}>
              {selectedSeat
                ? `Row ${selectedSeat.row} · Seat ${selectedSeat.col}`
                : `Row ${myCurrentSeat!.row} · Seat ${myCurrentSeat!.col}`}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }]}
            onPress={selectedSeat ? handleConfirm : () => navigation.replace('ParticipantDashboard')}
            disabled={confirming}
          >
            {confirming
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.confirmBtnText}>{selectedSeat ? 'Confirm Seat' : 'Dashboard →'}</Text>
            }
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatChip({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    elevation: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    marginBottom: 10,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: typography.extrabold, color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  statsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, gap: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  statText: { fontSize: 10, color: '#fff', fontWeight: typography.medium },

  stageBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1, borderBottomColor: '#FFD9A8',
  },
  stageText: { fontSize: 9, fontWeight: typography.bold, color: colors.primary, letterSpacing: 1.5 },

  gridContainer: {
    flex: 1,
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
    justifyContent: 'center',
  },

  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  colHeaderText: { fontSize: 7, fontWeight: typography.bold, color: colors.greyText, textAlign: 'center' },

  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: GAP,
  },
  rowLabelText: { fontSize: 7, fontWeight: typography.bold, color: colors.greyText },

  seat: {
    width: SEAT,
    height: SEAT,
    borderRadius: Math.max(3, SEAT * 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: GAP / 2,
    borderWidth: 1,
  },
  seatFree: { backgroundColor: '#E8F8F0', borderColor: '#2ECC71' },
  seatTaken: { backgroundColor: '#FDECEA', borderColor: '#E74C3C' },
  seatSelected: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  seatMine: { backgroundColor: '#FFD700', borderColor: '#E6C000' },

  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, color: colors.greyText, fontWeight: typography.medium },

  confirmBar: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 10,
  },
  confirmLabel: { fontSize: 11, color: colors.greyText },
  confirmSeat: { fontSize: 16, fontWeight: typography.extrabold, color: colors.navy },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 13,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 7, elevation: 5,
    minWidth: 126, alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 13, fontWeight: typography.bold },
});
