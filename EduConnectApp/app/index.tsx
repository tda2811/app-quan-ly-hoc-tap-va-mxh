import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function EntryScreen() {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'admin') {
      return <Redirect href="/(admin-tabs)" />;
    } else {
      return <Redirect href="/(tabs)" />;
    }
  }

  return <Redirect href="/login" />;
}
