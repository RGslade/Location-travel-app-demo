import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from './BrandMark';
import { useAppTheme } from '../contexts/ThemeContext';

export function AppHeader({
  title,
  onMenu,
  onToggleView,
  mapView,
}: {
  title: string;
  onMenu: () => void;
  onToggleView?: () => void;
  mapView: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open menu" style={styles.menuButton} onPress={onMenu}>
        <Text style={[styles.menuText, { color: theme.foreground }]}>☰</Text>
      </Pressable>
      <View style={styles.heading}>
        <BrandMark size={32} />
        <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      </View>
      <View style={styles.rightButtons}>
        {onToggleView ? <Pressable accessibilityRole="button" accessibilityLabel={mapView ? 'Show list view' : 'Show map view'} style={styles.button} onPress={onToggleView}>
          <Text style={[styles.buttonText, { color: theme.foreground }]}>{mapView ? 'List' : 'Map'}</Text>
        </Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '700' },
  rightButtons: { flexDirection: 'row', gap: 8 },
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  menuText: { fontSize: 20, fontWeight: '600' },
  button: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  buttonText: { fontWeight: '600' },
});
