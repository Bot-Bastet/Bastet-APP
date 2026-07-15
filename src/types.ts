// ═══════════════════════════════════════════════════════════════
// Types centraux — Bastet CORE Gateway
// Couvre TOUTE la documentation DocsGateway.md
// ═══════════════════════════════════════════════════════════════

// ─── Section 6 : CORE State ───────────────────────────────────

export interface SystemInfo {
  cpu_temp: number;
  cpu_load_1m: number;
  ram_total_mb: number;
  ram_used_mb: number;
  ram_percent: number;
}

export interface SensorData {
  cpu_percent: number;
  ram_percent: number;
  temp_c: number;
  spotbot_service_active: boolean;
  spotbot_service: 'active' | 'inactive';
  cam1_connected: boolean;
  cam2_connected: boolean;
  arduino_connected: boolean;
  system: SystemInfo;
}

export interface AIState {
  tts: 'robot' | 'node' | 'disabled';
  stt: 'robot' | 'node' | 'disabled';
  chat: 'robot' | 'node' | 'disabled';
  yolo: 'enabled' | 'disabled';
  face_rec: 'enabled' | 'disabled';
}

export type RobotStatus = 'online' | 'hibernating' | 'offline';

export interface ActiveStreams {
  '1': boolean;
  '2': boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CoreState {
  seen_person: string | null;
  seen_objects: string[];
  last_chat: ChatMessage[];
  robot_status: RobotStatus;
  active_streams: ActiveStreams;
  robot_version: string;
  arduino_version: string;
  sensors: SensorData;
  ai_state: AIState;
}

// ─── Section 1 : WebSocket Telemetry ──────────────────────────

export interface JointAngle {
  index: number;  // 0-11
  angle: number;
}

export interface IMUData {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface ROSTopic {
  name: string;
  type: string;
  hz: number;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
}

export interface TelemetryDiagnostics {
  joints: number[];           // 12 angles (index 0-11)
  imu: IMUData;
  topics: ROSTopic[];
  pose: Pose;
  path: Pose[];
  ai_state: AIState;
}

// ─── WebSocket : WiFi ─────────────────────────────────────────

export interface WifiNetwork {
  ssid: string;
  signal: number;        // dBm or percentage
  security: string;      // WPA2, Open, etc.
}

// ─── WebSocket : Camera Setup ─────────────────────────────────

export interface CameraSetupPayload {
  camera: 1 | 2;
  enable: boolean;
}

// ─── Section 4 : Faces ────────────────────────────────────────

export interface FaceEntry {
  face_id: string;
  name: string;
  image_count?: number;
}

// ─── Section 7 : System Updates ───────────────────────────────

export type UpdateStatus = 'idle' | 'downloading' | 'extracting' | 'done' | 'failed';

export interface UpdateProgress {
  status: UpdateStatus;
  percent: number;
  version?: string;
  latest_version?: string;
}

// ─── Section 2 : Auth / Accounts ──────────────────────────────

export interface UserAccount {
  email: string;
  pseudo: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_admin: boolean;
  preferences?: Record<string, any>;
}

// ─── WebSocket : Outbound messages ────────────────────────────

export interface CmdVelMessage {
  type: 'cmd_vel';
  linear: number;
  angular: number;
}

export interface RequestCameraMessage {
  type: 'request_camera';
  camera: 1 | 2;
  v_slam?: boolean;
}

export interface ReleaseCameraMessage {
  type: 'release_camera';
  camera: 1 | 2;
}

export interface StopCameraMessage {
  type: 'stop_camera';
  camera: 1 | 2;
}

export interface NavGoalMessage {
  type: 'nav_goal';
  x: number;
  y: number;
}

export type ArduinoCmdType = 'stand' | 'sit' | 'attach' | 'detach' | 'write' | 'reset_imu';

export interface ArduinoCmdMessage {
  type: 'arduino_cmd';
  cmd: ArduinoCmdType;
  index?: number;
  angle?: number;
}

export interface ManualJointControlMessage {
  type: 'manual_joint_control';
  angles: number[];
}

export interface MonoCalibMessage {
  type: 'run_mono_calib';
  camera: 1 | 2;
  chessboard_cols: number;
  chessboard_rows: number;
  square_size_mm: number;
  timeout_seconds?: number;
}

export interface StereoCalibMessage {
  type: 'run_stereo_calib';
  chessboard_cols: number;
  chessboard_rows: number;
  square_size_mm: number;
  timeout_seconds?: number;
}

// ─── WebSocket : Inbound calibration ──────────────────────────

export interface MonoCalibFrame {
  type: 'mono_calib_frame';
  camera: number;
  image: string;
}

export interface MonoCalibProgress {
  type: 'mono_calib_progress';
  camera: number;
  message: string;
  progress: number;
}

export interface MonoCalibResult {
  type: 'mono_calib_result';
  camera: number;
  success: boolean;
  message: string;
  fx?: number;
  reprojection_error?: number;
}

export interface StereoCalibFrame {
  type: 'stereo_calib_frame';
  image: string;
}

export interface StereoCalibProgress {
  type: 'stereo_calib_progress';
  message: string;
  progress: number;
}

export interface StereoCalibResult {
  type: 'stereo_calib_result';
  success: boolean;
  message: string;
  reprojection_error?: number;
}

export interface CalibrationState {
  active: boolean;
  mode: 'mono' | 'stereo' | null;
  camera: number | null;
  progress: number;
  message: string;
  lastResult: MonoCalibResult | StereoCalibResult | null;
  lastFrame: string | null;
}

// ─── REST : Cameras & Streams ─────────────────────────────────

export interface CameraManifestEntry {
  id: number;
  name?: string;
  connected?: boolean;
}

export interface StreamState {
  camera: number;
  active: boolean;
  viewers?: number;
  keep_alive?: boolean;
}

export interface StreamConfig {
  resolution: string;
  framerate: number;
  bitrate: string;
}

// ─── REST : Calibration & Diagnostics ─────────────────────────

export interface ServoCalibration {
  offsets: number[];
}

export interface CameraIntrinsicCalibration {
  [key: string]: unknown;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | string;
}

export interface MyGesTestResult {
  valid: boolean;
  preview?: string;
  message?: string;
}

export interface RollbackRequest {
  version: string;
}

