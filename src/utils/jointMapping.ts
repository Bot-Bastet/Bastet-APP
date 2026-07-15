/**
 * Joint index mapping for SpotMicro 12-DOF telemetry (DocsGateway — telemetry_diagnostics).
 * Order matches the HUD in spotmicro_3d viewer: FL → FR → RL → RR, each shoulder/thigh/calf.
 */
export const JOINT_KEYS = [
  'fl_s', 'fl_t', 'fl_c',
  'fr_s', 'fr_t', 'fr_c',
  'rl_s', 'rl_t', 'rl_c',
  'rr_s', 'rr_t', 'rr_c',
] as const;

export const JOINT_LABELS = [
  'FL Coxa', 'FL Thigh', 'FL Calf',
  'FR Coxa', 'FR Thigh', 'FR Calf',
  'RL Coxa', 'RL Thigh', 'RL Calf',
  'RR Coxa', 'RR Thigh', 'RR Calf',
] as const;

export const JOINT_COUNT = 12;

export function isValidJointTelemetry(joints?: number[] | null): joints is number[] {
  return Array.isArray(joints) && joints.length === JOINT_COUNT;
}
