import { ColorSchemeName } from 'react-native';

export const lightTheme = {
  primary: '#E67550',
  accent: '#359C89',
  background: '#FDF6EA',
  foreground: '#181D25',
  card: '#FDFCFB',
  muted: '#EFEBE6',
  secondaryText: '#526168',
  onPrimary: '#FFFFFF',
  successSurface: '#DCEFE7',
  successText: '#1F6258',
  warningSurface: '#FFF4D7',
  warningText: '#704C00',
  errorSurface: '#FBE5E2',
  errorText: '#9C3027',
  destructive: '#EF4444',
  border: '#DED9D2',
};

export const darkTheme = {
  primary: '#F08A66',
  accent: '#4EB5A1',
  background: '#0E1117',
  foreground: '#F6F7F9',
  card: '#151A22',
  muted: '#222A36',
  secondaryText: '#B7C1CC',
  onPrimary: '#101722',
  successSurface: '#15352F',
  successText: '#8BE0C7',
  warningSurface: '#3A2E13',
  warningText: '#FFD98A',
  errorSurface: '#3A1F24',
  errorText: '#FFB4B4',
  destructive: '#F87171',
  border: '#323B49',
};

export type ThemeMode = 'light' | 'dark' | 'system';

export const resolveTheme = (mode: ThemeMode, system: ColorSchemeName) => {
  if (mode === 'system') {
    return system === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
};
