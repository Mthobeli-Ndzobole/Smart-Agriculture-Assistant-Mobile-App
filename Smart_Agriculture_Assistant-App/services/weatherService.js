import apiClient from './apiClient';

const BASE = '/weather';

export const searchLocations = async (query) => {
  const { data } = await apiClient.get(`${BASE}/geo/`, { params: { q: query } });
  return data;
};

export const reverseGeocode = async (lat, lon) => {
  const { data } = await apiClient.get(`${BASE}/reverse-geo/`, { params: { lat, lon } });
  return data;
};

export const fetchCurrentWeather = async (lat, lon) => {
  const { data } = await apiClient.get(`${BASE}/current/`, { params: { lat, lon } });
  return data;
};

export const fetchForecast = async (lat, lon) => {
  const { data } = await apiClient.get(`${BASE}/forecast/`, { params: { lat, lon } });
  return data;
};

export const fetchWeatherAlert = async (lat, lon) => {
  const { data } = await apiClient.get(`${BASE}/alerts/`, { params: { lat, lon } });
  return data;
};
