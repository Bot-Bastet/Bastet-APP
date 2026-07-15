import apiClient from './client';

export interface MonoCalibrationParams {
  camera: number;
  chessboard_cols: number;
  chessboard_rows: number;
  square_size_mm: number;
  timeout_seconds?: number;
}

export interface StereoCalibrationParams {
  chessboard_cols: number;
  chessboard_rows: number;
  square_size_mm: number;
  timeout_seconds?: number;
}

export const runMonoCalibration = async (params: MonoCalibrationParams) => {
  const response = await apiClient.post('/api/calibration/camera/run/mono', params);
  return response.data;
};

export const runStereoCalibration = async (params: StereoCalibrationParams) => {
  const response = await apiClient.post('/api/calibration/camera/run/stereo', params);
  return response.data;
};

export const abortCalibration = async () => {
  const response = await apiClient.post('/api/calibration/camera/abort');
  return response.data;
};
