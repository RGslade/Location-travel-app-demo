import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { PlaceCategory } from '../services/placesApi';
import { useAppTheme } from '../contexts/ThemeContext';
import { TravelMode } from '../hooks/usePreferences';

export const categories: { label: string; emoji: string; value: PlaceCategory }[] = [
  { label: 'Restaurants', emoji: '🍽️', value: 'restaurant' },
  { label: 'Cafés', emoji: '☕', value: 'cafe' },
  { label: 'Bars', emoji: '🍸', value: 'bar' },
  { label: 'Parks', emoji: '🌳', value: 'park' },
  { label: 'Museums', emoji: '🏛️', value: 'museum' },
  { label: 'Attractions', emoji: '📸', value: 'tourist_attraction' },
  { label: 'Shopping', emoji: '🛍️', value: 'shopping_mall' },
  { label: 'Fitness', emoji: '💪', value: 'gym' },
  { label: 'Wellness', emoji: '🧖', value: 'spa' },
];

const serviceStationCategory = { label: 'Service stations', emoji: '⛽', value: 'gas_station' as PlaceCategory };

export function CategoryChips({ selected, onSelect, travelMode }: { selected: PlaceCategory; onSelect: (value: PlaceCategory) => void; travelMode: TravelMode }) {
  const { theme } = useAppTheme();
  const visibleCategories = travelMode === 'driving' ? [...categories, serviceStationCategory] : categories;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap} style={styles.scroll}>
      {visibleCategories.map((category) => (
        <Pressable
          key={category.value}
          accessibilityRole="button"
          accessibilityLabel={`Filter by ${category.label}`}
          accessibilityState={{ selected: selected === category.value }}
          style={[styles.chip, { backgroundColor: theme.muted, borderColor: theme.border }, selected === category.value && { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => onSelect(category.value)}
        >
          <Text style={[styles.text, { color: selected === category.value ? theme.onPrimary : theme.foreground }]} numberOfLines={1}>{category.emoji} {category.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { height:50, flexGrow: 0 },
  wrap: { gap: 8, height: 40, alignItems: 'center', paddingHorizontal: 1 },
  chip: { height: 36, minWidth: 96, paddingHorizontal: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '600', flexShrink: 0 },
});
