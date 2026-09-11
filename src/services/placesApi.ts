import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversineMeters } from './geo';

const PLACES_API_URL = process.env.EXPO_PUBLIC_PLACES_API_URL?.trim() ?? '';
export const PLACES_REQUEST_COOLDOWN_MS = 5 * 60 * 1000;
export const PLACES_CACHE_STORAGE_KEY = 'location_demo_places_cache_v1';
export const PLACES_COOLDOWN_STORAGE_KEY = 'location_demo_places_last_success_at';
let lastPlacesRequestAt = 0;
let placesStateRestoreInFlight: Promise<void> | null = null;

type PlacesCacheRecord = {
  version: 1;
  key: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  category: 'all';
  fetchedAt: number;
  places: Place[];
};

export function getPlacesCacheKey(latitude: number, longitude: number, radiusMeters: number, travelMode = 'public_transport', advancedDetails = false) {
  return `all:${travelMode}:${advancedDetails ? 'advanced' : 'standard'}:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${Math.round(radiusMeters)}`;
}

export async function restorePlacesState() {
  if (placesStateRestoreInFlight) return placesStateRestoreInFlight;
  placesStateRestoreInFlight = (async () => {
    const storedTimestamp = await AsyncStorage.getItem(PLACES_COOLDOWN_STORAGE_KEY);
    const parsedTimestamp = Number(storedTimestamp);
    lastPlacesRequestAt = Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
  })();
  try {
    await placesStateRestoreInFlight;
  } finally {
    placesStateRestoreInFlight = null;
  }
}

export async function getCachedNearbyPlaces(latitude: number, longitude: number, radiusMeters: number, travelMode = 'public_transport', advancedDetails = false) {
  try {
    const raw = await AsyncStorage.getItem(PLACES_CACHE_STORAGE_KEY);
    if (!raw) return undefined;
    const record = JSON.parse(raw) as Partial<PlacesCacheRecord>;
    if (
      record.version !== 1 ||
      typeof record.latitude !== 'number' ||
      typeof record.longitude !== 'number' ||
      Math.round(record.radiusMeters ?? 0) !== Math.round(radiusMeters) ||
      record.category !== 'all' ||
      record.key !== getPlacesCacheKey(latitude, longitude, radiusMeters, travelMode, advancedDetails) ||
      !Array.isArray(record.places) ||
      typeof record.fetchedAt !== 'number'
    ) {
      return undefined;
    }
    if (haversineMeters(latitude, longitude, record.latitude, record.longitude) >= radiusMeters) {
      return undefined;
    }
    return record;
  } catch {
    return undefined;
  }
}

export function getPlacesRequestCooldownMs(now = Date.now()) {
  return Math.max(0, PLACES_REQUEST_COOLDOWN_MS - (now - lastPlacesRequestAt));
}

export type PlacesApiErrorCode = 'network' | 'rate_limited' | 'provider' | 'invalid_response' | 'configuration';

export class PlacesApiError extends Error {
  constructor(
    public readonly code: PlacesApiErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'PlacesApiError';
  }
}

export type PlacesHealth = {
  ok: boolean;
  checks?: {
    placesProvider?: boolean;
  };
};

let healthCheckInFlight: Promise<PlacesHealth> | null = null;

export async function checkPlacesHealth(): Promise<PlacesHealth> {
  if (!PLACES_API_URL) {
    return { ok: false, checks: { placesProvider: false } };
  }
  if (healthCheckInFlight) return healthCheckInFlight;

  healthCheckInFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(new URL('/health', PLACES_API_URL).toString(), { signal: controller.signal });
      const payload = await response.json() as PlacesHealth;
      if (!response.ok || payload.ok !== true) {
        throw new PlacesApiError('configuration', 'Nearby places are not configured yet. Start the proxy and provide its server key.', true);
      }
      return payload;
    } catch (cause) {
      if (cause instanceof PlacesApiError) throw cause;
      throw new PlacesApiError('configuration', 'Nearby places service is unavailable. Start the proxy and try again.', true);
    } finally {
      clearTimeout(timeout);
      healthCheckInFlight = null;
    }
  })();
  return healthCheckInFlight;
}

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'park'
  | 'museum'
  | 'tourist_attraction'
  | 'shopping_mall'
  | 'gym'
  | 'spa'
  | 'gas_station';

export const PLACE_CATEGORIES: PlaceCategory[] = [
  'restaurant', 'cafe', 'bar', 'park', 'museum', 'tourist_attraction', 'shopping_mall', 'gym', 'spa',
];
export const DRIVING_PLACE_CATEGORIES: PlaceCategory[] = [...PLACE_CATEGORIES, 'gas_station'];

export type TravelerProfile =
  | 'master_planner'
  | 'go_with_flow'
  | 'balanced_browser'
  | 'curious_wanderer'
  | 'food_hunter'
  | 'nightlife_chaser'
  | 'culture_collector'
  | 'wellness_recharger';

export type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  primaryType?: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  priceLevel?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  editorialSummary?: string;
  photoUrl?: string;
  category: PlaceCategory;
  travelerTags: TravelerProfile[];
};

export type PlacesSearchResult = {
  places: Place[];
};

const travelerTagsByCategory: Record<PlaceCategory, TravelerProfile[]> = {
  restaurant: ['food_hunter', 'balanced_browser', 'go_with_flow'],
  cafe: ['food_hunter', 'master_planner', 'balanced_browser'],
  bar: ['nightlife_chaser', 'go_with_flow', 'curious_wanderer'],
  park: ['curious_wanderer', 'wellness_recharger', 'go_with_flow'],
  museum: ['culture_collector', 'master_planner', 'balanced_browser'],
  tourist_attraction: ['culture_collector', 'curious_wanderer', 'go_with_flow'],
  shopping_mall: ['master_planner', 'balanced_browser', 'nightlife_chaser'],
  gym: ['wellness_recharger', 'master_planner', 'balanced_browser'],
  spa: ['wellness_recharger', 'go_with_flow', 'balanced_browser'],
  gas_station: ['master_planner', 'go_with_flow'],
};

export async function fetchNearbyPlaces(
  category: PlaceCategory | 'all',
  latitude: number,
  longitude: number,
  radiusMeters: number,
  travelMode: 'walking' | 'driving' | 'public_transport' = 'public_transport',
  advancedDetails = false,
): Promise<PlacesSearchResult> {
  if (!PLACES_API_URL) {
    throw new PlacesApiError('configuration', 'Nearby places are not configured yet. Set the proxy URL and start the proxy.', false);
  }

  const cooldownMs = getPlacesRequestCooldownMs();
  if (cooldownMs > 0) {
    const minutes = Math.ceil(cooldownMs / 60_000);
    throw new PlacesApiError('rate_limited', `Nearby places can be refreshed in ${minutes} minute${minutes === 1 ? '' : 's'}.`, false);
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius: String(radiusMeters),
    type: category,
    travelMode,
    advanced: String(advancedDetails),
  });

  let response: Response;
  try {
    const url = new URL('/v1/places/nearby', PLACES_API_URL);
    url.search = params.toString();
    response = await fetch(url.toString());
  } catch {
    throw new PlacesApiError('network', 'We could not reach nearby places. Check your connection and try again.', true);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PlacesApiError('invalid_response', 'Nearby places returned an invalid response. Please try again.', true);
  }

  if (!response.ok) {
    const message = getErrorMessage(payload);
    throw new PlacesApiError(response.status === 429 ? 'rate_limited' : 'provider', message, response.status >= 500 || response.status === 429);
  }

  if (!isPlacesResponse(payload)) {
    throw new PlacesApiError('invalid_response', 'Nearby places returned an invalid response. Please try again.', true);
  }

  const places = payload.places.filter(isUsablePlaceResult).filter((result) =>
    haversineMeters(latitude, longitude, result.location.latitude, result.location.longitude) <= radiusMeters,
  ).flatMap((result) => {
    const resultCategory = category === 'all' ? getPlaceCategory(result) : category;
    if (!resultCategory) return [];

    return [{
      id: result.id,
      name: result.displayName.text,
      address: result.formattedAddress ?? 'Address unavailable',
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      primaryType: result.primaryType,
      types: result.types ?? [],
      rating: result.rating,
      userRatingsTotal: result.userRatingCount,
      openNow: result.currentOpeningHours?.openNow,
      priceLevel: result.priceLevel,
      websiteUri: result.websiteUri,
      nationalPhoneNumber: result.nationalPhoneNumber,
      editorialSummary: result.editorialSummary?.text,
      category: resultCategory,
      travelerTags: travelerTagsByCategory[resultCategory],
    } satisfies Place];
  });

  lastPlacesRequestAt = Date.now();
  await Promise.all([
    AsyncStorage.setItem(PLACES_COOLDOWN_STORAGE_KEY, String(lastPlacesRequestAt)),
    AsyncStorage.setItem(PLACES_CACHE_STORAGE_KEY, JSON.stringify({
      version: 1,
      key: getPlacesCacheKey(latitude, longitude, radiusMeters, travelMode, advancedDetails),
      latitude,
      longitude,
      radiusMeters,
      category: 'all',
      fetchedAt: lastPlacesRequestAt,
      places,
    } satisfies PlacesCacheRecord)),
  ]);

  return { places };
}

type GooglePlaceResult = {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  location: { latitude: number; longitude: number };
  primaryType?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  currentOpeningHours?: { openNow?: boolean };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  editorialSummary?: { text?: string };
};

function isPlacesResponse(value: unknown): value is { places: unknown[] } {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as { places?: unknown }).places));
}

function isUsablePlaceResult(result: unknown): result is GooglePlaceResult {
  if (!result || typeof result !== 'object') return false;
  const candidate = result as Partial<GooglePlaceResult>;
  return Boolean(
    typeof candidate.id === 'string' &&
    candidate.displayName &&
    typeof candidate.displayName.text === 'string' &&
    candidate.location &&
    typeof candidate.location.latitude === 'number' &&
    typeof candidate.location.longitude === 'number' &&
    (!candidate.types || candidate.types.every((type) => typeof type === 'string')),
  );
}

function getPlaceCategory(result: GooglePlaceResult): PlaceCategory | undefined {
  const resultTypes = [result.primaryType, ...(result.types ?? [])];
  return DRIVING_PLACE_CATEGORIES.find((category) => resultTypes.includes(category));
}

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string') {
    return (payload as { error: string }).error;
  }
  return 'Nearby places are temporarily unavailable. Please try again shortly.';
}
