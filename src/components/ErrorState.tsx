import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export function ErrorState({
  title,
  message,
  onRetry,
  retryDisabled = false,
  retryLabel = 'Try again',
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  retryDisabled?: boolean;
  retryLabel?: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.secondaryText }]}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityState={{ disabled: retryDisabled }}
          style={[styles.button, { backgroundColor: theme.primary }, retryDisabled && styles.buttonDisabled]}
          onPress={onRetry}
          disabled={retryDisabled}
        >
          <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { marginTop: 8, opacity: 0.75, textAlign: 'center' },
  button: { marginTop: 16, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontWeight: '700' },
});
