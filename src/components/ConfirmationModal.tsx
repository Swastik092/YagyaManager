import React from 'react';
import { 
  View, Text, StyleSheet, Modal, Pressable, 
  Dimensions, Animated 
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'info' | 'warning';
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
}

export default function ConfirmationModal({ 
  visible, title, message, 
  confirmText = 'Delete', cancelText = 'Cancel', 
  onConfirm, onCancel, type = 'danger', iconName
}: ConfirmationModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  if (!visible) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  let defaultIcon: React.ComponentProps<typeof Ionicons>['name'] = 'information-circle';
  let iconColor = colors.navy;
  let bgColor = 'rgba(26, 26, 46, 0.1)';
  let confirmBgColor = colors.primary;

  if (isDanger) {
    defaultIcon = 'trash';
    iconColor = colors.red;
    bgColor = 'rgba(231, 76, 60, 0.1)';
    confirmBgColor = colors.red;
  } else if (isWarning) {
    defaultIcon = 'warning';
    iconColor = colors.primary;
    bgColor = 'rgba(255, 107, 0, 0.1)';
    confirmBgColor = colors.primary;
  }

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View style={[
          styles.card, 
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
        ]}>
          <View style={[
            styles.iconBox, 
            { backgroundColor: bgColor }
          ]}>
            <Ionicons 
              name={iconName || defaultIcon} 
              size={32} 
              color={iconColor} 
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.footer}>
            <Pressable 
              style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.btnPressed]} 
              onPress={onCancel}
            >
              <Text style={styles.cancelTxt}>{cancelText}</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.btn, 
                styles.confirmBtn, 
                pressed && styles.btnPressed,
                { backgroundColor: confirmBgColor }
              ]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmTxt}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: colors.greyText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cancelBtn: {
    backgroundColor: colors.greyLight,
  },
  confirmBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cancelTxt: {
    fontSize: 16,
    fontWeight: typography.bold,
    color: colors.greyText,
  },
  confirmTxt: {
    fontSize: 16,
    fontWeight: typography.bold,
    color: colors.white,
  },
});
