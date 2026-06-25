import apiClient from './client';
import { UpdateProgress } from '../types';

// ═══════════════════════════════════════════════════════════════
// Section 7 — Mises à Jour & Télémétrie (DocsGateway)
// Gateway, Robot, Arduino
// ═══════════════════════════════════════════════════════════════

// ─── Gateway ──────────────────────────────────────────────────

/** POST /system/update/gateway — Lance la mise à jour de la Gateway */
export const triggerGatewayUpdate = async (): Promise<any> => {
  const response = await apiClient.post('/system/update/gateway');
  return response.data;
};

/** GET /system/update/gateway/progress — Progression de la mise à jour Gateway */
export const getGatewayUpdateProgress = async (force: boolean = false): Promise<UpdateProgress> => {
  const params = force ? { force: 'true' } : {};
  const response = await apiClient.get('/system/update/gateway/progress', { params });
  return response.data;
};

/** POST /system/update/gateway/progress — Met à jour la progression Gateway */
export const setGatewayUpdateProgress = async (data: Partial<UpdateProgress>): Promise<any> => {
  const response = await apiClient.post('/system/update/gateway/progress', data);
  return response.data;
};

// ─── Robot ────────────────────────────────────────────────────

/** POST /system/update/robot — Déclenche la mise à jour du robot via WebSocket */
export const triggerRobotUpdate = async (): Promise<any> => {
  const response = await apiClient.post('/system/update/robot');
  return response.data;
};

/** GET /system/update/robot/progress — Progression de la mise à jour Robot (colcon build) */
export const getRobotUpdateProgress = async (force: boolean = false): Promise<UpdateProgress> => {
  const params = force ? { force: 'true' } : {};
  const response = await apiClient.get('/system/update/robot/progress', { params });
  return response.data;
};

/** POST /system/update/robot/progress — Le robot notifie son état de mise à jour */
export const setRobotUpdateProgress = async (data: Partial<UpdateProgress>): Promise<any> => {
  const response = await apiClient.post('/system/update/robot/progress', data);
  return response.data;
};

// ─── Arduino ──────────────────────────────────────────────────

/** POST /system/update/arduino — Déclenche le flashage Arduino Mega */
export const triggerArduinoUpdate = async (): Promise<any> => {
  const response = await apiClient.post('/system/update/arduino');
  return response.data;
};

/** GET /system/update/arduino/progress — Progression du flashage Arduino */
export const getArduinoUpdateProgress = async (force: boolean = false): Promise<UpdateProgress> => {
  const params = force ? { force: 'true' } : {};
  const response = await apiClient.get('/system/update/arduino/progress', { params });
  return response.data;
};

/** POST /system/update/arduino/progress — Le robot notifie l'avancement du flash Arduino */
export const setArduinoUpdateProgress = async (data: Partial<UpdateProgress>): Promise<any> => {
  const response = await apiClient.post('/system/update/arduino/progress', data);
  return response.data;
};
