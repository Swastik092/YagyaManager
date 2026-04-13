import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Role = 'distributor' | 'participant' | 'admin';
const ROLES: Role[] = ['distributor', 'participant', 'admin'];
const LABELS = { distributor: 'Distributor', participant: 'Participant', admin: 'Admin' };

interface Props {
  activeRole: Role;
  onSelect: (role: Role) => void;
}

export default function RoleToggle({ activeRole, onSelect }: Props) {
  const scaleValues = useRef(ROLES.map(() => new Animated.Value(1))).current;

  const handlePress = (role: Role, idx: number) => {
    Animated.sequence([
      Animated.timing(scaleValues[idx], { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleValues[idx], { toValue: 1, useNativeDriver: true }),
    ]).start();
    onSelect(role);
  };

  return (
    <View style={styles.container}>
      {ROLES.map((role, idx) => {
        const isActive = role === activeRole;
        return (
          <Animated.View key={role} style={[styles.pillWrap, { transform: [{ scale: scaleValues[idx] }] }]}>
            <Pressable
              onPress={() => handlePress(role, idx)}
              style={[styles.pill, isActive && styles.pillActive]}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {LABELS[role]}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.greyLight,
    borderRadius: 36,
    padding: 6,
    gap: 4,
  },
  pillWrap: {
    flex: 1,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pillText: {
    fontSize: typography.small,
    fontWeight: typography.semibold,
    color: colors.greyText,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: typography.bold,
  },
});
