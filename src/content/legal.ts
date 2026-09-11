export const PRIVACY_POLICY_VERSION = 'demo-1';
export const TERMS_VERSION = 'demo-1';

export const privacyPolicySections = [
  { title: '1. What is stored', body: 'The demo stores preferences, visited-place records, wishlist records, and a small sample-results cache in local device storage.' },
  { title: '2. Location access', body: 'Foreground location is requested to find nearby places around the current device location while the app is open. You can deny permission, although nearby discovery will then be unavailable.' },
  { title: '3. What is not included', body: 'This repository has no account system, hosted application database, analytics, advertising, purchase flow, or provider secret. The Google Places key is supplied only to the proxy at runtime.' },
  { title: '4. Clearing data', body: 'Removing the app or clearing its app storage removes the locally stored state. The app does not intentionally build a location-history database.' },
  { title: '5. Places data', body: 'Nearby place results are requested from Google Places through the configured proxy. Provider information can change and should be checked before relying on it.' },
  { title: 'Last updated', body: 'Demo documentation version demo-2.' },
];

export const termsSections = [
  { title: '1. Intended use', body: 'Use this repository as a teaching, review, or presentation example for a location-aware React Native interface.' },
  { title: '2. Live places behavior', body: 'Nearby results come from Google Places through a local or deployed proxy. The proxy key is supplied at runtime and is not stored in this repository.' },
  { title: '3. Location and safety', body: 'Location suggestions are approximate. Do not use the results for emergencies, accessibility decisions, or as a substitute for checking official place information.' },
  { title: '4. Project scope', body: 'The project focuses on location and discovery behavior, with local preferences, visited places, wishlist items, and a runtime-configured Places proxy.' },
  { title: '5. Usage costs', body: 'Google Places requests may incur charges under the configured Google Cloud billing account. Use quotas, API restrictions, and the provider dashboard to control usage.' },
  { title: 'Last updated', body: 'Demo documentation version demo-2.' },
];
