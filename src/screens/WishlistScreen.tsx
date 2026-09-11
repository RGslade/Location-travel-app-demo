import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageHeader } from '../components/PageHeader';
import { useWishlist } from '../hooks/useWishlist';
import { WishlistScreenProps } from '../navigation/types';
import { useAppTheme } from '../contexts/ThemeContext';

export function WishlistScreen({ navigation }: WishlistScreenProps) {
  const { theme } = useAppTheme();
  const { wishlist, clearWishlist } = useWishlist();
  const [selected, setSelected] = useState<string[]>([]);
  const selectedSet = new Set(selected);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const clearSelected = () => Alert.alert('Clear selected wishlist items?', 'These places will be removed from your wishlist.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => { void clearWishlist(selected); setSelected([]); } }]);
  const clearAll = () => Alert.alert('Clear wishlist?', 'All wishlist items will be removed.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear all', style: 'destructive', onPress: () => { void clearWishlist(); setSelected([]); } }]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <PageHeader title="Wishlist" navigation={navigation} />
        {wishlist.length > 0 ? <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{wishlist.length} place{wishlist.length === 1 ? '' : 's'} to explore</Text> : null}
        {wishlist.length > 0 ? <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => setSelected(selected.length === wishlist.length ? [] : wishlist.map((place) => place.id))}><Text style={[styles.link, { color: theme.accent }]}>{selected.length === wishlist.length ? 'Deselect all' : 'Select all'}</Text></Pressable><Pressable accessibilityRole="button" disabled={selected.length === 0} onPress={clearSelected}><Text style={[styles.link, { color: selected.length ? theme.destructive : theme.secondaryText }]}>Clear selected</Text></Pressable><Pressable accessibilityRole="button" onPress={clearAll}><Text style={[styles.link, { color: theme.destructive }]}>Clear all</Text></Pressable></View> : null}
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, wishlist.length === 0 && styles.emptyList]}
          renderItem={({ item }) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selectedSet.has(item.id) }} style={[styles.item, { backgroundColor: theme.card, borderColor: selectedSet.has(item.id) ? theme.primary : theme.border }]} onPress={() => toggle(item.id)}><Text style={[styles.name, { color: theme.foreground }]}>{selectedSet.has(item.id) ? '✓ ' : ''}{item.name}</Text><Text style={[styles.address, { color: theme.secondaryText }]}>{item.address}</Text><Text style={[styles.date, { color: theme.secondaryText }]}>Added {formatDate(item.savedAt)}</Text></Pressable>}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.secondaryText }]}>Your wishlist is empty. Open a place and add it when you find somewhere you want to explore.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'date unavailable' : date.toLocaleString(); }
const styles = StyleSheet.create({ safe: { flex: 1 }, container: { flex: 1, padding: 16 }, subtitle: { marginBottom: 8 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10 }, link: { fontWeight: '700' }, list: { paddingBottom: 24 }, emptyList: { flexGrow: 1, justifyContent: 'center' }, empty: { textAlign: 'center', lineHeight: 21, padding: 20 }, item: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 }, name: { fontWeight: '700', fontSize: 16 }, address: { marginTop: 4 }, date: { fontSize: 12, marginTop: 6 } });
