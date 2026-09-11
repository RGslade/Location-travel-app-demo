import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegalScreenProps } from '../navigation/types';
import { PageHeader } from '../components/PageHeader';
import { useAppTheme } from '../contexts/ThemeContext';
import { LegalDocumentScreen } from './LegalDocumentScreen';

export function LegalScreen({ navigation, route }: LegalScreenProps) {
  const { theme } = useAppTheme();
  if (route.params?.document) return <LegalDocumentScreen document={route.params.document} onBack={() => navigation.goBack()} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeader title="Demo notes" navigation={navigation} />
        <Text style={[styles.heading, { color: theme.foreground }]}>What this demo uses</Text>
        <Text style={[styles.body, { color: theme.secondaryText }]}>Location Demo uses foreground location while the app is open to request nearby place results from the configured Google Places service. Preferences, visited-place IDs, and wishlist data are stored locally on the device.</Text>
        <Text style={[styles.heading, { color: theme.foreground }]}>Why the data is local</Text>
        <Text style={[styles.body, { color: theme.secondaryText }]}>This repository contains no account flow, provider credentials, paid feature system, advertising, or hosted application database. The Google Places key is supplied only to the local or deployed proxy at runtime.</Text>
        <Text style={[styles.heading, { color: theme.foreground }]}>Using the results</Text>
        <Text style={[styles.body, { color: theme.secondaryText }]}>Nearby names, addresses, ratings, opening states, and locations come from Google Places when the proxy is configured. Provider information can change, so check the place and official sources before setting off.</Text>
        <Text style={[styles.heading, { color: theme.foreground }]}>Supporting documents</Text>
        <Text style={[styles.body, { color: theme.secondaryText }]}>The short documents below describe the demo's local storage and intended boundaries. They are not production legal advice.</Text>
        <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Legal', { document: 'privacy' })}><Text style={[styles.link, { color: theme.accent }]}>Read the privacy note</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Legal', { document: 'terms' })}><Text style={[styles.link, { color: theme.accent }]}>Read the usage note</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 17, fontWeight: '700', marginTop: 14, marginBottom: 5 },
  body: { lineHeight: 21, opacity: 0.78 }, link: { fontWeight: '700', textDecorationLine: 'underline', marginTop: 14 },
});
