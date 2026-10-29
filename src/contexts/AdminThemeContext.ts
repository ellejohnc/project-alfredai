import { createContext, useContext } from 'react';
export type ThemePreset = 'light' | 'blue-dark' | 'black-dark' | 'charcoal' | 'midnight' | 'system';

export interface AdminThemeConfig {
  preset: ThemePreset;
  accentColor: string | null;  // HSL string like "330 81% 60%"
  contrast: number;   // 0.8 - 1.4
  saturation: number;  // 0 - 1.5
  sidebarStyle: 'default' | 'compact' | 'minimal';
}

export const DEFAULT_CONFIG: AdminThemeConfig = {
  preset: 'system',
  accentColor: null,
  contrast: 1.0,
  saturation: 1.0,
  sidebarStyle: 'default',
};

export const THEME_PRESETS: { key: ThemePreset; label: string; description: string; isDark: boolean }[] = [
  { key: 'system', label: 'System', description: 'Follow your OS preference', isDark: false },
  { key: 'light', label: 'Light', description: 'Clean, bright interface', isDark: false },
  { key: 'blue-dark', label: 'Blue Dark', description: 'Current dark theme with blue tones', isDark: true },
  { key: 'black-dark', label: 'Pure Black', description: 'OLED-friendly pure black', isDark: true },
  { key: 'charcoal', label: 'Charcoal', description: 'Warm dark gray tones', isDark: true },
  { key: 'midnight', label: 'Midnight', description: 'Deep navy, low contrast', isDark: true },
];

export const ACCENT_PRESETS = [
  { label: 'Pink (Default)', value: '330 81% 60%' },
  { label: 'Blue', value: '217 91% 60%' },
  { label: 'Green', value: '142 71% 45%' },
  { label: 'Purple', value: '262 83% 58%' },
  { label: 'Orange', value: '25 95% 53%' },
  { label: 'Teal', value: '175 91% 35%' },
  { label: 'Red', value: '0 84% 60%' },
  { label: 'Amber', value: '38 92% 50%' },
];

interface AdminThemeContextType {
  config: AdminThemeConfig;
  updateConfig: (partial: Partial<AdminThemeConfig>) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
  isDark: boolean;
}

export const AdminThemeContext = createContext<AdminThemeContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  resetToDefaults: () => {},
  isLoading: true,
  isDark: false,
});

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
