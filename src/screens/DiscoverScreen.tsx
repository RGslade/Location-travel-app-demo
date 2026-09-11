import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, Pressable, StyleSheet, Text, TextInput, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { ErrorState } from '../components/ErrorState';
import { CategoryChips } from '../components/CategoryChips';
import { LocationPermissionPrompt } from '../components/LocationPermissionPrompt';
import { PlaceCard } from '../components/PlaceCard';
import { SideDrawer } from '../components/SideDrawer';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePreferences } from '../hooks/usePreferences';
import { useVisitedPlaces } from '../hooks/useVisitedPlaces';
import { useWishlist } from '../hooks/useWishlist';
import {
  getPlacesRequestCooldownMs,
  checkPlacesHealth,
  getCachedNearbyPlaces,
  getPlacesCacheKey,
  Place,
  PlaceCategory,
  fetchNearbyPlaces,
  restorePlacesState,
} from '../services/placesApi';
import { formatDistance, haversineMeters } from '../services/geo';
import { useAppTheme } from '../contexts/ThemeContext';
import { DiscoverScreenProps } from '../navigation/types';
import { isLowMemoryAndroidDevice } from '../services/deviceResources';

const HOME_WORK_GEOCODE_TIMEOUT_MS = 5_000;
const UK_REGION_COUNTRIES = new Set(['England', 'Scotland', 'Wales', 'Northern Ireland']);
const savedPlaceGeocodeCache = new Map<string, Location.LocationGeocodedLocation[]>();
let sessionPlacesReadiness: { ready: boolean; error: string | null } | null = null;
let sessionInternetAvailable: boolean | null = null;
let sessionSavedLocation: { key: string; home: boolean; work: boolean; error: string | null } | null = null;

function getGeocodePlace(city: string, country: string) {
  const normalizedCountry = country.trim();
  const geocodeCountry = UK_REGION_COUNTRIES.has(normalizedCountry)
    ? `${normalizedCountry}, United Kingdom`
    : normalizedCountry;
  return [city.trim(), geocodeCountry].filter(Boolean).join(', ');
}

function hasSavedLocation(city: string, country: string) {
  return Boolean(city.trim() && country.trim());
}

function geocodeWithTimeout(place: string) {
  const cached = savedPlaceGeocodeCache.get(place);
  if (cached) return Promise.resolve(cached);

  return new Promise<Location.LocationGeocodedLocation[]>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Home or work location lookup timed out.')), HOME_WORK_GEOCODE_TIMEOUT_MS);
    void Location.geocodeAsync(place).then((matches) => {
      clearTimeout(timeout);
      savedPlaceGeocodeCache.set(place, matches);
      resolve(matches);
    }).catch((cause) => {
      clearTimeout(timeout);
      reject(cause);
    });
  });
}

export function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('restaurant');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showVisited, setShowVisited] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [mapView, setMapView] = useState(false);
  const lowMemoryAndroid = isLowMemoryAndroidDevice();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    radiusMeters,
    homeCity,
    homeCountry,
    workCity,
    distanceUnit,
    travelerProfiles,
    travelMode,
    advancedDetails,
  } = usePreferences();
  const { theme } = useAppTheme();
  const { coords, permissionGranted, loading, error: locationError, refreshLocation, requestPermission } = useGeolocation();
  const [internetAvailable, setInternetAvailable] = useState<boolean | null>(null);
  const [placesReady, setPlacesReady] = useState<boolean | null>(null);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const checkInternet = useCallback(async (force = false) => {
    if (!force && sessionInternetAvailable !== null) {
      setInternetAvailable(sessionInternetAvailable);
      return;
    }
    try {
      const state = await Network.getNetworkStateAsync();
      sessionInternetAvailable = state.isConnected === true && state.isInternetReachable === true;
      setInternetAvailable(sessionInternetAvailable);
    } catch (cause) {
      console.warn('[places] Internet connectivity check failed; discovery remains blocked:', cause);
      sessionInternetAvailable = false;
      setInternetAvailable(false);
    }
  }, []);

  const checkPlacesReadiness = useCallback(async (force = false) => {
    if (!force && sessionPlacesReadiness) {
      setPlacesReady(sessionPlacesReadiness.ready);
      setPlacesError(sessionPlacesReadiness.error);
      return;
    }
    setPlacesReady(null);
    try {
      await checkPlacesHealth();
      sessionPlacesReadiness = { ready: true, error: null };
      setPlacesError(null);
      setPlacesReady(true);
    } catch (cause) {
      console.warn('[places] Places service readiness check failed:', cause);
      const error = cause instanceof Error ? cause.message : 'Nearby places are not available right now. Please try again later.';
      sessionPlacesReadiness = { ready: false, error };
      setPlacesError(error);
      setPlacesReady(false);
    }
  }, []);

  useEffect(() => {
    const initialCheck = setTimeout(() => void checkInternet(), 0);
    const initialPlacesCheck = setTimeout(() => void checkPlacesReadiness(), 0);
    return () => {
      clearTimeout(initialCheck);
      clearTimeout(initialPlacesCheck);
    };
  }, [checkInternet, checkPlacesReadiness]);

  const { isVisited } = useVisitedPlaces();
  const { wishlist, clearWishlist } = useWishlist();
  const queryClient = useQueryClient();
  const [placesStateReady, setPlacesStateReady] = useState(false);
  const [loadedCacheKey, setLoadedCacheKey] = useState<string | null>(null);
  const [cooldownTick, setCooldownTick] = useState(0);
  const [foregroundSearchKey, setForegroundSearchKey] = useState(0);
  const [homeWorkCheckKey, setHomeWorkCheckKey] = useState<string | null>(null);
  const [insideHomeRadius, setInsideHomeRadius] = useState(false);
  const [insideWorkRadius, setInsideWorkRadius] = useState(false);
  const wishlistPromptedRef = useRef(false);
  const autoSearchPendingRef = useRef(true);
  const autoSearchInFlightRef = useRef(false);
  const declinedAutomaticSearchKeyRef = useRef<string | null>(null);
  const [searchStatusMessage, setSearchStatusMessage] = useState<string | null>(null);
  const [savedLocationError, setSavedLocationError] = useState<string | null>(null);
  const [savedLocationRetryKey, setSavedLocationRetryKey] = useState(0);
  const hasHomeLocation = hasSavedLocation(homeCity, homeCountry);
  const hasWorkLocation = hasSavedLocation(workCity, homeCountry);
  const hasSavedLocations = hasHomeLocation || hasWorkLocation;
  const effectiveInsideHomeRadius = hasHomeLocation && insideHomeRadius;
  const effectiveInsideWorkRadius = hasWorkLocation && insideWorkRadius;
  const effectiveSavedLocationError = hasSavedLocations ? savedLocationError : null;
  const placesCooldownMs = getPlacesRequestCooldownMs();
  const canShowPlacesRetry = placesStateReady && placesCooldownMs <= 0;
  void cooldownTick;

  useEffect(() => {
    void restorePlacesState().finally(() => setPlacesStateReady(true));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        autoSearchPendingRef.current = true;
        setForegroundSearchKey((value) => value + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;

    // An incomplete saved location is not valid input for geocoding. The
    // effective values above prevent stale state from blocking discovery.
    if (!hasSavedLocations) {
      sessionSavedLocation = null;
    }

    if (internetAvailable !== true || permissionGranted !== true || !coords || !hasSavedLocations) {
      return () => { active = false; };
    }

    const checkKey = `${coords.latitude}:${coords.longitude}:${radiusMeters}:${homeCity.trim()}:${homeCountry.trim()}:${workCity.trim()}`;
    if (sessionSavedLocation?.key === checkKey) {
      const cachedLocation = sessionSavedLocation;
      void Promise.resolve().then(() => {
        if (!active) return;
        setInsideHomeRadius(cachedLocation.home);
        setInsideWorkRadius(cachedLocation.work);
        setSavedLocationError(cachedLocation.error);
        setHomeWorkCheckKey(checkKey);
      });
      return () => { active = false; };
    }
    const places = [
      { kind: 'home' as const, city: homeCity },
      { kind: 'work' as const, city: workCity },
    ].filter(({ kind }) => kind === 'home' ? hasHomeLocation : hasWorkLocation)
      .map(({ kind, city }) => ({ kind, value: getGeocodePlace(city, homeCountry) }));
    const verificationStartedAt = Date.now();
    void Promise.all(places.map(async ({ kind, value }) => {
      const matches = await geocodeWithTimeout(value);
      const match = matches[0];
      if (!match) throw new Error(`No location found for ${value}.`);
      return { kind, latitude: match.latitude, longitude: match.longitude };
    })).then((matches) => {
      if (!active) return;
      const home = matches.find((match) => match.kind === 'home');
      const work = matches.find((match) => match.kind === 'work');
      const homeMatch = home && haversineMeters(coords.latitude, coords.longitude, home.latitude, home.longitude) <= radiusMeters;
      const workMatch = work && haversineMeters(coords.latitude, coords.longitude, work.latitude, work.longitude) <= radiusMeters;
      setInsideHomeRadius(Boolean(homeMatch));
      setInsideWorkRadius(Boolean(workMatch));
      setSavedLocationError(null);
      sessionSavedLocation = { key: checkKey, home: Boolean(homeMatch), work: Boolean(workMatch), error: null };
      setHomeWorkCheckKey(checkKey);
      console.log(`[places] Home/work verification completed in ${Date.now() - verificationStartedAt}ms for ${places.length} saved location${places.length === 1 ? '' : 's'}.`);
    }).catch((cause) => {
      if (!active) return;
      console.warn('[places] Home/work location could not be verified; discovery remains blocked:', cause);
      setInsideHomeRadius(false);
      setInsideWorkRadius(false);
      const error = 'We could not verify your saved home or work city and country. Check the spelling in Settings, then try again.';
      sessionSavedLocation = { key: checkKey, home: false, work: false, error };
      setSavedLocationError(error);
      setHomeWorkCheckKey(checkKey);
    });

    return () => { active = false; };
  }, [coords, hasHomeLocation, hasSavedLocations, hasWorkLocation, homeCity, homeCountry, internetAvailable, permissionGranted, radiusMeters, savedLocationRetryKey, workCity]);

  useEffect(() => {
    if (!effectiveInsideHomeRadius) {
      wishlistPromptedRef.current = false;
      return;
    }
    if (wishlist.length === 0 || wishlistPromptedRef.current) return;
    wishlistPromptedRef.current = true;
    Alert.alert(
      'Welcome back home',
      `You have ${wishlist.length} place${wishlist.length === 1 ? '' : 's'} in your wishlist. Would you like to clear it and start planning fresh?`,
      [
        { text: 'Keep wishlist', style: 'cancel' },
        { text: 'Clear wishlist', style: 'destructive', onPress: () => { void clearWishlist(); } },
      ],
    );
  }, [clearWishlist, effectiveInsideHomeRadius, wishlist.length]);

  const activeSelectedCategory = travelMode !== 'driving' && selectedCategory === 'gas_station' ? 'restaurant' : selectedCategory;

  const placesQueryKey = useMemo(() => ['places', coords?.latitude, coords?.longitude, radiusMeters, travelMode, advancedDetails], [coords?.latitude, coords?.longitude, radiusMeters, travelMode, advancedDetails]);
  const currentCacheKey = coords ? getPlacesCacheKey(coords.latitude, coords.longitude, radiusMeters, travelMode, advancedDetails) : null;
  const placesQuery = useQuery({
    queryKey: placesQueryKey,
    enabled: false,
    queryFn: () => fetchNearbyPlaces('all', coords!.latitude, coords!.longitude, radiusMeters, travelMode, advancedDetails),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const { refetch: refetchPlaces } = placesQuery;
  const insideHomeWorkRadius = effectiveInsideHomeRadius || effectiveInsideWorkRadius;
  const hasHomeWorkSettings = hasSavedLocations;
  const currentHomeWorkCheckKey = coords && hasHomeWorkSettings ? `${coords.latitude}:${coords.longitude}:${radiusMeters}:${homeCity.trim()}:${homeCountry.trim()}:${workCity.trim()}` : null;
  const confirmHomeWorkSearch = useCallback((automatic = false) => new Promise<boolean>((resolve) => {
    if (!insideHomeWorkRadius) {
      resolve(true);
      return;
    }
    if (automatic && declinedAutomaticSearchKeyRef.current === currentHomeWorkCheckKey) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (proceed: boolean) => {
      if (settled) return;
      settled = true;
      resolve(proceed);
    };
    Alert.alert(
      'You are at home or work',
      'You are within your saved home or work area. Would you like to search nearby places anyway?',
      [
        { text: 'Not now', style: 'cancel', onPress: () => {
          autoSearchPendingRef.current = false;
          declinedAutomaticSearchKeyRef.current = currentHomeWorkCheckKey;
          setSearchStatusMessage('Search cancelled. You are within your saved home or work area.');
          finish(false);
        } },
        { text: 'Search anyway', onPress: () => {
          setSearchStatusMessage(null);
          finish(true);
        } },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  }), [currentHomeWorkCheckKey, insideHomeWorkRadius]);

  useEffect(() => {
    if (!coords) return undefined;
    const shouldAutoSearch = autoSearchPendingRef.current;
    let active = true;
    void getCachedNearbyPlaces(coords.latitude, coords.longitude, radiusMeters, travelMode, advancedDetails).then((cached) => {
      if (!active) return;
      queryClient.setQueryData(placesQueryKey, cached ? { places: cached.places } : undefined);
      const hasHomeWorkSettings = hasSavedLocation(homeCity, homeCountry) || hasSavedLocation(workCity, homeCountry);
      const checkKey = coords && hasHomeWorkSettings ? `${coords.latitude}:${coords.longitude}:${radiusMeters}:${homeCity.trim()}:${homeCountry.trim()}:${workCity.trim()}` : null;
      const homeWorkVerified = !hasHomeWorkSettings || homeWorkCheckKey === checkKey;
      if (placesReady === true && !effectiveSavedLocationError && homeWorkVerified && !cached && shouldAutoSearch && !autoSearchInFlightRef.current && getPlacesRequestCooldownMs() <= 0) {
        autoSearchInFlightRef.current = true;
        void confirmHomeWorkSearch(true).then((proceed) => {
          if (proceed) return refetchPlaces();
          return undefined;
        }).finally(() => {
          autoSearchPendingRef.current = false;
          autoSearchInFlightRef.current = false;
        });
      }
    }).catch((cause) => {
      if (!active) return;
      console.warn('[places] Cached nearby places could not be loaded; continuing with live discovery:', cause);
    }).finally(() => {
      if (active) setLoadedCacheKey(currentCacheKey);
    });
    return () => {
      active = false;
    };
  }, [confirmHomeWorkSearch, coords, currentCacheKey, effectiveInsideHomeRadius, effectiveInsideWorkRadius, effectiveSavedLocationError, foregroundSearchKey, homeCity, homeCountry, homeWorkCheckKey, placesQueryKey, queryClient, radiusMeters, refetchPlaces, travelMode, placesReady, workCity, advancedDetails]);

  useEffect(() => {
    if (placesCooldownMs <= 0) {
      return undefined;
    }
    const interval = setInterval(() => setCooldownTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [placesCooldownMs]);

  const homeWorkCheckReady = internetAvailable === true && permissionGranted === true && Boolean(coords) && (!hasHomeWorkSettings || homeWorkCheckKey === currentHomeWorkCheckKey) && !effectiveSavedLocationError;
  const refreshDisabled = !placesStateReady || placesReady !== true || !homeWorkCheckReady || placesCooldownMs > 0 || placesQuery.isFetching;
  const refreshLabel = placesCooldownMs > 0
    ? __DEV__ && placesCooldownMs < 60_000
      ? `Try again in ${Math.ceil(placesCooldownMs / 1_000)} sec`
      : `Try again in ${Math.ceil(placesCooldownMs / 1000 / 60)} min`
      : placesReady !== true ? 'Search unavailable' : 'Search again';
  const isCheckingSavedLocation = hasHomeWorkSettings && !homeWorkCheckReady;
  const isLoadingSavedCache = loadedCacheKey !== currentCacheKey;
  const isSearchingPlaces = placesQuery.isLoading || placesQuery.isFetching;
  const loadingMessage = loading
    ? 'Finding your location…'
    : internetAvailable === null
      ? 'Checking your connection…'
    : placesReady === null
      ? 'Getting nearby places ready…'
      : isCheckingSavedLocation
        ? 'Checking your saved home and work locations…'
        : isLoadingSavedCache
          ? 'Preparing nearby places…'
          : isSearchingPlaces
            ? 'Finding nearby places…'
            : null;
  const refreshPlaces = () => {
    if (!refreshDisabled) {
      void confirmHomeWorkSearch().then((proceed) => {
        if (proceed) return refetchPlaces();
        return undefined;
      });
    }
  };

  const places = useMemo(() => {
    const allPlaces = (placesQuery.data?.places ?? []).filter((place) => place.category === activeSelectedCategory);
    const filteredPlaces = travelerProfiles.length === 0
      ? allPlaces
      : allPlaces.filter((place) => place.travelerTags.some((tag) => travelerProfiles.includes(tag)));

    const normalizedSearch = placeSearch.trim().toLocaleLowerCase();
    const searchedPlaces = filteredPlaces.filter((place) => {
      if (!showVisited && isVisited(place.id)) return false;
      if (!normalizedSearch) return true;
      return `${place.name} ${place.address}`.toLocaleLowerCase().includes(normalizedSearch);
    });

    if (!coords) return searchedPlaces;
    return [...searchedPlaces].sort((first, second) => {
      const firstDistance = haversineMeters(coords.latitude, coords.longitude, first.latitude, first.longitude);
      const secondDistance = haversineMeters(coords.latitude, coords.longitude, second.latitude, second.longitude);
      return firstDistance - secondDistance;
    });
  }, [activeSelectedCategory, coords, isVisited, placeSearch, placesQuery.data, showVisited, travelerProfiles]);

  const visiblePlaces = lowMemoryAndroid ? places.slice(0, 12) : places;

  const renderItem = ({ item }: { item: Place }) => {
    const distance =
      coords ? haversineMeters(coords.latitude, coords.longitude, item.latitude, item.longitude) : Number.POSITIVE_INFINITY;

    return (
      <PlaceCard
        place={item}
        distanceText={formatDistance(distance, distanceUnit)}
        visited={isVisited(item.id)}
        wishlisted={wishlist.some((savedPlace) => savedPlace.id === item.id)}
        onPress={() => navigation.navigate('PlaceDetails', { place: item })}
      />
    );
  };

  const region = useMemo(() => {
    if (!coords) {
      return undefined;
    }
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [coords]);

  if (permissionGranted === false) {
    return <LocationPermissionPrompt onRetry={requestPermission} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}> 
      <View style={styles.container}>
        <AppHeader title="Location Demo" onMenu={() => setDrawerOpen(true)}
          onToggleView={lowMemoryAndroid ? undefined : () => setMapView((prev) => !prev)} mapView={mapView} />

        <Pressable accessibilityRole="button" accessibilityLabel="Open place filters"
          accessibilityState={{ expanded: filtersOpen }}
          style={[styles.filterButton, { borderColor: theme.accent }]}
          onPress={() => setFiltersOpen((open) => !open)}>
          <Ionicons name="filter-outline" size={17} color={theme.accent} />
          <Text style={[styles.refreshButtonText, { color: theme.accent }]}>{filtersOpen ? 'Hide filters' : 'Show filters'}</Text>
        </Pressable>

        {filtersOpen ? (
          <View style={[styles.filterPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.filterHeading, { color: theme.foreground }]}>Categories</Text>
            <CategoryChips selected={activeSelectedCategory} onSelect={setSelectedCategory} travelMode={travelMode} />
            <Pressable accessibilityRole="checkbox" accessibilityLabel="Show visited places"
              accessibilityState={{ checked: showVisited }} style={styles.checkboxRow}
              onPress={() => setShowVisited((visible) => !visible)}>
              <View style={[styles.checkbox, { borderColor: showVisited ? theme.primary : theme.border, backgroundColor: showVisited ? theme.primary : 'transparent' }]}>
                {showVisited ? <Text style={{ color: theme.onPrimary }}>✓</Text> : null}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.foreground }]}>Show visited places</Text>
            </Pressable>
            <TextInput accessibilityLabel="Search places by name or address"
              placeholder="Search by name or address" placeholderTextColor={theme.secondaryText}
              value={placeSearch} onChangeText={setPlaceSearch}
              style={[styles.searchInput, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]}
              autoCapitalize="none" returnKeyType="search"/>
          </View>
        ) : null}

        <Text style={[styles.resultLimit, { color: theme.secondaryText }]}>{lowMemoryAndroid ? 'Showing up to 12 nearby places in a lighter list view.' : 'Showing up to 20 nearby places within your selected radius.'}</Text>
        {lowMemoryAndroid ? <Text style={[styles.lowMemoryNotice, { color: theme.secondaryText }]}>Showing a lighter list view for this device.</Text> : null}

        {canShowPlacesRetry ? (
          <Pressable accessibilityRole="button" style={[styles.refreshButton, { borderColor: theme.accent }, refreshDisabled && styles.refreshButtonDisabled]} onPress={refreshPlaces} disabled={refreshDisabled}>
            <Ionicons name="refresh-outline" size={17} color={theme.accent} />
            <Text style={[styles.refreshButtonText, { color: theme.accent }]}>{refreshLabel}</Text>
          </Pressable>
        ) : null}

        {searchStatusMessage ? <Text style={[styles.searchStatus, { color: theme.secondaryText }]}>{searchStatusMessage}</Text> : null}

        {travelerProfiles.length > 0 ? (
          <Text style={[styles.filterInfo, { color: theme.secondaryText }]}>Traveller filters active: {travelerProfiles.length}</Text>
        ) : null}

        {locationError ? (
          <ErrorState title="Location unavailable" message={locationError} onRetry={refreshLocation} />
        ) : loading || placesQuery.isLoading || placesQuery.isFetching || internetAvailable === null || placesReady === null || loadedCacheKey !== currentCacheKey || (placesQuery.data === undefined && hasHomeWorkSettings && placesReady === true && !homeWorkCheckReady && !effectiveSavedLocationError) ? (
          <View style={styles.loadingState} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.secondaryText }]}>{loadingMessage ?? 'Preparing nearby discovery…'}</Text>
          </View>
        ) : placesReady !== true ? (
          <ErrorState title="Nearby places service unavailable" message={placesError ?? 'Nearby places are not available right now. Please try again.'} onRetry={() => void checkPlacesReadiness(true)} />
        ) : internetAvailable !== true ? (
          <ErrorState title="No internet connection" message="Connect to the internet before searching nearby places." onRetry={() => void checkInternet(true)} />
        ) : effectiveSavedLocationError ? (
          <ErrorState title="Saved location could not be verified" message={effectiveSavedLocationError} onRetry={() => { sessionSavedLocation = null; setSavedLocationError(null); setSavedLocationRetryKey((value) => value + 1); }} />
        ) : placesQuery.isError ? (
          <ErrorState
            title="Nearby places are unavailable"
            message={placesQuery.error instanceof Error ? placesQuery.error.message : 'Please try again in a moment.'}
            onRetry={canShowPlacesRetry ? refreshPlaces : undefined}
            retryDisabled={refreshDisabled}
            retryLabel={refreshLabel}
          />
        ) : mapView && !lowMemoryAndroid && region ? (
          <View style={[styles.mapWrap, { borderColor: theme.border }]}>
              <MapView provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} style={styles.map} region={region}>
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title="You are here" pinColor={theme.accent} />
              {visiblePlaces.map((place) => (
                <Marker key={place.id} coordinate={{ latitude: place.latitude, longitude: place.longitude }} title={place.name} pinColor={theme.primary} onCalloutPress={() => navigation.navigate('PlaceDetails', { place })} />
              ))}
            </MapView>
          </View>
        ) : (
          <FlatList
            data={visiblePlaces}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, places.length === 0 && styles.emptyList]}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.secondaryText }]}>No places match the current category and traveller filters.</Text>}
          />
        )}

      </View>

      <SideDrawer open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        goPreferences={() => {
          setDrawerOpen(false);
          navigation.navigate('Preferences');
        }}
        goDiscover={() => setDrawerOpen(false)}
        goHistory={() => {
          setDrawerOpen(false);
          navigation.navigate('History');
        }}
        goWishlist={() => {
          setDrawerOpen(false);
          navigation.navigate('Wishlist');
        }}
        goLegal={() => {
          setDrawerOpen(false);
          navigation.navigate('Legal', {});
        }}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 16 },
  mapWrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, height: 380 },
  map: { flex: 1 },
  list: { paddingBottom: 16 },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: { textAlign: 'center' },
  filterInfo: { fontSize: 12, marginBottom: 6, opacity: 0.75 },
  filterButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8 },
  filterPanel: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  filterHeading: { fontWeight: '700', marginBottom: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontWeight: '600' },
  searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, marginTop: 4 },
  resultLimit: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  lowMemoryNotice: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  searchStatus: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  refreshButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 10 },
  refreshButtonDisabled: { opacity: 0.5 },
  refreshButtonText: { fontWeight: '700' },
  loadingState: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  loadingText: { fontSize: 13 },
  donateLink: { textAlign: 'center', fontWeight: '700', marginTop: 4 },
});
