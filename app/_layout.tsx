
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GlideDrawerContent from '../components/glide/GlideDrawerContent';
import OnboardingScreen from '../components/onboarding/OnboardingScreen';
import { isContactProfileComplete, loadContactProfile } from '../lib/contactStore';
import { useProjectStore } from '../lib/projectStore';

export default function RootLayout() {
  // Tant qu'aucun profil de contact n'existe, on bloque sur l'écran de
  // première configuration avant de laisser accéder au reste de l'appli.
  // On attend aussi que projectStore ait fini de se restaurer depuis le
  // stockage local pour éviter un flash d'écrans vides (listes de
  // projets/devis/chantiers) avant que les données ne soient rechargées.
  const [gate, setGate] = useState<'loading' | 'onboarding' | 'app'>('loading');
  const [contactGate, setContactGate] = useState<'onboarding' | 'app' | null>(null);
  const projectsHydrated = useProjectStore((state) => state.hasHydrated);

  useEffect(() => {
    let cancelled = false;
    loadContactProfile().then((profile) => {
      if (cancelled) return;
      setContactGate(isContactProfileComplete(profile) ? 'app' : 'onboarding');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (contactGate && projectsHydrated) {
      setGate(contactGate);
    }
  }, [contactGate, projectsHydrated]);

  if (gate === 'loading') {
    return <View style={{ flex: 1, backgroundColor: '#F6F3EE' }} />;
  }

  if (gate === 'onboarding') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OnboardingScreen onComplete={() => setGate('app')} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <Drawer
      drawerContent={(props) => <GlideDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEdgeWidth: 40,
        overlayColor: 'rgba(0,0,0,0.22)',
        drawerStyle: {
          width: 320,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Accueil',
          title: 'Accueil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/charges"
        options={{
          drawerLabel: 'Mes charges',
          title: 'Mes charges',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/vehicles"
        options={{
          drawerLabel: 'Mes véhicules',
          title: 'Mes véhicules',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/equipment"
        options={{
          drawerLabel: 'Mon matériel',
          title: 'Mon matériel',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/products"
        options={{
          drawerLabel: 'Mes produits',
          title: 'Mes produits',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/contact-profile"
        options={{
          drawerLabel: 'Informations de contact',
          title: 'Informations de contact',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="id-card-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/profile"
        options={{
          drawerLabel: 'Informations de société',
          title: 'Informations de société',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/subscription"
        options={{
          drawerLabel: 'Mon offre actuelle',
          title: 'Mon offre actuelle',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/business"
        options={{
          drawerLabel: 'Business',
          title: 'Business',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="projects"
        options={{
          drawerLabel: 'Mes projets',
          title: 'Mes projets',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="quotes"
        options={{
          drawerLabel: 'Mes devis en cours',
          title: 'Mes devis en cours',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="to-plan"
        options={{
          drawerLabel: 'Mes chantiers à planifier',
          title: 'Mes chantiers à planifier',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="planning"
        options={{
          drawerLabel: 'Planning',
          title: 'Planning',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="archive"
        options={{
          drawerLabel: 'Archive',
          title: 'Archive',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(tabs)/revenue-summary"
        options={{
          drawerLabel: 'Résumé',
          title: 'Résumé',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen name="archive-detail" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="mission-detail" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
    </GestureHandlerRootView>
  );
}
