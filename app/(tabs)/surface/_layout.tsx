import React from 'react';
import { Stack } from 'expo-router';

export default function SurfaceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="manual" />
      <Stack.Screen name="terrain" />
      <Stack.Screen name="[type]" />
    </Stack>
  );
}
