import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/appTheme';
import { login } from '../../services/authService';

const DEMO_USERNAME = 'demo_farmer';
const DEMO_PASSWORD = 'Demo@12345';

export default function LoginScreen() {
  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Validation', 'Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/');
    } catch (_error) {
      Alert.alert('Login failed', 'Invalid credentials or backend unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const useDemoCredentials = () => {
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <Animated.View entering={FadeIn.duration(500)} style={styles.orbTop} />
      <Animated.View entering={FadeIn.duration(700)} style={styles.orbBottom} />

      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.glassPane}>
        <Text style={styles.title}>Smart Agriculture</Text>
        <Text style={styles.subtitle}>
          Sign in to weather, crop logs, alerts, market pricing and AI disease detection.
        </Text>

        <View style={styles.demoCard}>
          <Text style={styles.demoLabel}>Demo Login (copy/paste)</Text>
          <Text selectable style={styles.demoValue}>Username: {DEMO_USERNAME}</Text>
          <Text selectable style={styles.demoValue}>Password: {DEMO_PASSWORD}</Text>
          <TouchableOpacity style={styles.demoBtn} onPress={useDemoCredentials}>
            <Text style={styles.demoBtnText}>Use Demo Credentials</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={onLogin}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>Create account</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: '#DAF0E6',
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(46, 181, 120, 0.28)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(30, 122, 75, 0.23)',
  },
  glassPane: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    ...theme.shadow,
  },
  title: {
    color: '#1C4735',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    color: '#4C5E54',
    lineHeight: 18,
    marginBottom: 14,
  },
  demoCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#C9E2D4',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  demoLabel: {
    color: '#1F5D43',
    fontWeight: '900',
    marginBottom: 4,
  },
  demoValue: {
    color: '#355A49',
    fontWeight: '700',
    marginBottom: 2,
  },
  demoBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#E6F5EC',
    borderWidth: 1,
    borderColor: '#9ED1B8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoBtnText: {
    color: '#1C5A3E',
    fontWeight: '800',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#F7FBF8',
    borderWidth: 1,
    borderColor: '#D2E4D8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  linkBtn: {
    marginTop: 10,
    alignItems: 'center',
    padding: 10,
  },
  linkText: {
    color: '#245A44',
    fontWeight: '700',
  },
});
