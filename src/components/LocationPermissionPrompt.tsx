import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export function LocationPermissionPrompt({ onRetry }: { onRetry: () => void }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.foreground }]}>Location permission required</Text>
      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Location Demo uses location access to find nearby places.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Allow location" style={[styles.button, { backgroundColor: theme.primary }]} onPress={onRetry}>
        <Text style={[styles.buttonText, { color: theme.onPrimary }]}>Allow location</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
  subtitle: { textAlign: 'center', opacity: 0.75, marginBottom: 20 },
  button: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { fontWeight: '700' },
});
