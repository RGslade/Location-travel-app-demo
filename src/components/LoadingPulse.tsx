import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export function LoadingPulse() {
  const { theme } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 40, alignItems: 'center' },
});
