import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredValue } from '../services/storage';
import { SavedPlace, parseSavedPlaces, toSavedPlace } from '../services/savedPlaces';

const STORAGE_KEY = 'location_demo_wishlist';
const listeners = new Set<(value: SavedPlace[]) => void>();

export function useWishlist() {
  const [wishlist, setWishlist] = useState<SavedPlace[]>([]);

  useEffect(() => {
    getStoredValue(STORAGE_KEY).then((value) => setWishlist(parseSavedPlaces(value)));
    listeners.add(setWishlist);
    return () => { listeners.delete(setWishlist); };
  }, []);

  const persist = useCallback(async (next: SavedPlace[]) => {
    setWishlist(next);
    listeners.forEach((listener) => listener(next));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addToWishlist = useCallback(async (place: Omit<SavedPlace, 'savedAt'>) => {
    if (wishlist.some((item) => item.id === place.id)) return;
    await persist([...wishlist, toSavedPlace(place)]);
  }, [persist, wishlist]);

  const removeFromWishlist = useCallback(async (placeId: string) => {
    await persist(wishlist.filter((place) => place.id !== placeId));
  }, [persist, wishlist]);

  const clearWishlist = useCallback(async (placeIds?: string[]) => {
    if (!placeIds) {
      await persist([]);
      return;
    }
    const selected = new Set(placeIds);
    await persist(wishlist.filter((place) => !selected.has(place.id)));
  }, [persist, wishlist]);

  const isWishlisted = useCallback((placeId: string) => wishlist.some((place) => place.id === placeId), [wishlist]);

  return { wishlist, addToWishlist, removeFromWishlist, clearWishlist, isWishlisted };
}
