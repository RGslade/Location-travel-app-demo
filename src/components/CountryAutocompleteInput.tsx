import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { COUNTRY_OPTIONS } from '../data/countries';

export function CountryAutocompleteInput({
  value,
  placeholder,
  onSelect,
}: {
  value: string;
  placeholder: string;
  onSelect: (value: string) => void;
}) {
  const { theme } = useAppTheme();
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const query = text.trim().toLocaleLowerCase();
    if (!focused) return [];
    if (query.length === 0) return COUNTRY_OPTIONS.slice(0, 8);
    return COUNTRY_OPTIONS.filter((country) => country.toLocaleLowerCase().startsWith(query)).slice(0, 8);
  }, [focused, text]);

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.foreground }]}
        placeholderTextColor={theme.secondaryText}
        value={focused ? text : value}
        onChangeText={(next) => {
          setText(next);
          if (!next.trim()) onSelect('');
        }}
        onFocus={() => {
          setText(value);
          setFocused(true);
        }}
        onBlur={() => setTimeout(() => {
          const exactMatch = COUNTRY_OPTIONS.find((country) => country.toLocaleLowerCase() === text.trim().toLocaleLowerCase());
          if (exactMatch) {
            setText(exactMatch);
            onSelect(exactMatch);
          }
          setFocused(false);
        }, 150)}
        placeholder={placeholder}
        autoCapitalize="words"
        accessibilityLabel={placeholder}
      />
      {suggestions.length > 0 ? (
        <View style={[styles.suggestions, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {suggestions.map((country) => (
            <Pressable
              key={country}
              accessibilityRole="button"
              accessibilityLabel={`Select ${country}`}
              style={[styles.suggestion, { borderBottomColor: theme.border }]}
              onPressIn={() => {
                setText(country);
                setFocused(false);
                onSelect(country);
              }}
            >
              <Text style={{ color: theme.foreground }}>{country}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 6, zIndex: 2, elevation: 2 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  suggestions: { borderWidth: 1, borderRadius: 10, marginTop: 4, overflow: 'hidden', zIndex: 3, elevation: 3 },
  suggestion: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1 },
});
