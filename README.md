# Location Demo

A personal Expo/React Native project for exploring nearby places through Google Places.

## What it demonstrates

- Foreground location permission and location-aware place results
- Category, traveller-style, visited-place, and text filters
- List and map presentation, place details, history, and wishlist
- Device-local preferences, light/dark/system themes, and safe empty/loading/error states
- A deliberately isolated data boundary in `src/services/placesApi.ts`

Nearby results are requested from Google Places through the included server-side proxy. The proxy keeps the Google Places key out of the mobile bundle and repository.

## Run it

```powershell
pnpm install --frozen-lockfile
${env:GOOGLE_PLACES_API_KEY} = 'your-key'
pnpm server:dev
# In a second shell, set EXPO_PUBLIC_PLACES_API_URL and run:
${env:EXPO_PUBLIC_PLACES_API_URL} = 'http://localhost:8787'
pnpm start
```

Useful checks:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm validate
```

Copy `env.example` to your local environment configuration as a reference. Do not commit the Google Places key. Google Places usage may incur charges under the configured Google Cloud billing account, so restrict the key and set quotas before testing.

## Repository notes

The `.codeveloper` folder documents the project's architecture, design conventions, privacy boundary, and validation contract.
