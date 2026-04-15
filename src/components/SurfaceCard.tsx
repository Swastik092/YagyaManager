import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  innerStyle?: ViewStyle | ViewStyle[];
}

export default function SurfaceCard({ children, style, innerStyle }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inner: {
    padding: 16,
  },
});
