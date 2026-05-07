import Constants from 'expo-constants';
import { Platform } from 'react-native';

const normalize = (url) => url.replace(/\/+$/, '');

const hostFromExpo = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.developer?.tool ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';

  if (!hostUri || typeof hostUri !== 'string') return null;

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost') return null;

  return `http://${host}:8000`;
};

export const API_BASE_URL = (() => {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return normalize(fromEnv);

  const fromExpoHost = hostFromExpo();
  if (fromExpoHost) return normalize(fromExpoHost);

  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://127.0.0.1:8000';
})();

export const API_ROOT = `${API_BASE_URL}/api`;
