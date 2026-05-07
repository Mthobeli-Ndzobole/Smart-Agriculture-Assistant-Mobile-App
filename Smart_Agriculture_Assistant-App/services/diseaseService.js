import apiClient from './apiClient';

const BASE = '/disease-detection/scans';

export const fetchDiseaseScans = async () => {
  const { data } = await apiClient.get(`${BASE}/`);
  return data;
};

export const fetchDiseaseSummary = async () => {
  const { data } = await apiClient.get(`${BASE}/summary/`);
  return data;
};

export const deleteDiseaseScan = async (id) => {
  await apiClient.delete(`${BASE}/${id}/`);
};

export const uploadDiseaseScan = async ({ imageUri, cropName, notes }) => {
  const formData = new FormData();
  formData.append('crop_name', cropName || '');
  formData.append('notes', notes || '');
  formData.append('image', {
    uri: imageUri,
    name: `scan_${Date.now()}.jpg`,
    type: 'image/jpeg',
  });

  const { data } = await apiClient.post(`${BASE}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};
