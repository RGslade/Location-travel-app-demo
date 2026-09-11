import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { isLowMemoryAndroidMemory } from './deviceResourcesLogic';

export function isLowMemoryAndroidDevice() {
  return isLowMemoryAndroidMemory(Device.totalMemory, Platform.OS);
}
