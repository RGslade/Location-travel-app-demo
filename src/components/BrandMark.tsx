import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

const brandIcon = require('../../assets/images/icon.png');

export function BrandMark({ size = 36, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  const { theme } = useAppTheme();
  return (
    <Image
      source={brandIcon}
      accessibilityRole="image"
      accessibilityLabel="Location demo icon"
      style={[styles.image, { width: size, height: size, borderRadius: size * 0.22, backgroundColor: theme.background }, style]}
    />
  );
}

const styles = StyleSheet.create({
  image: { alignSelf: 'center' },
});
