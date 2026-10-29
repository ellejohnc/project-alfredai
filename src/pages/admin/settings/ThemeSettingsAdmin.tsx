import { useAdminTheme, THEME_PRESETS, ACCENT_PRESETS, ThemePreset } from '@/contexts/AdminThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Palette, RotateCcw, Monitor, Sun, Moon, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ThemeSettingsAdmin() {
  const { config, updateConfig, resetToDefaults } = useAdminTheme();

  const handleReset = () => {
    resetToDefaults();
    toast.success('Theme reset to defaults');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Theme Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the admin panel appearance. Changes save automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="min-h-[44px]">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Color Scheme</CardTitle>
          <CardDescription>Choose a base theme for the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEME_PRESETS.map((preset) => {
              const isActive = config.preset === preset.key;
              const Icon = preset.key === 'system' ? Monitor : preset.isDark ? Moon : Sun;

              return (
                <button
                  key={preset.key}
                  onClick={() => updateConfig({ preset: preset.key })}
                  className={cn(
                    "relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left min-h-[44px]",
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  {/* Preview swatch */}
                  <div className="flex items-center gap-2">
                    <ThemeSwatch preset={preset.key} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{preset.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{preset.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accent Color</CardTitle>
          <CardDescription>Change the primary accent throughout the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateConfig({ accentColor: null })}
              className={cn(
                "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all min-w-[44px] min-h-[44px]",
                !config.accentColor
                  ? "border-foreground scale-110 shadow-md"
                  : "border-border hover:scale-105"
              )}
              title="Default"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-pink-500" />
            </button>
            {ACCENT_PRESETS.map((accent) => {
              const isActive = config.accentColor === accent.value;
              return (
                <button
                  key={accent.value}
                  onClick={() => updateConfig({ accentColor: accent.value })}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all min-w-[44px] min-h-[44px]",
                    isActive
                      ? "border-foreground scale-110 shadow-md"
                      : "border-border hover:scale-105"
                  )}
                  title={accent.label}
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: `hsl(${accent.value})` }}
                  />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contrast & Saturation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fine Tuning</CardTitle>
          <CardDescription>Adjust contrast and color saturation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Contrast</Label>
              <Badge variant="outline" className="text-xs tabular-nums">
                {Math.round(config.contrast * 100)}%
              </Badge>
            </div>
            <Slider
              value={[config.contrast]}
              onValueChange={([v]) => updateConfig({ contrast: v })}
              min={0.7}
              max={1.4}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Low</span>
              <span>Default</span>
              <span>High</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Saturation</Label>
              <Badge variant="outline" className="text-xs tabular-nums">
                {Math.round(config.saturation * 100)}%
              </Badge>
            </div>
            <Slider
              value={[config.saturation]}
              onValueChange={([v]) => updateConfig({ saturation: v })}
              min={0}
              max={1.5}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Grayscale</span>
              <span>Default</span>
              <span>Vivid</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live preview indicator */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        Changes apply in real-time and save automatically to your account.
      </div>
    </div>
  );
}

function ThemeSwatch({ preset }: { preset: ThemePreset }) {
  const swatchColors: Record<ThemePreset, { bg: string; fg: string; accent: string }> = {
    system: { bg: '#f1f5f9', fg: '#0f172a', accent: '#EC4899' },
    light: { bg: '#fafafa', fg: '#0f172a', accent: '#EC4899' },
    'blue-dark': { bg: '#1e293b', fg: '#f8fafc', accent: '#EC4899' },
    'black-dark': { bg: '#000000', fg: '#f8fafc', accent: '#EC4899' },
    charcoal: { bg: '#1c1c1e', fg: '#e5e5ea', accent: '#EC4899' },
    midnight: { bg: '#0a0e27', fg: '#c8d6e5', accent: '#EC4899' },
  };
  const c = swatchColors[preset];

  return (
    <div className="w-8 h-6 rounded border border-border/50 overflow-hidden flex" style={{ backgroundColor: c.bg }}>
      <div className="w-1.5 h-full" style={{ backgroundColor: c.accent }} />
      <div className="flex-1 flex flex-col justify-center gap-0.5 px-1">
        <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: c.fg, opacity: 0.6 }} />
        <div className="h-0.5 w-3/4 rounded-full" style={{ backgroundColor: c.fg, opacity: 0.3 }} />
      </div>
    </div>
  );
}
