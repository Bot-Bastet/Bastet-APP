import apiClient from './client';
import { FaceEntry } from '../types';

/**
 * GET /faces — Lister tous les visages enregistrés
 */
export const getFaces = async (): Promise<FaceEntry[]> => {
  const response = await apiClient.get('/faces');
  const data = response.data;
  // L'API peut retourner un objet wrapper { faces: [...] } ou directement un tableau
  if (Array.isArray(data)) return data;
  if (data?.faces && Array.isArray(data.faces)) return data.faces;
  // Fallback: essayer de trouver la première propriété qui est un tableau
  for (const key of Object.keys(data || {})) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
};

/**
 * GET /faces/{face_id}/image — Récupérer l'image d'un visage
 * Retourne l'URL complète pour affichage
 */
export const getFaceImageUrl = (faceId: string, baseUrl: string): string => {
  return `${baseUrl}/faces/${faceId}/image`;
};

/**
 * DELETE /faces/{face_id} — Supprimer un visage
 */
export const deleteFace = async (faceId: string): Promise<any> => {
  const response = await apiClient.delete(`/faces/${faceId}`);
  return response.data;
};

/**
 * POST /faces/upload — Upload de photos (Multipart). Limité à 8 photos par personne.
 */
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
