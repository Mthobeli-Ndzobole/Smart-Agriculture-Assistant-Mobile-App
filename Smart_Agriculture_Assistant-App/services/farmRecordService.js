import apiClient from './apiClient';
import { deleteItem, getItem, setItem } from './storageService';

const BASE = '/farm-records/records';
const OFFLINE_QUEUE_KEY = 'offline_queue';

export const fetchRecords = async () => {
  const { data } = await apiClient.get(`${BASE}/`);
  return data;
};

export const fetchRecordSummary = async () => {
  const { data } = await apiClient.get(`${BASE}/summary/`);
  return data;
};

export const createRecord = async (payload) => {
  const { data } = await apiClient.post(`${BASE}/`, payload);
  return data;
};

export const updateRecord = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE}/${id}/`, payload);
  return data;
};

export const deleteRecord = async (id) => {
  await apiClient.delete(`${BASE}/${id}/`);
};

export const queueOfflineRecord = async (record, action = 'CREATE') => {
  const queueRaw = await getItem(OFFLINE_QUEUE_KEY);
  const queue = queueRaw ? JSON.parse(queueRaw) : [];
  queue.push({ action, record, timestamp: Date.now() });
  await setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const syncOfflineRecords = async () => {
  const queueRaw = await getItem(OFFLINE_QUEUE_KEY);
  if (!queueRaw) return;

  const queue = JSON.parse(queueRaw);
  const failed = [];

  for (const item of queue) {
    try {
      if (item.action === 'CREATE') {
        await createRecord(item.record);
      } else if (item.action === 'UPDATE' && item.record?.id) {
        await updateRecord(item.record.id, item.record);
      } else if (item.action === 'DELETE' && item.record?.id) {
        await deleteRecord(item.record.id);
      }
    } catch (_error) {
      failed.push(item);
    }
  }

  if (failed.length) {
    await setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
  } else {
    await deleteItem(OFFLINE_QUEUE_KEY);
  }
};
