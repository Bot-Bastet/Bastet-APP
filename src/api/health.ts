import apiClient from './client';
import { HealthStatus } from '../types';

export const getHealth = async (): Promise<HealthStatus> => {
  const response = await apiClient.get('/health');
  return response.data;
};
