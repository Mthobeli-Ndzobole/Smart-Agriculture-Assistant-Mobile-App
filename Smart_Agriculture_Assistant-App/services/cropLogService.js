import apiClient from './apiClient';

const BASE = '/crop-logs/logs';

export const fetchCropLogs = async () => {
  const { data } = await apiClient.get(`${BASE}/`);
  return data;
};

export const fetchCropLogById = async (id) => {
  const { data } = await apiClient.get(`${BASE}/${id}/`);
  return data;
};

export const createCropLog = async (payload) => {
  const { data } = await apiClient.post(`${BASE}/`, payload);
  return data;
};

export const updateCropLog = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE}/${id}/`, payload);
  return data;
};

export const deleteCropLog = async (id) => {
  await apiClient.delete(`${BASE}/${id}/`);
};
