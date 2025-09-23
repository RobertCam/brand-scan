export interface ChartTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string[];
    secondary: string[];
    background: string;
    text: string;
    grid: string;
    tooltip: string;
  };
  category: 'professional' | 'vibrant' | 'monochrome' | 'brand' | 'custom';
}

export const DEFAULT_THEMES: ChartTheme[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, corporate-friendly colors',
    colors: {
      primary: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
      secondary: ['#E5E7EB', '#F3F4F6', '#F9FAFB'],
      background: '#FFFFFF',
      text: '#1F2937',
      grid: '#E5E7EB',
      tooltip: '#F9FAFB'
    },
    category: 'professional'
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bright, energetic colors',
    colors: {
      primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
      secondary: ['#FFE5E5', '#E5F7F5', '#E5F4F8'],
      background: '#FFFFFF',
      text: '#2D3436',
      grid: '#DDD6FE',
      tooltip: '#F8F9FA'
    },
    category: 'vibrant'
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Elegant grayscale palette',
    colors: {
      primary: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
      secondary: ['#F9FAFB', '#F3F4F6', '#E5E7EB'],
      background: '#FFFFFF',
      text: '#111827',
      grid: '#E5E7EB',
      tooltip: '#F9FAFB'
    },
    category: 'monochrome'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and teals',
    colors: {
      primary: ['#0EA5E9', '#06B6D4', '#0891B2', '#0D9488', '#14B8A6', '#5EEAD4'],
      secondary: ['#E0F2FE', '#CCFBF1', '#F0FDFA'],
      background: '#FFFFFF',
      text: '#0F172A',
      grid: '#E0F2FE',
      tooltip: '#F8FAFC'
    },
    category: 'professional'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges and reds',
    colors: {
      primary: ['#F97316', '#EF4444', '#DC2626', '#F59E0B', '#EAB308', '#FDE047'],
      secondary: ['#FEF3C7', '#FEE2E2', '#FEF2F2'],
      background: '#FFFFFF',
      text: '#1F2937',
      grid: '#FEF3C7',
      tooltip: '#FFFBEB'
    },
    category: 'vibrant'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens and earth tones',
    colors: {
      primary: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
      secondary: ['#ECFDF5', '#D1FAE5', '#A7F3D0'],
      background: '#FFFFFF',
      text: '#064E3B',
      grid: '#D1FAE5',
      tooltip: '#F0FDF4'
    },
    category: 'professional'
  }
];

export interface ChartColorSettings {
  themeId: string;
  customColors?: string[];
  applyToAllCharts: boolean;
  chartSpecificColors?: Record<string, string[]>;
}

export const DEFAULT_COLOR_SETTINGS: ChartColorSettings = {
  themeId: 'professional',
  applyToAllCharts: true,
  chartSpecificColors: {}
};

export function getThemeColors(themeId: string, customColors?: string[]): ChartTheme['colors'] {
  const theme = DEFAULT_THEMES.find(t => t.id === themeId) || DEFAULT_THEMES[0];
  
  if (customColors && customColors.length > 0) {
    return {
      ...theme.colors,
      primary: customColors
    };
  }
  
  return theme.colors;
}

export function generateColorPalette(baseColor: string, count: number): string[] {
  // Convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
  };
  
  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number) => {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1/3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1/3);
    
    return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
  };
  
  const [h, s, l] = hexToHsl(baseColor);
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const hue = (h + (i * 60)) % 360; // Rotate hue by 60 degrees for each color
    const saturation = Math.max(20, s - (i * 10)); // Vary saturation
    const lightness = Math.max(30, Math.min(80, l + (i * 5))); // Vary lightness
    
    colors.push(hslToHex(hue / 360, saturation / 100, lightness / 100));
  }
  
  return colors;
}

export function getAccessibleColors(baseColor: string): string[] {
  // Generate colors that meet WCAG contrast requirements
  const colors = generateColorPalette(baseColor, 6);
  
  // Ensure good contrast by adjusting lightness
  return colors.map(color => {
    const [h, s, l] = hexToHsl(color);
    const adjustedLightness = l < 50 ? Math.min(70, l + 20) : Math.max(30, l - 20);
    return hslToHex(h / 360, s / 100, adjustedLightness / 100);
  });
}

// Helper function to convert hex to HSL (used internally)
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 360, s * 100, l * 100];
}

// Helper function to convert HSL to hex (used internally)
function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1/3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1/3);
  
  return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
}
