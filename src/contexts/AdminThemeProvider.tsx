import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminThemeContext, type AdminThemeConfig, DEFAULT_CONFIG, type ThemePreset } from './AdminThemeContext';

function getEffectiveDark(preset: ThemePreset): boolean {
  if (preset === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return preset !== 'light';
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAdminAuth();
  const [config, setConfig] = useState<AdminThemeConfig>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('admin-theme-cache') || 'null');
      if (cached && cached.preset) {
        return { ...DEFAULT_CONFIG, preset: cached.preset, accentColor: cached.accentColor ?? null };
      }
    } catch {
      // Cached theme unreadable — the default is a fine starting point.
    }
    return DEFAULT_CONFIG;
  });
  const [isLoading, setIsLoading] = useState(true);
  const isDark = getEffectiveDark(config.preset);

  // Load from DB
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data } = await supabase
          .from('admin_theme_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setConfig({
            preset: (data.theme_preset as ThemePreset) || 'system',
            accentColor: data.accent_color || null,
            contrast: Number(data.contrast) || 1.0,
            saturation: Number(data.saturation) || 1.0,
            sidebarStyle: (data.sidebar_style as any) || 'default',
          });
        }
      } catch (err) {
        console.warn('Failed to load theme preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.id]);

  // Apply theme CSS variables to admin context
  useEffect(() => {
    const root = document.documentElement;
    try {
      localStorage.setItem('admin-theme-cache', JSON.stringify({
        preset: config.preset,
        isDark,
        accentColor: config.accentColor,
      }));
    } catch {
      // Theme cache is an optimisation for the next load, not state we need.
    }

    // Apply dark class

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply theme preset class
    root.removeAttribute('data-admin-theme');
    if (config.preset !== 'system' && config.preset !== 'light' && config.preset !== 'blue-dark') {
      root.setAttribute('data-admin-theme', config.preset);
    }

    // Apply custom accent
    if (config.accentColor) {
      root.style.setProperty('--primary', config.accentColor);
      root.style.setProperty('--ring', config.accentColor);
      root.style.setProperty('--sidebar-primary', config.accentColor);
      root.style.setProperty('--sidebar-ring', config.accentColor);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
    }

    // Apply contrast via filter
    root.style.setProperty('--admin-contrast', String(config.contrast));
    root.style.setProperty('--admin-saturation', String(config.saturation));

    return () => {
      root.removeAttribute('data-admin-theme');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--admin-contrast');
      root.style.removeProperty('--admin-saturation');
    };
  }, [config, isDark]);

  const updateConfig = useCallback(async (partial: Partial<AdminThemeConfig>) => {
    const newConfig = { ...config, ...partial };
    setConfig(newConfig);

    if (!user?.id) return;

    try {
      const payload = {
        user_id: user.id,
        theme_preset: newConfig.preset,
        accent_color: newConfig.accentColor,
        contrast: newConfig.contrast,
        saturation: newConfig.saturation,
        sidebar_style: newConfig.sidebarStyle,
      };

      await supabase
        .from('admin_theme_preferences')
        .upsert(payload, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Failed to save theme preferences:', err);
    }
  }, [config, user?.id]);

  const resetToDefaults = useCallback(() => {
    updateConfig(DEFAULT_CONFIG);
  }, [updateConfig]);

  return (
    <AdminThemeContext.Provider value={{ config, updateConfig, resetToDefaults, isLoading, isDark }}>
      {children}
    </AdminThemeContext.Provider>
  );
}
