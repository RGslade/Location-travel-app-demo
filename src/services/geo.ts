const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number, unit: 'km' | 'miles' = 'km') {
  if (unit === 'miles') {
    const miles = meters / 1_609.344;
    return miles < 0.1 ? `${miles.toFixed(2)} mi` : `${miles.toFixed(1)} mi`;
  }

  return meters < 1_000 ? `${Math.round(meters)}m` : `${(meters / 1_000).toFixed(1)}km`;
}
