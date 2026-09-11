import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVisitedPlaces } from '../hooks/useVisitedPlaces';
import { HistoryScreenProps } from '../navigation/types';
import { PageHeader } from '../components/PageHeader';
import { useAppTheme } from '../contexts/ThemeContext';

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { visitedPlaces, clearVisited } = useVisitedPlaces();
  const [selected, setSelected] = React.useState<string[]>([]);
  const { theme } = useAppTheme();
  const selectedSet = new Set(selected);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const clearSelected = () => Alert.alert('Clear selected history?', 'These visited places will be removed from your history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: () => { void clearVisited(selected); setSelected([]); } }]);
  const clearAll = () => Alert.alert('Clear history?', 'All visited places will be removed from your history.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear all', style: 'destructive', onPress: () => { void clearVisited(); setSelected([]); } }]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <PageHeader title="Visited places history" navigation={navigation} />
        {visitedPlaces.length > 0 ? <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Total visited: {visitedPlaces.length}</Text> : null}
        {visitedPlaces.length > 0 ? <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => setSelected(selected.length === visitedPlaces.length ? [] : visitedPlaces.map((place) => place.id))}><Text style={[styles.link, { color: theme.accent }]}>{selected.length === visitedPlaces.length ? 'Deselect all' : 'Select all'}</Text></Pressable><Pressable accessibilityRole="button" disabled={selected.length === 0} onPress={clearSelected}><Text style={[styles.link, { color: selected.length ? theme.destructive : theme.secondaryText }]}>Clear selected</Text></Pressable><Pressable accessibilityRole="button" onPress={clearAll}><Text style={[styles.link, { color: theme.destructive }]}>Clear all</Text></Pressable></View> : null}

        <FlatList
          data={visitedPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selectedSet.has(item.id) }} onPress={() => toggle(item.id)} style={[styles.item, { backgroundColor: theme.card, borderColor: selectedSet.has(item.id) ? theme.primary : theme.border }]}><Text style={[styles.name, { color: theme.foreground }]}>{selectedSet.has(item.id) ? '✓ ' : ''}{item.name}</Text><Text style={[styles.address, { color: theme.secondaryText }]}>{item.address}</Text><Text style={[styles.date, { color: theme.secondaryText }]}>Visited {formatDate(item.savedAt)}</Text></Pressable>
          )}
          contentContainerStyle={[styles.list, visitedPlaces.length === 0 && styles.emptyList]}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.secondaryText }]}>No places marked as visited yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 16 },
  back: { fontWeight: '700', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginBottom: 14, opacity: 0.7 },
  item: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  empty: { opacity: 0.7, marginTop: 20 },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 10 },
  link: { fontWeight: '700' },
  name: { fontWeight: '700', fontSize: 16 },
  address: { marginTop: 4 },
  date: { fontSize: 12, marginTop: 6 },
});

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'date unavailable' : date.toLocaleString(); }
