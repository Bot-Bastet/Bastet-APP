import apiClient from './client';

export const login = async (email: string, password?: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const data = response.data;
  return { token: data.user.pseudo || data.user.email, user: data.user };
};

export const register = async (email: string, pseudo: string, firstName: string, lastName: string, phone: string, password?: string) => {
  const payload = {
    email,
    pseudo,
    last_name: lastName,
    first_name: firstName,
    phone: phone,
    password,
    is_admin: false
  };
  const response = await apiClient.post('/accounts', payload);
  return response.data;
};

export const updatePreferences = async (fullName: string, preferences: any) => {
  const response = await apiClient.post('/preferences', { full_name: fullName, preferences });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const updateUserProfile = async (profileData: any) => {
  const response = await apiClient.put('/users/me', profileData);
  return response.data;
};
