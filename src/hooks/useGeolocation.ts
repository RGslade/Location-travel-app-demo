import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type Coordinates = { latitude: number; longitude: number };

// This cache intentionally lives only in the JavaScript process. A cold app
// restart must perform a fresh location check, while returning to Discovery
// during the same app session should reuse the last known position.
let sessionCoordinates: Coordinates | null = null;
let sessionPermissionGranted: boolean | null = null;

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(sessionCoordinates);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(sessionPermissionGranted);
  const [loading, setLoading] = useState(sessionCoordinates === null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      const granted = result.status === 'granted';
      sessionPermissionGranted = granted;
      setPermissionGranted(granted);
      setError(granted ? null : 'Location access is needed to discover nearby places.');
      return granted;
    } catch {
      setPermissionGranted(false);
      setError('We could not request location access. Check your device settings and try again.');
      return false;
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    setLoading(true);
    const granted = await requestPermission();
    if (!granted) {
      setLoading(false);
      return;
    }

    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      sessionCoordinates = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setError(null);
    } catch {
      setError('We could not determine your current location. Check that location services are enabled.');
    } finally {
      setLoading(false);
    }
  }, [requestPermission]);

  useEffect(() => {
    let active = true;

    const start = async () => {
      if (sessionCoordinates && sessionPermissionGranted === true) {
        setPermissionGranted(true);
        setLoading(false);
        try {
          watchRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 10000 },
            (position) => {
              const nextCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
              sessionCoordinates = nextCoordinates;
              setCoords(nextCoordinates);
            },
          );
        } catch {
          // The previously verified position remains usable for this session.
        }
        return;
      }
      const granted = await requestPermission();
      if (!active || !granted) {
        setLoading(false);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) {
          const nextCoordinates = { latitude: current.coords.latitude, longitude: current.coords.longitude };
          sessionCoordinates = nextCoordinates;
          setCoords(nextCoordinates);
        }

        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 20, timeInterval: 10000 },
          (position) => {
            const nextCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            sessionCoordinates = nextCoordinates;
            setCoords(nextCoordinates);
          },
        );
        setError(null);
      } catch {
        if (active) {
          setError('We could not determine your current location. Check that location services are enabled.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    start();

    return () => {
      active = false;
      watchRef.current?.remove();
    };
  }, [requestPermission]);

  return { coords, permissionGranted, loading, error, refreshLocation, requestPermission };
}
