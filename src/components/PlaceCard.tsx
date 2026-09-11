import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Place } from '../services/placesApi';
import { useAppTheme } from '../contexts/ThemeContext';

type Props = {
  place: Place;
  distanceText: string;
  visited: boolean;
  wishlisted: boolean;
  onPress: () => void;
};

const categoryLabels: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  park: 'Park',
  museum: 'Museum',
  tourist_attraction: 'Attraction',
  shopping_mall: 'Shopping',
  gym: 'Fitness',
  spa: 'Wellness',
};

export function PlaceCard({ place, distanceText, visited, wishlisted, onPress }: Props) {
  const { theme } = useAppTheme();
  return (
    <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityRole="button" accessibilityLabel={`Open details for ${place.name}, ${place.address}`} onPress={onPress}>
      <View style={styles.row}>
        <Text style={[styles.name, { color: theme.foreground }]}>{place.name}</Text>
        {visited || wishlisted ? <Text style={[styles.badge, { color: theme.foreground, backgroundColor: theme.muted }]}>{visited ? 'Visited' : 'Wishlisted'}</Text> : null}
      </View>
      <Text style={[styles.meta, { color: theme.secondaryText }]}>{place.address}</Text>
      <Text style={[styles.meta, { color: theme.secondaryText }]}>Category: {categoryLabels[place.category] ?? place.category}</Text>
      <Text style={[styles.meta, { color: theme.secondaryText }]}>{distanceText}</Text>
      {place.rating !== undefined ? (
        <Text style={[styles.meta, { color: theme.secondaryText }]}>
          Rating {place.rating.toFixed(1)}{place.userRatingsTotal !== undefined ? ` (${place.userRatingsTotal})` : ''}
        </Text>
      ) : null}
      {place.openNow !== undefined ? (
        <Text style={[styles.meta, { color: place.openNow ? theme.accent : theme.destructive, fontWeight: '700' }]}>{place.openNow ? 'Open' : 'Closed'}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontWeight: '700', fontSize: 18, flex: 1 },
  meta: { marginTop: 6, opacity: 0.85 },
  open: { fontWeight: '700' },
  closed: { fontWeight: '700' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
});
