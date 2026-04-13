import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { AdminRequest } from '../data/inventoryData';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import SurfaceCard from './SurfaceCard';

interface Props {
  request: AdminRequest;
  index: number;
}

export default function AdminRequestCard({ request, index }: Props) {
  const { acknowledgeRequest, dispatchRequest } = useAppStore();
  const btnScale = useRef(new Animated.Value(1)).current;
  
  const isPending = request.status === 'pending';
  const isAck = request.status === 'acknowledged';
  const isDispatched = request.status === 'dispatched';

  const handleAnimate = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }),
    ]).start(callback);
  };

  const handleACK = () => {
    handleAnimate(() => acknowledgeRequest(request.id));
  };
  const handleDispatch = () => {
    handleAnimate(() => dispatchRequest(request.id));
  };

  return (
    <SurfaceCard style={[styles.card, { borderLeftColor: isPending ? colors.primary : colors.green }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.rowNum}>ROW {request.row}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={colors.greyText} />
            <Text style={styles.time}>{request.time}</Text>
          </View>
        </View>
        {!isPending && (
          <View style={[
            styles.statusBadge, 
            isAck ? styles.ackBadge : styles.dispatchedBadge
          ]}>
            <Text style={[
              styles.statusText, 
              isAck ? styles.ackText : styles.dispatchedText
            ]}>
              {isAck ? 'Acknowledged' : 'Dispatched'}
            </Text>
          </View>
        )}
      </View>

      {/* Items Box */}
      <View style={styles.itemsBox}>
        <Text style={styles.itemsLabel}>Requested Inventory:</Text>
        <Text style={styles.itemsText}>{request.items}</Text>
      </View>

      {/* Action Buttons */}
      {(isPending || isAck) && (
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable 
            style={[styles.actionBtn, isAck ? styles.dispatchBtn : styles.ackBtn]} 
            onPress={isAck ? handleDispatch : handleACK}
          >
            <Ionicons 
              name={isAck ? "send" : "checkmark-done"} 
              size={18} 
              color={colors.white} 
            />
            <Text style={styles.actionBtnText}>
              {isAck ? "Dispatch Items" : "Acknowledge"}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rowNum: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: colors.greyText,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ackBadge: {
    backgroundColor: colors.navySubtle,
  },
  dispatchedBadge: {
    backgroundColor: colors.greenSubtle,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.extrabold,
    textTransform: 'uppercase',
  },
  ackText: {
    color: colors.navy,
  },
  dispatchedText: {
    color: colors.green,
  },
  itemsBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemsLabel: {
    fontSize: 11,
    fontWeight: typography.bold,
    color: colors.greyText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  itemsText: {
    fontSize: 16,
    fontWeight: typography.bold,
    color: colors.navy,
    lineHeight: 22,
  },
  actionBtn: {
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ackBtn: {
    backgroundColor: colors.navy,
  },
  dispatchBtn: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: typography.bold,
  },
});
