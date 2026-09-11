import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_STORAGE_KEYS = [
  'location_demo_radius',
  'location_demo_travel_mode',
  'location_demo_advanced_details',
  'location_demo_theme_mode',
  'location_demo_home_city',
  'location_demo_work_city',
  'location_demo_traveler_profiles',
  'location_demo_visited',
  'location_demo_wishlist',
  'location_demo_places_cache_v1',
  'location_demo_places_last_success_at',
];

export async function clearLocalAppData() {
  await Promise.all(DEMO_STORAGE_KEYS.map((key) => AsyncStorage.removeItem(key)));
}
