import apiClient from './client';
import { CameraManifestEntry, StreamState } from '../types';

export const getCameras = async (): Promise<CameraManifestEntry[]> => {
  const response = await apiClient.get('/api/cameras');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.cameras && Array.isArray(data.cameras)) return data.cameras;
  return [];
};

export const getAllStreams = async (): Promise<StreamState[]> => {
  const response = await apiClient.get('/api/streams');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.streams && Array.isArray(data.streams)) return data.streams;
  return [];
};

export const getStream = async (cam: number): Promise<StreamState> => {
  const response = await apiClient.get(`/api/streams/${cam}`);
  return response.data;
};

export const joinStream = async (cam: number) => {
  const response = await apiClient.post(`/api/streams/${cam}/join`);
  return response.data;
};

export const leaveStream = async (cam: number) => {
  const response = await apiClient.delete(`/api/streams/${cam}/leave`);
  return response.data;
};

export const stopStream = async (cam: number) => {
  const response = await apiClient.post(`/api/streams/${cam}/stop`);
  return response.data;
};
