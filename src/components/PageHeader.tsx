import React, { useState } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { SideDrawer } from './SideDrawer';
import { useAppTheme } from '../contexts/ThemeContext';

type PageHeaderProps = {
  title: string;
  navigation: NavigationProp<RootStackParamList>;
};

export function PageHeader({ title, navigation }: PageHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme } = useAppTheme();
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open menu" style={styles.menuButton} onPress={() => setDrawerOpen(true)}>
          <Text style={[styles.menuText, { color: theme.foreground }]}>☰</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
        <View style={styles.spacer} />
      </View>
      <SideDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        goDiscover={() => {
          closeDrawer();
          const currentRoute = navigation.getState().routes[navigation.getState().index]?.name;
          navigation.navigate('Discover', { from: currentRoute === 'Preferences' ? 'settings' : 'menu' });
        }}
        goPreferences={() => { closeDrawer(); navigation.navigate('Preferences'); }}
        goHistory={() => { closeDrawer(); navigation.navigate('History'); }}
        goWishlist={() => { closeDrawer(); navigation.navigate('Wishlist'); }}
        goLegal={() => { closeDrawer(); navigation.navigate('Legal', {}); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  menuButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderRadius: 8 },
  menuText: { fontSize: 20, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700' },
  spacer: { flex: 1 },
});
