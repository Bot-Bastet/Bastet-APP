import apiClient from './client';

export const sendNavigationGoal = async (x: number, y: number) => {
  const response = await apiClient.post('/api/robot/navigation/goal', { x, y });
  return response.data;
};

export const sendMotionVelocity = async (linear: number, angular: number) => {
  const response = await apiClient.post('/api/robot/motion/velocity', { linear, angular });
  return response.data;
};

export const sendMotionJoints = async (angles: number[]) => {
  const response = await apiClient.post('/api/robot/motion/joints', { angles });
  return response.data;
};

export const sendArduinoCommand = async (
  cmd: string,
  index?: number,
  angle?: number
) => {
  const payload: Record<string, unknown> = { cmd };
  if (index !== undefined) payload.index = index;
  if (angle !== undefined) payload.angle = angle;
  const response = await apiClient.post('/api/robot/arduino/command', payload);
  return response.data;
};

export const sendRobotChat = async (text: string) => {
  const response = await apiClient.post('/api/robot/chat', { text });
  return response.data;
};
