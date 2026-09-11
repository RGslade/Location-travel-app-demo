import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelerProfile } from '../services/placesApi';
import { getStoredValue, parseStoredJson } from '../services/storage';

const RADIUS_KEY = 'location_demo_radius';
export const RADIUS_MIN = 500;
export const RADIUS_MAX = 20_000;
export const DEVELOPMENT_RADIUS_MIN = RADIUS_MIN;
export const METRES_PER_MILE = 1_609.344;
export const HOME_CITY_KEY = 'location_demo_home_city';
export const HOME_REGION_KEY = 'location_demo_home_region';
export const HOME_COUNTRY_KEY = 'location_demo_home_country';
export const WORK_CITY_KEY = 'location_demo_work_city';
export const WORK_REGION_KEY = 'location_demo_work_region';
const TRAVELER_PROFILES_KEY = 'location_demo_traveler_profiles';
const DISTANCE_UNIT_KEY = 'location_demo_distance_unit';
const TRAVEL_MODE_KEY = 'location_demo_travel_mode';
const ADVANCED_DETAILS_KEY = 'location_demo_advanced_details';

export type DistanceUnit = 'km' | 'miles';
export type TravelMode = 'walking' | 'driving' | 'public_transport';
export const TRAVEL_MODE_OPTIONS: { value: TravelMode; label: string }[] = [
  { value: 'walking', label: 'Walking' },
  { value: 'driving', label: 'Driving' },
  { value: 'public_transport', label: 'Public transport' },
];
export const RADIUS_MIN_VALUE = 0.5;
export const RADIUS_MAX_VALUE = 20;

export function distanceToMeters(value: number, unit: DistanceUnit) {
  return value * (unit === 'miles' ? METRES_PER_MILE : 1_000);
}

export function metersToDistance(meters: number, unit: DistanceUnit) {
  return meters / (unit === 'miles' ? METRES_PER_MILE : 1_000);
}

export function getRadiusMinimumMeters() {
  return __DEV__ ? DEVELOPMENT_RADIUS_MIN : RADIUS_MIN;
}

export function getRadiusSliderMinimum(unit: DistanceUnit) {
  return metersToDistance(getRadiusMinimumMeters(), unit);
}

export function getRadiusSliderStep(_unit: DistanceUnit) {
  return RADIUS_MIN_VALUE;
}

export function getRadiusSliderValue(meters: number, unit: DistanceUnit) {
  return metersToDistance(meters, unit);
}

export function getRadiusSliderMaximum(unit: DistanceUnit) {
  return metersToDistance(RADIUS_MAX, unit);
}

export function getTravelModeRadiusMaximum(unit: DistanceUnit, travelMode: TravelMode) {
  return travelMode === 'walking' ? distanceToMeters(5, unit) : RADIUS_MAX;
}

export function getRadiusSliderMaximumForTravelMode(unit: DistanceUnit, travelMode: TravelMode) {
  return metersToDistance(getTravelModeRadiusMaximum(unit, travelMode), unit);
}

const travelerProfileValues: TravelerProfile[] = [
  'master_planner',
  'go_with_flow',
  'balanced_browser',
  'curious_wanderer',
  'food_hunter',
  'nightlife_chaser',
  'culture_collector',
  'wellness_recharger',
];

function isTravelerProfiles(value: unknown): value is TravelerProfile[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && travelerProfileValues.includes(item as TravelerProfile));
}

export function usePreferences() {
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [homeCity, setHomeCity] = useState('');
  const [homeRegion, setHomeRegion] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [workCity, setWorkCity] = useState('');
  const [workRegion, setWorkRegion] = useState('');
  const [travelerProfiles, setTravelerProfiles] = useState<TravelerProfile[]>([]);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
  const [travelMode, setTravelMode] = useState<TravelMode>('public_transport');
  const [advancedDetails, setAdvancedDetails] = useState(false);

  useEffect(() => {
    getStoredValue(RADIUS_KEY).then((value) => {
      if (value) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed >= getRadiusMinimumMeters() && parsed <= RADIUS_MAX && parsed % 1 === 0) {
          setRadiusMeters(parsed);
        }
      }
    });
    getStoredValue(HOME_CITY_KEY).then((value) => {
      if (value) {
        setHomeCity(value);
      }
    });
    getStoredValue(HOME_COUNTRY_KEY).then((value) => {
      if (value) setHomeCountry(value);
    });
    getStoredValue(HOME_REGION_KEY).then((value) => {
      if (value) setHomeRegion(value);
    });
    getStoredValue(WORK_CITY_KEY).then((value) => {
      if (value) {
        setWorkCity(value);
      }
    });
    getStoredValue(WORK_REGION_KEY).then((value) => {
      if (value) setWorkRegion(value);
    });
    getStoredValue(TRAVELER_PROFILES_KEY).then((value) => {
      setTravelerProfiles(parseStoredJson(value, [], isTravelerProfiles));
    });
    getStoredValue(DISTANCE_UNIT_KEY).then((value) => {
      if (value === 'km' || value === 'miles') setDistanceUnit(value);
    });
    getStoredValue(TRAVEL_MODE_KEY).then((value) => {
      if (value === 'walking' || value === 'driving' || value === 'public_transport') setTravelMode(value);
    });
    getStoredValue(ADVANCED_DETAILS_KEY).then((value) => setAdvancedDetails(value === 'true'));
  }, []);

  useEffect(() => {
    const maximum = getTravelModeRadiusMaximum(distanceUnit, travelMode);
    if (radiusMeters <= maximum) return;
    void AsyncStorage.setItem(RADIUS_KEY, String(maximum));
  }, [distanceUnit, radiusMeters, travelMode]);

  const updateHomeCity = useCallback(async (next: string) => {
    setHomeCity(next);
    await AsyncStorage.setItem(HOME_CITY_KEY, next.trim());
  }, []);

  const updateHomeCountry = useCallback(async (next: string) => {
    setHomeCountry(next);
    await AsyncStorage.setItem(HOME_COUNTRY_KEY, next.trim());
  }, []);

  const updateHomeRegion = useCallback(async (next: string) => {
    setHomeRegion(next);
    await AsyncStorage.setItem(HOME_REGION_KEY, next.trim());
  }, []);

  const updateWorkCity = useCallback(async (next: string) => {
    setWorkCity(next);
    await AsyncStorage.setItem(WORK_CITY_KEY, next.trim());
  }, []);

  const updateWorkRegion = useCallback(async (next: string) => {
    setWorkRegion(next);
    await AsyncStorage.setItem(WORK_REGION_KEY, next.trim());
  }, []);

  const updateDistanceUnit = useCallback(async (next: DistanceUnit) => {
    setDistanceUnit(next);
    await AsyncStorage.setItem(DISTANCE_UNIT_KEY, next);
  }, []);

  const updateRadiusValue = useCallback(async (next: number) => {
    const sliderStep = getRadiusSliderStep(distanceUnit);
    const stepped = Math.max(getRadiusSliderMinimum(distanceUnit), Math.round(next / sliderStep) * sliderStep);
    const requestedMeters = distanceToMeters(stepped, distanceUnit);
    const meters = Math.min(getTravelModeRadiusMaximum(distanceUnit, travelMode), Math.max(getRadiusMinimumMeters(), Math.round(requestedMeters)));
    setRadiusMeters(meters);
    await AsyncStorage.setItem(RADIUS_KEY, String(meters));
  }, [distanceUnit, travelMode]);

  const updateTravelMode = useCallback(async (next: TravelMode) => {
    setTravelMode(next);
    await AsyncStorage.setItem(TRAVEL_MODE_KEY, next);
    const maximum = getTravelModeRadiusMaximum(distanceUnit, next);
    if (radiusMeters > maximum) {
      setRadiusMeters(maximum);
      await AsyncStorage.setItem(RADIUS_KEY, String(maximum));
    }
  }, [distanceUnit, radiusMeters]);

  const updateAdvancedDetails = useCallback(async (next: boolean) => {
    setAdvancedDetails(next);
    await AsyncStorage.setItem(ADVANCED_DETAILS_KEY, String(next));
  }, []);

  const toggleTravelerProfile = useCallback(
    async (profile: TravelerProfile) => {
      const next = travelerProfiles.includes(profile)
        ? travelerProfiles.filter((value) => value !== profile)
        : [...travelerProfiles, profile];

      setTravelerProfiles(next);
      await AsyncStorage.setItem(TRAVELER_PROFILES_KEY, JSON.stringify(next));
    },
    [travelerProfiles],
  );

  return {
    radiusMeters: Math.min(radiusMeters, getTravelModeRadiusMaximum(distanceUnit, travelMode)),
    homeCity,
    homeRegion,
    homeCountry,
    workCity,
    workRegion,
    travelerProfiles,
    distanceUnit,
    travelMode,
    advancedDetails,
    updateHomeCity,
    updateHomeRegion,
    updateHomeCountry,
    updateWorkCity,
    updateWorkRegion,
    updateDistanceUnit,
    updateTravelMode,
    updateAdvancedDetails,
    updateRadiusValue,
    toggleTravelerProfile,
  };
}
