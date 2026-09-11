export type SavedPlace = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  savedAt: string;
};

export function toSavedPlace(place: { id: string; name: string; address: string; latitude: number; longitude: number }, savedAt = new Date().toISOString()): SavedPlace {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    savedAt,
  };
}

export function isSavedPlace(value: unknown): value is SavedPlace {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SavedPlace>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.address === 'string'
    && typeof candidate.latitude === 'number'
    && typeof candidate.longitude === 'number'
    && typeof candidate.savedAt === 'string';
}

export function parseSavedPlaces(value: string | null, fallback: SavedPlace[] = []) {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    return parsed.filter(isSavedPlace);
  } catch {
    return fallback;
  }
}
