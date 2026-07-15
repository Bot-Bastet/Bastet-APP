import React, { createContext, useState, useContext, ReactNode } from 'react';
import { QuadrupedBot } from '../data/mockData';

const SINGLE_BOT: QuadrupedBot = {
  id: 'BST-01',
  name: 'BASTET',
  status: 'En ligne',
  battery: 100,
  speed: 0,
  latitude: 48.8566,
  longitude: 2.3522,
  colorTheme: '#D5001C',
};

interface BotContextType {
  bot: QuadrupedBot;
}

export const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider = ({ children }: { children: ReactNode }) => {
  const [bot] = useState<QuadrupedBot>(SINGLE_BOT);

  return (
    <BotContext.Provider value={{ bot }}>
      {children}
    </BotContext.Provider>
  );
};

export const useBots = () => {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBots must be used within a BotProvider');
  }
  return context;
};
