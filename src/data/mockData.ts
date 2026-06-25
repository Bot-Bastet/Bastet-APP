export type BotStatus = 'En ligne' | 'Hors ligne' | 'En patrouille' | 'En charge' | 'En garde';

export interface QuadrupedBot {
  id: string;
  name: string;
  status: BotStatus;
  battery: number;
  speed: number; // in km/h
  latitude: number;
  longitude: number;
  colorTheme: string; // Used for UI accents representing the 3D render mock
}

export const mockBots: QuadrupedBot[] = [
  {
    id: 'QBT-001',
    name: 'Titan Alpha',
    status: 'En patrouille',
    battery: 78,
    speed: 12,
    latitude: 48.8566,
    longitude: 2.3522, // Paris
    colorTheme: '#00FF9D',
  },
  {
    id: 'QBT-002',
    name: 'Cerberus',
    status: 'En charge',
    battery: 15,
    speed: 0,
    latitude: 48.8600,
    longitude: 2.3600,
    colorTheme: '#FFCC00',
  },
  {
    id: 'QBT-003',
    name: 'Shadow Scout',
    status: 'En garde',
    battery: 95,
    speed: 0,
    latitude: 48.8500,
    longitude: 2.3400,
    colorTheme: '#00E5FF',
  },
  {
    id: 'QBT-004',
    name: 'Hound Delta',
    status: 'Hors ligne',
    battery: 0,
    speed: 0,
    latitude: 48.8450,
    longitude: 2.3450,
    colorTheme: '#A0A0A0',
  }
];

export const mockChatResponses = [
  "Je suis en position. Prêt pour vos commandes.",
  "La trajectoire a été calculée avec succès.",
  "Niveau de batterie faible. Retour à la station de charge recommandé.",
  "Scan de la zone terminé, aucune anomalie détectée.",
  "Le robot Titan a atteint sa zone de patrouille."
];
