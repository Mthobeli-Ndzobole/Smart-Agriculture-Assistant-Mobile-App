import axios from 'axios';
import { router } from 'expo-router';

import { API_ROOT } from './apiConfig';
import { deleteItem, getItem, setItem } from './storageService';

const AUTH_BASE = `${API_ROOT}/auth`;

export const register = async (username, email, password) => {
  const { data } = await axios.post(`${AUTH_BASE}/register/`, { username, email, password });
  return data;
};

export const login = async (username, password) => {
  const { data } = await axios.post(`${AUTH_BASE}/login/`, { username, password });
  await setItem('access_token', data.access);
  await setItem('refresh_token', data.refresh);
  return data;
};

export const getAccessToken = async () => getItem('access_token');

export const refreshToken = async () => {
  const refresh = await getItem('refresh_token');
  if (!refresh) return null;

  try {
    const { data } = await axios.post(`${AUTH_BASE}/token/refresh/`, { refresh });
    await setItem('access_token', data.access);
    return data.access;
  } catch (error) {
    await clearTokens();
    return null;
  }
};

export const clearTokens = async () => {
  await deleteItem('access_token');
  await deleteItem('refresh_token');
};

export const logout = async () => {
  const refresh = await getItem('refresh_token');
  if (refresh) {
    try {
      await axios.post(`${AUTH_BASE}/logout/`, { refresh }, {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      });
    } catch (_error) {
      // Token can already be expired, clear local state anyway.
    }
  }

  await clearTokens();
  router.replace('/login');
};
