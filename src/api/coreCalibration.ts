import apiClient from './client';
import { ServoCalibration, StreamConfig } from '../types';

export const getServoCalibration = async (): Promise<ServoCalibration> => {
  const response = await apiClient.get('/core/calibration');
  return response.data;
};

export const setServoCalibration = async (offsets: number[]) => {
  const response = await apiClient.post('/core/calibration', { offsets });
  return response.data;
};

export const getCameraCalibration = async (camId: number) => {
  const response = await apiClient.get(`/core/camera/calibration/${camId}`);
  return response.data;
};

export const setCameraCalibration = async (camId: number, data: Record<string, unknown>) => {
  const response = await apiClient.post(`/core/camera/calibration/${camId}`, data);
  return response.data;
};

export const getStereoCalibration = async () => {
  const response = await apiClient.get('/core/camera/calibration/stereo');
  return response.data;
};

export const setStereoCalibration = async (data: Record<string, unknown>) => {
  const response = await apiClient.post('/core/camera/calibration/stereo', data);
  return response.data;
};

export const resetCameraCalibration = async () => {
  const response = await apiClient.post('/core/camera/calibration/reset');
  return response.data;
};

export const getCoreDiagnostics = async () => {
  const response = await apiClient.get('/core/diagnostics');
  return response.data;
};

export const getStreamConfig = async (): Promise<StreamConfig> => {
  const response = await apiClient.get('/core/stream/config');
  return response.data;
};

export const setStreamConfig = async (config: Partial<StreamConfig>) => {
  const response = await apiClient.post('/core/stream/config', config);
  return response.data;
};
