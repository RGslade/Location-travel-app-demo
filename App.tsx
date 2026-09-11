import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { PreferencesScreen } from './src/screens/PreferencesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import { PlaceDetailsScreen } from './src/screens/PlaceDetailsScreen';
import { RootStackParamList } from './src/navigation/types';
import { LegalScreen } from './src/screens/LegalScreen';
import { ThemeProvider, useAppTheme } from './src/contexts/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function DemoApp() {
  const { theme } = useAppTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <View style={styles.root}>
          <StatusBar
            barStyle={theme.background === '#0E1117' ? 'light-content' : 'dark-content'}
            backgroundColor={theme.background}
            translucent={false}
          />
          <View style={styles.content}>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Discover">
              <Stack.Screen name="Discover" component={DiscoverScreen} />
              <Stack.Screen name="Preferences" component={PreferencesScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Wishlist" component={WishlistScreen} />
              <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
            </Stack.Navigator>
          </View>
        </View>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DemoApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
