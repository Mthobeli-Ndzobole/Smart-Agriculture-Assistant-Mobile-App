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
import { useRouter } from 'expo-router';

import { theme } from '../../constants/appTheme';
import { register } from '../../services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      Alert.alert('Success', 'Account created. Please login.');
      router.replace('/login');
    } catch (error) {
      const detail = error?.response?.data?.detail || 'Registration failed.';
      Alert.alert('Error', detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Set up your farm workspace.</Text>

        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Confirm password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

        <TouchableOpacity style={styles.primaryBtn} onPress={onRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.linkText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EAF3EE',
    justifyContent: 'center',
    padding: 20,
    paddingTop: StatusBar.currentHeight || 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...theme.shadow,
  },
  title: {
    color: '#1C4735',
    fontSize: 27,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: '#5F6E65',
    marginBottom: 16,
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
