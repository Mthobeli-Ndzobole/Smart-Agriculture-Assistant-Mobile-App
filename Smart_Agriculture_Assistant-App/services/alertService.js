import apiClient from './apiClient';

const BASE = '/alerts/items';

export const fetchAlerts = async () => {
  const { data } = await apiClient.get(`${BASE}/`);
  return data;
};

export const createAlert = async (payload) => {
  const { data } = await apiClient.post(`${BASE}/`, payload);
  return data;
};

export const updateAlert = async (id, payload) => {
  const { data } = await apiClient.patch(`${BASE}/${id}/`, payload);
  return data;
};

export const deleteAlert = async (id) => {
  await apiClient.delete(`${BASE}/${id}/`);
};

export const markAllAlertsRead = async () => {
  const { data } = await apiClient.post(`${BASE}/mark_all_read/`);
  return data;
};

export const fetchAlertsSummary = async () => {
  const { data } = await apiClient.get(`${BASE}/summary/`);
  return data;
};
