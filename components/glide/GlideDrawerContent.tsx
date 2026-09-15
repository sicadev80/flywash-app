import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

const GOLD = '#C79A2B';
const TEXT = '#18181C';
const MUTED = '#6F6F78';

function MenuItem({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.item, focused && styles.itemActive]}>
      <Ionicons name={icon} size={20} color={focused ? GOLD : TEXT} />
      <Text style={[styles.itemLabel, focused && styles.itemLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function GlideDrawerContent(props: DrawerContentComponentProps) {
  const pathname = usePathname();

  function go(path: string) {
    props.navigation.closeDrawer();
    router.push(path as any);
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container} scrollEnabled>
      <View style={styles.top}>
        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FW</Text>
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.brand}>FLY-WASH</Text>
            <Text style={styles.subBrand}>Pilotage & gestion chantier</Text>
          </View>
        </View>
      </View>

<View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>ACTIVITÉ</Text>
      </View>
<View style={styles.section}>
        <MenuItem label="Mes projets en cours" icon="folder-outline" onPress={() => router.push('/projects')} />
        <MenuItem label="Mes devis en cours" icon="document-text-outline" onPress={() => router.push('/quotes')} />
        <MenuItem label="Mes chantiers à planifier" icon="time-outline" onPress={() => router.push('/to-plan')} />
        <MenuItem label="Planning" icon="calendar-outline" onPress={() => router.push('/planning')} />
     
  </View>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>Business</Text>
      </View>

      <View style={styles.section}>
        <MenuItem label="Mes charges" icon="receipt-outline" focused={pathname === '/charges'} onPress={() => go('/charges')} />
        <MenuItem label="Mes véhicules" icon="car-outline" focused={pathname === '/vehicles'} onPress={() => go('/vehicles')} />
        <MenuItem label="Mon matériel" icon="construct-outline" focused={pathname === '/equipment'} onPress={() => go('/equipment')} />
        <MenuItem label="Mes produits" icon="flask-outline" focused={pathname === '/products'} onPress={() => go('/products')} />
      </View>

      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionTitle}>Compte</Text>
      </View>

      <View style={styles.section}>
        <MenuItem label="Profil" icon="person-outline" focused={pathname === '/profile'} onPress={() => go('/profile')} />
      </View>

      <View style={styles.footerCard}>
        <View style={styles.logoCircleSmall}>
          <Text style={styles.logoTextSmall}>FW</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerName}>Fly-Wash</Text>
          <Text style={styles.footerMail}>sicadrones@gmail.com</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={18} color={MUTED} />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 10, paddingBottom: 24 },
  top: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 42, height: 42, borderRadius: 999, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#111111', fontSize: 16, fontWeight: '900' },
  brandTextWrap: { flex: 1, gap: 2 },
  brand: { color: TEXT, fontSize: 22, fontWeight: '900', letterSpacing: 0.3 },
  subBrand: { color: MUTED, fontSize: 12, fontWeight: '600' },
  sectionTitleWrap: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  sectionTitle: { color: GOLD, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  section: { paddingHorizontal: 10, gap: 2 },
  item: { minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  itemActive: { backgroundColor: '#F6EFD9' },
  itemLabel: { color: TEXT, fontSize: 16, fontWeight: '700' },
  itemLabelActive: { color: GOLD },
  footerCard: { marginTop: 20, marginHorizontal: 18, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: '#F7F7FA', borderWidth: 1, borderColor: '#ECECEF', flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircleSmall: { width: 34, height: 34, borderRadius: 999, backgroundColor: GOLD, justifyContent: 'center', alignItems: 'center' },
  logoTextSmall: { color: '#111111', fontSize: 13, fontWeight: '900' },
  footerName: { color: TEXT, fontSize: 15, fontWeight: '800' },
  footerMail: { color: MUTED, fontSize: 12 },
});
