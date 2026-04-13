import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Animated, Modal, Dimensions,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { EXTRA_ITEMS } from '../data/inventoryData';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GlobalWarehouseSheet() {
  const {
    showAddSheet,
    items,
    selectedExtraItems,
    toggleExtraItem,
    closeAddSheet,
    submitPushItems,
  } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const activeIds = new Set(items.map((i) => i.id));

  useEffect(() => {
    if (showAddSheet) {
      setIsSubmitting(false);
      setSubmitted(false);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [showAddSheet]);

  const handleSubmit = () => {
    if (selectedExtraItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => submitPushItems(), 200);
    }, 800);
  };

  const canSubmit = selectedExtraItems.length > 0 && !isSubmitting;

  if (!showAddSheet) return null;

  return (
    <Modal transparent animationType="none" visible={showAddSheet} onRequestClose={closeAddSheet}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAddSheet} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>Global Warehouse Items</Text>
        <Text style={styles.subtitle}>
          Select additional supplementary items to push to all active Line Distributors.
        </Text>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {EXTRA_ITEMS.map((item) => {
            const isActive = activeIds.has(item.id);
            const isSelected = selectedExtraItems.includes(item.id);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.itemRow,
                  isSelected && !isActive && styles.itemRowSelected,
                  isActive && styles.itemRowActive,
                ]}
                onPress={() => !isActive && toggleExtraItem(item.id)}
                disabled={isActive}
              >
                <Text style={[styles.itemIcon, isActive && styles.dimmed]}>{item.icon}</Text>
                <Text style={[styles.itemName, isActive && styles.dimmed]}>{item.name}</Text>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                ) : (
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isSelected ? colors.primary : colors.greyText}
                  />
                )}
              </Pressable>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>

        <Pressable
          style={[
            styles.submitBtn,
            !canSubmit && !submitted && styles.submitBtnDisabled,
            submitted && styles.submitBtnSuccess,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting && !submitted ? (
            <Text style={styles.submitBtnText}>Pushing...</Text>
          ) : submitted ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.submitBtnText}>Pushed!</Text>
            </>
          ) : (
            <>
              <Ionicons name="arrow-up-circle-outline" size={20} color={colors.white} />
              <Text style={styles.submitBtnText}>
                Push to Distributors ({selectedExtraItems.length})
              </Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={closeAddSheet}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.greyLight,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.small,
    color: colors.greyText,
    marginBottom: 16,
    lineHeight: 18,
  },
  list: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.greyLight,
    backgroundColor: colors.white,
    marginBottom: 8,
    gap: 12,
  },
  itemRowSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5EE',
  },
  itemRowActive: {
    opacity: 0.6,
  },
  itemIcon: {
    fontSize: 22,
  },
  dimmed: {
    opacity: 0.7,
  },
  itemName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.navy,
  },
  activeBadge: {
    backgroundColor: '#E8FBF0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: colors.green,
    fontSize: typography.small,
    fontWeight: typography.bold,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: 'rgba(255, 107, 0)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  submitBtnDisabled: {
    backgroundColor: colors.greyLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnSuccess: {
    backgroundColor: colors.green,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: typography.bold,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.greyText,
    fontSize: typography.body,
    fontWeight: typography.semibold,
  },
});
