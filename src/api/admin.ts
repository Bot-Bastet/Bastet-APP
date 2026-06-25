import apiClient from './client';
import { UserAccount } from '../types';

/**
 * GET /accounts — Liste tous les comptes enregistrés (nécessite Admin)
 * Corrigé : /admin/users → /accounts (cf. DocsGateway Section 2)
 */
export const getAllUsers = async (): Promise<UserAccount[]> => {
  const response = await apiClient.get('/accounts');
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

export const deleteUserIntranet = async (userId: string) => {
  const response = await apiClient.delete(`/admin/users/${userId}/intranet`);
  return response.data;
};

export const updateSettings = async (settings: any) => {
  const response = await apiClient.put('/admin/settings', settings);
  return response.data;
};
