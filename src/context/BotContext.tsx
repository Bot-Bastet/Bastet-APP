import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { mockBots as initialBots, QuadrupedBot, BotStatus } from '../data/mockData';

interface BotContextType {
  bots: QuadrupedBot[];
  addBot: () => void;
  updateBotStatus: (id: string, status: BotStatus) => void;
  updateBotProperty: (id: string, property: keyof QuadrupedBot, value: any) => void;
}

export const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider = ({ children }: { children: ReactNode }) => {
  const [bots, setBots] = useState<QuadrupedBot[]>(initialBots);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBots(prevBots => prevBots.map(bot => {
        let newBot = { ...bot };

        // Drain battery slowly if not charging
        if (newBot.status !== 'En charge' && newBot.status !== 'Hors ligne') {
          newBot.battery = Math.max(0, parseFloat((newBot.battery - 0.1).toFixed(1)));
        }

        // Recharge
        if (newBot.status === 'En charge') {
          newBot.battery = Math.min(100, newBot.battery + 1);
        }

        // Move if on patrol
        if (newBot.status === 'En patrouille') {
          newBot.speed = 15;
          // Random walk simulation
          newBot.latitude += (Math.random() - 0.5) * 0.0005;
          newBot.longitude += (Math.random() - 0.5) * 0.0005;
        } else {
          newBot.speed = 0;
        }

        return newBot;
      }));
    }, 2000); // update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const addBot = () => {
    const newId = `QBT-00${bots.length + 1}`;
    const colors = ['#00FF9D', '#FFCC00', '#00E5FF', '#FF3366', '#A0A0A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newBot: QuadrupedBot = {
      id: newId,
      name: `Nouvelle Unité ${bots.length + 1}`,
      status: 'En ligne',
      battery: 100,
      speed: 0,
      latitude: 48.8500 + (Math.random() - 0.5) * 0.02,
      longitude: 2.3500 + (Math.random() - 0.5) * 0.02,
      colorTheme: randomColor,
    };
    setBots(prev => [...prev, newBot]);
  };

  const updateBotStatus = (id: string, status: BotStatus) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateBotProperty = (id: string, property: keyof QuadrupedBot, value: any) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, [property]: value } : b));
  };

  return (
    <BotContext.Provider value={{ bots, addBot, updateBotStatus, updateBotProperty }}>
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
