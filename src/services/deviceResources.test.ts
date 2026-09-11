import { isLowMemoryAndroidMemory, LOW_MEMORY_ANDROID_THRESHOLD_BYTES } from './deviceResourcesLogic';

describe('device resource detection', () => {
  it('detects the low-memory Android threshold', () => {
    expect(LOW_MEMORY_ANDROID_THRESHOLD_BYTES).toBe(2 * 1024 * 1024 * 1024);
    expect(isLowMemoryAndroidMemory(LOW_MEMORY_ANDROID_THRESHOLD_BYTES, 'android')).toBe(true);
  });

  it('leaves higher-memory Android and non-Android devices unchanged', () => {
    expect(isLowMemoryAndroidMemory(4 * 1024 * 1024 * 1024, 'android')).toBe(false);
    expect(isLowMemoryAndroidMemory(LOW_MEMORY_ANDROID_THRESHOLD_BYTES, 'ios')).toBe(false);
  });
});
