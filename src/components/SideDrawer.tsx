import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from './BrandMark';
import { useAppTheme } from '../contexts/ThemeContext';

export function SideDrawer({
  open,
  onClose,
  goPreferences,
  goDiscover,
  goHistory,
  goWishlist,
  goLegal,
}: {
  open: boolean;
  onClose: () => void;
  goPreferences: () => void;
  goDiscover: () => void;
  goHistory: () => void;
  goWishlist: () => void;
  goLegal: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={open} animationType="slide" transparent>
      <Pressable style={[styles.backdrop, { backgroundColor: `${theme.foreground}66` }]} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: theme.card, borderRightColor: theme.border }] }>
        <View style={styles.brandRow}>
          <BrandMark size={44} />
          <Text style={[styles.title, { color: theme.foreground }]}>Location Demo</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open location discovery" style={styles.item} onPress={goDiscover}><Text style={{ color: theme.foreground }}>Discover</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open visited places history" style={styles.item} onPress={goHistory}><Text style={{ color: theme.foreground }}>Visited places history</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open wishlist" style={styles.item} onPress={goWishlist}><Text style={{ color: theme.foreground }}>Wishlist</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open demo notes" style={styles.item} onPress={goLegal}><Text style={{ color: theme.foreground }}>Demo notes</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" style={styles.item} onPress={goPreferences}><Text style={{ color: theme.foreground }}>Settings</Text></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, padding: 20, gap: 14, borderRightWidth: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  item: { paddingVertical: 10 },
});
