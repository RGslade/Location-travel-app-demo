import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredValue } from '../services/storage';
import { parseSavedPlaces, SavedPlace, toSavedPlace } from '../services/savedPlaces';

const STORAGE_KEY = 'location_demo_visited';
const listeners = new Set<(value: SavedPlace[]) => void>();

type PlaceInput = Omit<SavedPlace, 'savedAt'>;

export function useVisitedPlaces() {
  const [visitedPlaces, setVisitedPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    getStoredValue(STORAGE_KEY).then(async (value) => {
      const parsed = parseSavedPlaces(value);
      if (parsed.length > 0 || !value) {
        setVisitedPlaces(parsed);
        return;
      }

      // Migrate the former ID-only history format without losing existing entries.
      try {
        const legacy = JSON.parse(value) as unknown;
        if (Array.isArray(legacy) && legacy.every((item) => typeof item === 'string')) {
          const migrated = legacy.map((id) => ({ id, name: id, address: 'Place details unavailable', latitude: 0, longitude: 0, savedAt: new Date(0).toISOString() }));
          setVisitedPlaces(migrated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch {
        setVisitedPlaces([]);
      }
    });
    listeners.add(setVisitedPlaces);
    return () => { listeners.delete(setVisitedPlaces); };
  }, []);

  const persist = useCallback(async (next: SavedPlace[]) => {
    setVisitedPlaces(next);
    listeners.forEach((listener) => listener(next));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addVisited = useCallback(async (place: PlaceInput) => {
    if (visitedPlaces.some((item) => item.id === place.id)) return;
    await persist([...visitedPlaces, toSavedPlace(place)]);
  }, [persist, visitedPlaces]);

  const removeVisited = useCallback(async (placeId: string) => {
    await persist(visitedPlaces.filter((place) => place.id !== placeId));
  }, [persist, visitedPlaces]);

  const clearVisited = useCallback(async (placeIds?: string[]) => {
    if (!placeIds) {
      await persist([]);
      return;
    }
    const selected = new Set(placeIds);
    await persist(visitedPlaces.filter((place) => !selected.has(place.id)));
  }, [persist, visitedPlaces]);

  const isVisited = useCallback((placeId: string) => visitedPlaces.some((place) => place.id === placeId), [visitedPlaces]);

  return {
    visitedPlaces,
    visitedIds: visitedPlaces.map((place) => place.id),
    visitedCount: visitedPlaces.length,
    addVisited,
    removeVisited,
    clearVisited,
    isVisited,
  };
}
