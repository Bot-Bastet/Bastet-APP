export const theme = {
  colors: {
    // OLED Pure Black foundation
    background: '#000000',
    // Ultra dark surfaces instead of blue-ish grays
    surface: '#0A0A0A',
    surfaceLight: '#141414',
    
    // Accents: Porsche Carmine Red & Electric Cyan
    primary: '#D5001C', 
    secondary: '#00E5FF',
    
    text: '#FFFFFF',
    textMuted: '#888888',
    
    border: '#222222',
    
    // Utility
    success: '#00FF9D',
    danger: '#D5001C',
    warning: '#FFCC00',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: '800' as const,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    },
    h2: {
      fontSize: 24,
      color: '#FFFFFF',
      fontWeight: '700' as const,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
    h3: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600' as const,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
    body: {
      fontSize: 16,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 14,
      color: '#888888',
      letterSpacing: 0.5,
    },
    small: {
      fontSize: 11,
      color: '#888888',
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      fontWeight: '600' as const,
    }
  },
  borderRadius: {
    s: 4,
    m: 8,
    l: 16,
    round: 9999,
  }
};
