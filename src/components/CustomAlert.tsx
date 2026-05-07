import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export default function CustomAlert({ 
  visible, 
  title, 
  message, 
  buttons = [], 
  onClose,
  icon = "alert-circle",
  iconColor = colors.red
}: CustomAlertProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: `${iconColor}15` }]}>
              <Ionicons name={icon} size={32} color={iconColor} />
            </View>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {buttons.length === 0 ? (
              <Pressable 
                style={[styles.button, { backgroundColor: colors.primary }]} 
                onPress={onClose}
              >
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            ) : (
              buttons.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                return (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.button,
                      isCancel ? styles.buttonCancel : { backgroundColor: colors.primary },
                      pressed && { opacity: 0.8 },
                      buttons.length > 1 && { flex: 1, marginHorizontal: 4 }
                    ]}
                    onPress={() => {
                      if (btn.onPress) btn.onPress();
                      onClose();
                    }}
                  >
                    <Text style={[styles.buttonText, isCancel && styles.buttonTextCancel]}>
                      {btn.text}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 24,
  },
  alertBox: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body,
    color: colors.greyText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonCancel: {
    backgroundColor: '#F1F5F9',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: typography.bold,
  },
  buttonTextCancel: {
    color: colors.navy,
  },
});
