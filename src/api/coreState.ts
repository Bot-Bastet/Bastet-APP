import apiClient from './client';
import { CoreState } from '../types';

/**
 * Récupère l'état complet du robot (Section 6 — DocsGateway)
 * GET /core/state
 */
export const getCoreState = async (): Promise<CoreState> => {
  const response = await apiClient.get('/core/state');
  return response.data;
};

/**
 * Met à jour l'état du robot (utilisé par le robot lui-même)
 * POST /core/state
 */
export const updateCoreState = async (state: Partial<CoreState>): Promise<any> => {
  const response = await apiClient.post('/core/state', state);
  return response.data;
};
