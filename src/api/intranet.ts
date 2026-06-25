import apiClient from './client';

export const setIntranetCredentials = async (name: string, username: string, password: string) => {
  const response = await apiClient.post(`/myges?name=${encodeURIComponent(name)}`, {
    username,
    password
  });
  return response.data;
};

export const getIntranetCredentials = async () => {
  const response = await apiClient.get('/myges');
  return response.data;
};
