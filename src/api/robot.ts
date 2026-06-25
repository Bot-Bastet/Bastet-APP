import apiClient from './client';

export const sendRobotCommand = async (action: string, direction?: string, speed?: number) => {
  const payload: any = { action };
  if (direction) payload.direction = direction;
  if (speed !== undefined) payload.speed = speed;

  const response = await apiClient.post('/robot/command', payload);
  return response.data;
};
