import apiClient from './client';
import { UserAccount } from '../types';

/** GET /accounts — Liste tous les comptes enregistrés */
export const getAllUsers = async (): Promise<UserAccount[]> => {
  const response = await apiClient.get('/accounts');
  return response.data;
};

/** DELETE /accounts/{full_name} — Supprime un compte (MyGES et visages inclus) */
export const deleteUser = async (fullName: string) => {
  const response = await apiClient.delete(`/accounts/${encodeURIComponent(fullName)}`);
  return response.data;
};
