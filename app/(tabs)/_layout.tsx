
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: '#F3F3F6',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          height: 78,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E4E4E8',
          borderRadius: 24,
          ...(Platform.OS === 'ios'
            ? {
                shadowColor: '#000000',
                shadowOpacity: 0.08,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 4 },
              }
            : {
                elevation: 10,
              }),
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#74747D',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="dilution"
        options={{
          title: 'Dilution',
          tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="surface"
        options={{
          title: 'Surface',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="project-new"
        options={{
          title: 'Projet',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />

      <Tabs.Screen name="project-detail" options={{ href: null }} />
      <Tabs.Screen name="pricing" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="business" options={{ href: null }} />
      <Tabs.Screen name="charges" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="equipment" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
    </Tabs>
  );
}
