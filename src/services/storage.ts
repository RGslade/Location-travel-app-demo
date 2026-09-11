import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredValue(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export function parseStoredJson<T>(
  value: string | null,
  fallback: T,
  isValid: (candidate: unknown) => candidate is T,
): T {
  if (!value) {
    return fallback;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function isStringArray(candidate: unknown): candidate is string[] {
  return Array.isArray(candidate) && candidate.every((item) => typeof item === 'string');
}
