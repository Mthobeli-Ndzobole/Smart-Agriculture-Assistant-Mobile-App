import apiClient from './apiClient';

const BASE = '/market-prices/entries';

export const fetchMarketPrices = async () => {
  const { data } = await apiClient.get(`${BASE}/`);
  return data;
};

export const createMarketPrice = async (payload) => {
  const { data } = await apiClient.post(`${BASE}/`, payload);
  return data;
};

export const updateMarketPrice = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE}/${id}/`, payload);
  return data;
};

export const deleteMarketPrice = async (id) => {
  await apiClient.delete(`${BASE}/${id}/`);
};

export const fetchMarketOverview = async () => {
  const { data } = await apiClient.get(`${BASE}/overview/`);
  return data;
};
