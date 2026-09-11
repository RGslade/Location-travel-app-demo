import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVisitedPlaces } from '../hooks/useVisitedPlaces';
import { useWishlist } from '../hooks/useWishlist';
import { PlaceDetailsScreenProps } from '../navigation/types';
import { useAppTheme } from '../contexts/ThemeContext';

const categoryLabels: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  bar: 'Bar',
  park: 'Park',
  museum: 'Museum',
  tourist_attraction: 'Attraction',
  shopping_mall: 'Shopping',
  gym: 'Fitness',
  spa: 'Wellness',
  gas_station: 'Service station',
};

function formatPlaceType(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function getGoogleSearchUrl(place: { name: string; address: string }) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${place.name}, ${place.address}`)}`;
}

function getDirectionsUrl(place: { name: string; latitude: number; longitude: number }) {
  const destination = `${place.latitude},${place.longitude}`;
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
  }
  return `google.navigation:q=${encodeURIComponent(destination)}`;
}

export function PlaceDetailsScreen({ navigation, route }: PlaceDetailsScreenProps) {
  const { place } = route.params;
  const { theme } = useAppTheme();
  const { addVisited, isVisited } = useVisitedPlaces();
  const { addToWishlist, isWishlisted, removeFromWishlist } = useWishlist();
  const [busy, setBusy] = useState(false);
  const visited = isVisited(place.id);
  const wishlisted = isWishlisted(place.id);
  const placeTypes = Array.from(new Set([place.primaryType, ...place.types].filter((value): value is string => Boolean(value)))).slice(0, 6);

  const saveVisited = async () => {
    setBusy(true);
    try {
      await addVisited(place);
      if (wishlisted) await removeFromWishlist(place.id);
      Alert.alert('Added to history', `${place.name} will remain in your visited history until you remove it.`);
    } finally {
      setBusy(false);
    }
  };

  const saveWishlist = async () => {
    setBusy(true);
    try {
      await addToWishlist(place);
      Alert.alert('Added to wishlist', `${place.name} is now on your list of places to explore.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.backHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.backButtonText, { color: theme.foreground }]}>Back</Text>
          </Pressable>
          <Text style={[styles.backHeaderTitle, { color: theme.foreground }]}>Place details</Text>
        </View>
        <Text style={[styles.title, { color: theme.foreground }]}>{place.name}</Text>
        <Text style={[styles.address, { color: theme.secondaryText }]}>{place.address}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.infoHeading, { color: theme.foreground }]}>Place information</Text>
          <Text style={[styles.meta, { color: theme.secondaryText }]}>Category: {categoryLabels[place.category] ?? formatPlaceType(place.category)}</Text>
          {placeTypes.length > 0 ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Type: {placeTypes.map(formatPlaceType).join(', ')}</Text> : null}
          {place.openNow !== undefined ? <Text style={[styles.meta, { color: place.openNow ? theme.accent : theme.destructive }]}>{place.openNow ? 'Open now' : 'Currently closed'}</Text> : null}
          {visited || wishlisted ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Status: {visited ? 'Visited' : 'Wishlisted'}</Text> : null}
          {place.rating !== undefined ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Rating: {place.rating.toFixed(1)}{place.userRatingsTotal !== undefined ? ` from ${place.userRatingsTotal.toLocaleString()} ratings` : ''}</Text> : null}
          {place.priceLevel ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Price level: {place.priceLevel.replace('PRICE_LEVEL_', '').replace(/_/g, ' ').toLowerCase()}</Text> : null}
          {place.editorialSummary ? <Text style={[styles.meta, { color: theme.secondaryText }]}>About: {place.editorialSummary}</Text> : null}
          {place.nationalPhoneNumber ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Phone: {place.nationalPhoneNumber}</Text> : null}
          {place.websiteUri ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Website available</Text> : null}
          {place.travelerTags.length > 0 ? <Text style={[styles.meta, { color: theme.secondaryText }]}>Good for: {place.travelerTags.map(formatPlaceType).join(', ')}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Search for ${place.name} on Google`}
          style={styles.googleLink}
          onPress={() => void Linking.openURL(getGoogleSearchUrl(place)).catch(() => Alert.alert('Google unavailable', 'We could not open Google Search. Please try again later.'))}
        >
          <Text style={[styles.googleLinkText, { color: theme.accent }]}>Get more info on Google</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Get directions to ${place.name}`}
          style={[styles.secondaryAction, { borderColor: theme.border }]}
          onPress={() => void (async () => {
            try {
              await Clipboard.setStringAsync(`${place.name}, ${place.address}\n${place.latitude}, ${place.longitude}`);
              await Linking.openURL(getDirectionsUrl(place));
            } catch {
              Alert.alert('Maps unavailable', 'We could not open directions for this place. Its location has been copied so you can enter it manually.');
            }
          })()}
        >
          <View style={styles.actionContent}>
            <Ionicons name="navigate-outline" size={18} color={theme.foreground} />
            <Text style={[styles.actionText, { color: theme.foreground }]}>Get directions</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: visited, disabled: busy || visited }} style={[styles.action, { backgroundColor: theme.primary }, visited && { backgroundColor: theme.muted }]} onPress={() => void saveVisited()} disabled={busy || visited}>
          <Text style={[styles.actionText, { color: visited ? theme.secondaryText : theme.onPrimary }]}>{visited ? 'Visited' : 'Mark as Visited'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: wishlisted, disabled: busy || wishlisted }} style={[styles.secondaryAction, { borderColor: theme.border }]} onPress={() => void saveWishlist()} disabled={busy || wishlisted}>
          <Text style={[styles.actionText, { color: theme.foreground }]}>{wishlisted ? 'On your wishlist' : 'Add to wishlist'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, paddingBottom: 48 },
  backHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backButton: { minHeight: 44, justifyContent: 'center', paddingRight: 14 },
  backButtonText: { fontWeight: '700' },
  backHeaderTitle: { fontSize: 24, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800' },
  address: { fontSize: 16, lineHeight: 22, marginTop: 8 },
  infoCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 18 },
  infoHeading: { fontSize: 16, fontWeight: '800' },
  meta: { marginTop: 8, fontWeight: '600' },
  googleLink: { alignSelf: 'flex-start', paddingVertical: 12, marginTop: 4 },
  googleLinkText: { fontWeight: '800', textDecorationLine: 'underline' },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  action: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 28 },
  secondaryAction: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  actionText: { fontWeight: '700' },
});
