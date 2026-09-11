import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {
  DistanceUnit,
  getRadiusMinimumMeters,
  getRadiusSliderMaximumForTravelMode,
  getRadiusSliderMinimum,
  getRadiusSliderStep,
  getRadiusSliderValue,
  metersToDistance,
  TRAVEL_MODE_OPTIONS,
  usePreferences,
} from '../hooks/usePreferences';
import { TravelerProfile } from '../services/placesApi';
import { PreferencesScreenProps } from '../navigation/types';
import { PageHeader } from '../components/PageHeader';
import { useAppTheme } from '../contexts/ThemeContext';
import { CountryAutocompleteInput } from '../components/CountryAutocompleteInput';

const travelerProfileOptions: { id: TravelerProfile; label: string; description: string }[] = [
  { id: 'master_planner', label: 'Master planner', description: 'Prefers efficient, pre-planned stops.' },
  { id: 'go_with_flow', label: 'Go with the flow', description: 'Likes flexible nearby options with low effort.' },
  { id: 'balanced_browser', label: 'Balanced browser', description: 'Mixes planned picks with spontaneous finds.' },
  { id: 'curious_wanderer', label: 'Curious wanderer', description: 'Prefers landmarks, parks, and discovery spots.' },
  { id: 'food_hunter', label: 'Food explorer', description: 'Prioritizes restaurants, cafes, and local flavor.' },
  { id: 'nightlife_chaser', label: 'Entertainment enjoyer', description: 'Looks for evening hangout places.' },
  { id: 'culture_collector', label: 'Culture collector', description: 'Prefers museums, heritage, and attractions.' },
  { id: 'wellness_recharger', label: 'Wellness recharger', description: 'Focuses on gyms, spas, and calming places.' },
];

function SettingSeparator({ color }: { color: string }) {
  return <View style={[styles.separator, { backgroundColor: color }]} />;
}

export function PreferencesScreen({ navigation }: PreferencesScreenProps) {
  const { mode: themeMode, updateMode: updateThemeMode, theme } = useAppTheme();
  const {
    radiusMeters, updateRadiusValue, homeCity, homeRegion, homeCountry, workCity, workRegion,
    travelerProfiles, updateHomeCity, updateHomeRegion, updateHomeCountry, updateWorkCity, updateWorkRegion,
    distanceUnit, updateDistanceUnit, toggleTravelerProfile, travelMode, updateTravelMode,
    advancedDetails, updateAdvancedDetails,
  } = usePreferences();
  const radiusMinimumMeters = getRadiusMinimumMeters();
  const radiusMinimumLabel = radiusMinimumMeters < 1000
    ? `${radiusMinimumMeters} m`
    : `${metersToDistance(radiusMinimumMeters, distanceUnit).toFixed(1)} ${distanceUnit === 'miles' ? 'mi' : 'km'}`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <PageHeader title="Settings" navigation={navigation} />
        <View style={[styles.infoCard, { backgroundColor: theme.muted }]}>
          <Text style={[styles.infoTitle, { color: theme.foreground }]}>Local demo mode</Text>
          <Text style={[styles.help, { color: theme.secondaryText }]}>Preferences, visited places, wishlist items, and sample results stay on this device. No account or online service is required.</Text>
        </View>

        <Text style={[styles.section, { color: theme.foreground }]}>Travel mode</Text>
        <Text style={[styles.help, { color: theme.secondaryText }]}>Walking limits the radius to 5 {distanceUnit === 'miles' ? 'miles' : 'km'}; driving also includes service stations.</Text>
        <View style={styles.rowWrap}>{TRAVEL_MODE_OPTIONS.map((option) => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: travelMode === option.value }} style={[styles.chip, { backgroundColor: travelMode === option.value ? theme.primary : theme.muted }]} onPress={() => void updateTravelMode(option.value)}><Text style={{ color: travelMode === option.value ? theme.onPrimary : theme.foreground }}>{option.label}</Text></Pressable>)}</View>

        <Text style={[styles.section, styles.sectionSpaced, { color: theme.foreground }]}>Place details</Text>
        <Text style={[styles.help, { color: theme.secondaryText }]}>Show the extra sample fields available on a place card and detail screen.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="Show more place details" accessibilityState={{ checked: advancedDetails }} style={[styles.checkboxRow, { backgroundColor: theme.card, borderColor: advancedDetails ? theme.primary : theme.border }]} onPress={() => void updateAdvancedDetails(!advancedDetails)}>
          <View style={[styles.checkbox, { borderColor: advancedDetails ? theme.primary : theme.secondaryText, backgroundColor: advancedDetails ? theme.primary : 'transparent' }]}>{advancedDetails ? <Text style={[styles.checkboxMark, { color: theme.onPrimary }]}>✓</Text> : null}</View>
          <View style={styles.checkboxCopy}><Text style={[styles.checkboxTitle, { color: theme.foreground }]}>Show more details</Text><Text style={[styles.checkboxDescription, { color: theme.secondaryText }]}>Include ratings, opening status, and other fixture details.</Text></View>
        </Pressable>

        <Text style={[styles.section, styles.sectionSpaced, { color: theme.foreground }]}>Search radius</Text>
        <Text style={[styles.help, { color: theme.secondaryText }]}>Sets how far sample results are placed from your current position.</Text>
        <Text style={[styles.radiusValue, { color: theme.accent }]}>{radiusMeters < 1000 ? `${radiusMeters} m` : distanceUnit === 'miles' ? `${metersToDistance(radiusMeters, distanceUnit).toFixed(1)} mi` : `${metersToDistance(radiusMeters, distanceUnit)} km`}</Text>
        <Slider accessibilityLabel="Search radius" minimumValue={getRadiusSliderMinimum(distanceUnit)} maximumValue={getRadiusSliderMaximumForTravelMode(distanceUnit, travelMode)} step={getRadiusSliderStep(distanceUnit)} value={getRadiusSliderValue(radiusMeters, distanceUnit)} onValueChange={(value) => void updateRadiusValue(value)} minimumTrackTintColor={theme.primary} maximumTrackTintColor={theme.border} thumbTintColor={theme.primary} />
        <View style={styles.rangeLabels}><Text style={{ color: theme.secondaryText }}>{radiusMinimumLabel}</Text><Text style={{ color: theme.secondaryText }}>{getRadiusSliderMaximumForTravelMode(distanceUnit, travelMode).toFixed(1)} {distanceUnit === 'miles' ? 'mi' : 'km'}</Text></View>

        <Text style={[styles.section, { color: theme.foreground }]}>Distance units</Text>
        <View style={styles.rowWrap}>{(['km', 'miles'] as DistanceUnit[]).map((unit) => <Pressable key={unit} accessibilityRole="button" accessibilityState={{ selected: distanceUnit === unit }} style={[styles.chip, { backgroundColor: distanceUnit === unit ? theme.primary : theme.muted }]} onPress={() => void updateDistanceUnit(unit)}><Text style={{ color: distanceUnit === unit ? theme.onPrimary : theme.foreground }}>{unit === 'km' ? 'Kilometres' : 'Miles'}</Text></Pressable>)}</View>

        <Text style={[styles.section, { color: theme.foreground }]}>Home and work places</Text>
        <Text style={[styles.help, { color: theme.secondaryText }]}>Optional familiar locations used to demonstrate the safety prompt before a nearby search.</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.foreground }]} placeholderTextColor={theme.secondaryText} value={homeCity} onChangeText={updateHomeCity} placeholder="Home city/town" autoCapitalize="words" />
        <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.foreground }]} placeholderTextColor={theme.secondaryText} value={homeRegion} onChangeText={updateHomeRegion} placeholder="Home state/county" autoCapitalize="words" />
        <CountryAutocompleteInput value={homeCountry} onSelect={(value) => void updateHomeCountry(value)} placeholder="Country" />
        <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.foreground }]} placeholderTextColor={theme.secondaryText} value={workCity} onChangeText={updateWorkCity} placeholder="Work city/town (optional)" autoCapitalize="words" />
        <TextInput style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.foreground }]} placeholderTextColor={theme.secondaryText} value={workRegion} onChangeText={updateWorkRegion} placeholder="Work state/county (optional)" autoCapitalize="words" />

        <SettingSeparator color={theme.border} />
        <Text style={[styles.section, { color: theme.foreground }]}>Traveller style filters</Text>
        <Text style={[styles.help, { color: theme.secondaryText }]}>Choose styles to filter nearby places. Multiple styles can be active.</Text>
        <View style={styles.profileWrap}>{travelerProfileOptions.map((option) => { const selected = travelerProfiles.includes(option.id); return <Pressable key={option.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[styles.profileOption, { backgroundColor: selected ? theme.muted : theme.card, borderColor: selected ? theme.primary : theme.border }]} onPress={() => void toggleTravelerProfile(option.id)}><Text style={[styles.profileTitle, { color: theme.foreground }]}>{selected ? '✓ ' : ''}{option.label}</Text><Text style={[styles.profileDesc, { color: theme.secondaryText }]}>{option.description}</Text></Pressable>; })}</View>

        <SettingSeparator color={theme.border} />
        <Text style={[styles.section, { color: theme.foreground }]}>Appearance</Text>
        <Text style={[styles.help, { color: theme.secondaryText }]}>Controls light, dark, or system-driven colour mode.</Text>
        <View style={styles.rowWrap}>{(['system', 'light', 'dark'] as const).map((mode) => <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: themeMode === mode }} style={[styles.chip, { backgroundColor: themeMode === mode ? theme.primary : theme.muted }]} onPress={() => updateThemeMode(mode)}><Text style={{ color: themeMode === mode ? theme.onPrimary : theme.foreground }}>{mode[0].toUpperCase() + mode.slice(1)}</Text></Pressable>)}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { padding: 14 }, infoCard: { borderRadius: 14, padding: 14, marginBottom: 8 }, infoTitle: { fontWeight: '800', marginBottom: 4 },
  radiusValue: { fontSize: 22, fontWeight: '800', marginVertical: 4 }, rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, opacity: 0.7 },
  section: { fontSize: 15, fontWeight: '700', marginTop: 10, marginBottom: 4 }, sectionSpaced: { marginTop: 28 }, help: { fontSize: 12, lineHeight: 18, opacity: 0.8, marginBottom: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 6 }, checkboxRow: { minHeight: 68, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 26, height: 26, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, checkboxMark: { fontSize: 18, fontWeight: '800', lineHeight: 20 }, checkboxCopy: { flex: 1 }, checkboxTitle: { fontWeight: '700', lineHeight: 20 }, checkboxDescription: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: 6, marginVertical: 14 }, profileWrap: { gap: 6 }, profileOption: { borderWidth: 1, borderRadius: 10, padding: 8 }, profileTitle: { fontWeight: '700' }, profileDesc: { fontSize: 12, opacity: 0.74, marginTop: 2 },
});
