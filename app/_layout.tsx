
import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import GlideDrawerContent from '../components/glide/GlideDrawerContent';

export default function RootLayout() {
  return (
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
        name="(tabs)/profile"
        options={{
          drawerLabel: 'Profil',
          title: 'Profil',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
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

      <Drawer.Screen name="mission-detail" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
