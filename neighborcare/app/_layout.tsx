import React from 'react';
import { AuthProvider } from '@/src/context/AuthContext';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
