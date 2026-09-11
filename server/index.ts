import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
const port = Number(process.env.PORT ?? 8787);
const cacheTtlMs = 60_000;
const requestWindowMs = 60_000;
const maxRequestsPerWindow = 60;
const standardFieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types';
const advancedFieldMask = `${standardFieldMask},places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.websiteUri,places.nationalPhoneNumber,places.editorialSummary`;
const categories = [
  'restaurant',
  'cafe',
  'bar',
  'park',
  'museum',
  'tourist_attraction',
  'shopping_mall',
  'gym',
  'spa',
  'gas_station',
] as const;
const allowedCategories = new Set<string>(categories);

type CacheEntry = { expiresAt: number; payload: { places: unknown[] } };
type RateEntry = { count: number; expiresAt: number };

const cache = new Map<string, CacheEntry>();
const rateLimits = new Map<string, RateEntry>();

app.use('*', cors());

app.get('/health', (context) => {
  const configured = Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
  return context.json(
    { ok: configured, checks: { placesProvider: configured } },
    configured ? 200 : 503,
  );
});

app.get('/v1/places/nearby', async (context) => {
  const clientId = context.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const rate = rateLimits.get(clientId);
  if (!rate || rate.expiresAt <= now) {
    rateLimits.set(clientId, { count: 1, expiresAt: now + requestWindowMs });
  } else if (rate.count >= maxRequestsPerWindow) {
    return context.json({ error: 'Too many requests. Try again shortly.' }, 429);
  } else {
    rate.count += 1;
  }

  const providerKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!providerKey) {
    return context.json({ error: 'Places provider is not configured.' }, 503);
  }

  const { type, latitude, longitude, radius, travelMode, advanced } = context.req.query();
  const latitudeNumber = Number(latitude);
  const longitudeNumber = Number(longitude);
  const radiusNumber = Number(radius);
  const includeGasStations = travelMode === 'driving';
  const requestCategories = categories.filter((category) => includeGasStations || category !== 'gas_station');

  if (
    !type ||
    (type !== 'all' && !allowedCategories.has(type)) ||
    (type === 'gas_station' && !includeGasStations) ||
    !Number.isFinite(latitudeNumber) || latitudeNumber < -90 || latitudeNumber > 90 ||
    !Number.isFinite(longitudeNumber) || longitudeNumber < -180 || longitudeNumber > 180 ||
    !Number.isFinite(radiusNumber) || radiusNumber < 1 || radiusNumber > 50_000
  ) {
    return context.json({ error: 'Invalid nearby search.' }, 400);
  }

  const cacheKey = `${type}:${travelMode ?? 'public_transport'}:${advanced === 'true' ? 'advanced' : 'standard'}:${latitudeNumber.toFixed(4)}:${longitudeNumber.toFixed(4)}:${Math.round(radiusNumber)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return context.json(cached.payload);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': providerKey,
        'x-goog-fieldmask': advanced === 'true' ? advancedFieldMask : standardFieldMask,
      },
      body: JSON.stringify({
        includedTypes: type === 'all' ? requestCategories : [type],
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: {
          circle: {
            center: { latitude: latitudeNumber, longitude: longitudeNumber },
            radius: radiusNumber,
          },
        },
      }),
      signal: controller.signal,
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const details = getProviderErrorDetails(payload);
      console.warn(`[places-proxy] Google Places request failed: http=${response.status} status=${details.status ?? 'unknown'} code=${details.code ?? 'unknown'}`);
      return context.json(
        { error: details.status === 'RESOURCE_EXHAUSTED' || response.status === 429 ? 'Places search is busy right now.' : 'Places provider is temporarily unavailable.' },
        details.status === 'RESOURCE_EXHAUSTED' || response.status === 429 ? 429 : 502,
      );
    }

    const normalizedPayload = normalizePlacesResponse(payload);
    if (!normalizedPayload) {
      return context.json({ error: 'Places provider returned an unexpected response.' }, 502);
    }

    cache.set(cacheKey, { expiresAt: now + cacheTtlMs, payload: normalizedPayload });
    return context.json(normalizedPayload);
  } catch (error) {
    console.warn(`[places-proxy] Google Places request could not be reached: ${error instanceof Error ? error.message : String(error)}`);
    return context.json({ error: 'Places provider could not be reached.' }, 502);
  } finally {
    clearTimeout(timeout);
  }
});

function getProviderErrorDetails(payload: unknown) {
  if (!payload || typeof payload !== 'object') return {};
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== 'object') return {};
  const details = error as { status?: unknown; code?: unknown };
  return {
    status: typeof details.status === 'string' ? details.status : undefined,
    code: typeof details.code === 'number' ? String(details.code) : undefined,
  };
}

function normalizePlacesResponse(payload: unknown): { places: unknown[] } | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const places = (payload as { places?: unknown }).places;
  return Array.isArray(places) ? { places } : { places: [] };
}

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port });
  console.log(`Location Demo Places proxy listening on port ${port}`);
}

export default app;
