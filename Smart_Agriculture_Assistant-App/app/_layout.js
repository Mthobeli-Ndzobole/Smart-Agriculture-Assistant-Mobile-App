import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { getAccessToken } from '../services/authService';

export default function RootLayout() {
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const inAuthGroup = useMemo(() => segments[0] === '(auth)', [segments]);

  useEffect(() => {
    let mounted = true;
    const syncAuthState = async () => {
      let token = null;
      try {
        token = await getAccessToken();
      } catch (_error) {
        token = null;
      }
      if (!mounted) return;
      setIsAuthenticated(Boolean(token));
      setLoading(false);
    };
    syncAuthState();
    return () => {
      mounted = false;
    };
  }, [segments]);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, inAuthGroup, loading]);

  if (loading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
