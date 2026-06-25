import apiClient from './client';

export const uploadFaces = async (name: string, uris: string[]) => {
  const results = [];
  for (let i = 0; i < uris.length; i++) {
    const formData = new FormData();
    const file = {
      uri: uris[i],
      name: `face_${i}.jpg`,
      type: 'image/jpeg',
    } as any;
    formData.append('file', file);

    const response = await apiClient.post(`/faces/upload?name=${encodeURIComponent(name)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    results.push(response.data);
  }
  return results;
};
