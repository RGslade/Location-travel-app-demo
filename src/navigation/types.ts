import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Place } from '../services/placesApi';

export type RootStackParamList = {
  Discover: { from?: 'menu' | 'settings' } | undefined;
  Preferences: undefined;
  History: undefined;
  Wishlist: undefined;
  PlaceDetails: { place: Place };
  Legal: { document?: 'privacy' | 'terms' };
};

export type DiscoverScreenProps = NativeStackScreenProps<RootStackParamList, 'Discover'>;
export type PreferencesScreenProps = NativeStackScreenProps<RootStackParamList, 'Preferences'>;
export type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'History'>;
export type WishlistScreenProps = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;
export type PlaceDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'PlaceDetails'>;
export type LegalScreenProps = NativeStackScreenProps<RootStackParamList, 'Legal'>;
