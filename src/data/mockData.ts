export type BotStatus = 'En ligne' | 'Hors ligne' | 'En patrouille' | 'En charge' | 'En garde';

export interface QuadrupedBot {
  id: string;
  name: string;
  status: BotStatus;
  battery: number;
  speed: number;
  latitude: number;
  longitude: number;
  colorTheme: string;
}
