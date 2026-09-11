import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { privacyPolicySections, termsSections } from '../content/legal';

type Props = { document: 'privacy' | 'terms'; onBack: () => void };

export function LegalDocumentScreen({ document, onBack }: Props) {
  const { theme } = useAppTheme();
  const sections = document === 'privacy' ? privacyPolicySections : termsSections;
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.titleRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton} onPress={onBack}><Text style={[styles.back, { color: theme.foreground }]}>Back</Text></Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>{document === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}</Text>
      </View>
      <Text style={[styles.intro, { color: theme.secondaryText }]}>This is a repository-level demo note. It explains what the sample app stores locally and what it intentionally does not include.</Text>
      {sections.map((section) => <React.Fragment key={section.title}><Text style={[styles.heading, { color: theme.foreground }]}>{section.title}</Text><Text style={[styles.body, { color: theme.secondaryText }]}>{section.body}</Text></React.Fragment>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, container: { padding: 16, paddingBottom: 48 }, titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, backButton: { minHeight: 44, justifyContent: 'center', paddingRight: 14 }, back: { fontWeight: '700' }, title: { flex: 1, fontSize: 28, fontWeight: '800' }, intro: { lineHeight: 21, marginBottom: 8 }, heading: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 5 }, body: { lineHeight: 21 }, });
