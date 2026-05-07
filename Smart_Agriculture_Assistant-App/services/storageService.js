import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const canUseWebStorage = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;

const webGet = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
};

const webSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (_error) {
    return false;
  }
};

const webDelete = (key) => {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (_error) {
    return false;
  }
};

export const getItem = async (key) => {
  if (canUseWebStorage()) {
    return webGet(key);
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (_error) {
    if (canUseWebStorage()) return webGet(key);
    return null;
  }
};

export const setItem = async (key, value) => {
  if (canUseWebStorage()) {
    webSet(key, value);
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch (_error) {
    if (canUseWebStorage()) webSet(key, value);
  }
};

export const deleteItem = async (key) => {
  if (canUseWebStorage()) {
    webDelete(key);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (_error) {
    if (canUseWebStorage()) webDelete(key);
  }
};
