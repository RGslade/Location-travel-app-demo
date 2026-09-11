// Expo exposes total physical memory rather than Android's native
// ActivityManager.isLowRamDevice flag. This threshold is deliberately
// conservative so ordinary modern phones keep the existing experience.
export const LOW_MEMORY_ANDROID_THRESHOLD_BYTES = 2 * 1024 * 1024 * 1024;

export function isLowMemoryAndroidMemory(totalMemory: number | null, platformOS: string) {
  return platformOS === 'android'
    && typeof totalMemory === 'number'
    && totalMemory <= LOW_MEMORY_ANDROID_THRESHOLD_BYTES;
}
