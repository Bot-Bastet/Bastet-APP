import apiClient from './client';

export const getAllUsers = async () => {
  const response = await apiClient.get('/admin/users');
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
