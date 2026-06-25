export const theme = {
  colors: {
    background: '#050505', // Deep black
    surface: '#121212',
    surfaceLight: '#1E1E1E',
    primary: '#00FF9D', // Neon Green
    secondary: '#00E5FF', // Electric Blue
    text: '#FFFFFF',
    textMuted: '#A0A0A0',
    danger: '#FF3366',
    warning: '#FFCC00',
    success: '#00FF9D',
    border: '#2A2A2A',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, color: '#FFFFFF' },
    h2: { fontSize: 24, fontWeight: '700' as const, color: '#FFFFFF' },
    h3: { fontSize: 20, fontWeight: '600' as const, color: '#FFFFFF' },
    body: { fontSize: 16, fontWeight: '400' as const, color: '#FFFFFF' },
    caption: { fontSize: 14, fontWeight: '400' as const, color: '#A0A0A0' },
    small: { fontSize: 12, fontWeight: '500' as const, color: '#A0A0A0' },
  }
};
