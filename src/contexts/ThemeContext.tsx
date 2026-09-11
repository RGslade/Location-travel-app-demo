import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { ThemeMode, lightTheme, resolveTheme } from '../theme/tokens';

const THEME_MODE_KEY = 'location_demo_theme_mode';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: typeof lightTheme;
  updateMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    void AsyncStorage.getItem(THEME_MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') setMode(stored);
    });
  }, []);

  const updateMode = async (next: ThemeMode) => {
    setMode(next);
    await AsyncStorage.setItem(THEME_MODE_KEY, next);
  };

  const value = useMemo(() => ({ mode, theme: resolveTheme(mode, systemTheme), updateMode }), [mode, systemTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (value) return value;
  return {
    mode: 'light' as ThemeMode,
    theme: lightTheme,
    updateMode: async (_mode: ThemeMode) => undefined,
  };
}
