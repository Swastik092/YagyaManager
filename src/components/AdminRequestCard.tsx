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
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.rowNum}>ROW {request.row}</Text>
          <Text style={styles.time}>{request.time}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          isPending ? styles.pendingBadge : (isAck ? styles.ackBadge : styles.dispatchedBadge)
        ]}>
          <Text style={[
            styles.statusText, 
            isPending ? styles.pendingText : (isAck ? styles.ackText : styles.dispatchedText)
          ]}>
            {request.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsLabel}>Requested Items:</Text>
        <Text style={styles.itemsText}>{request.items}</Text>
      </View>

      {(isPending || isAck) && (
        <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 12 }}>
          <Pressable 
            style={[styles.actionBtn, isAck ? styles.dispatchBtn : styles.ackBtn]} 
            onPress={isAck ? handleDispatch : handleACK}
          >
            <Text style={styles.actionBtnText}>
              {isAck ? "Dispatch stock" : "Acknowledge"}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 5,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowNum: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.navy,
  },
  time: {
    fontSize: 12,
    color: colors.greyText,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadge: { backgroundColor: '#F0F0F0' },
  ackBadge: { backgroundColor: '#E8E8FF' },
  dispatchedBadge: { backgroundColor: '#E8FBF0' },
  statusText: {
    fontSize: 10,
    fontWeight: typography.bold,
  },
  pendingText: { color: '#666' },
  ackText: { color: colors.navy },
  dispatchedText: { color: colors.green },
  itemsContainer: {
    marginTop: 4,
  },
  itemsLabel: {
    fontSize: 11,
    color: colors.greyText,
    fontWeight: typography.bold,
    marginBottom: 2,
  },
  itemsText: {
    fontSize: 16,
    color: colors.navy,
    fontWeight: typography.medium,
  },
  actionBtn: {
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackBtn: {
    backgroundColor: colors.navy,
  },
  dispatchBtn: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: typography.bold,
  },
});
