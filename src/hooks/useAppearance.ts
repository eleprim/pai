import { useState, useEffect } from 'react';

export type FontStyle = 'sans' | 'mono' | 'display';
export type Density = 'compact' | 'comfortable';

interface AppearanceSettings {
  font: FontStyle;
  primaryColor: string;
  density: Density;
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  font: 'sans',
  primaryColor: '#6366f1', // Indigo 500
  density: 'comfortable',
};

export function useAppearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    const saved = localStorage.getItem('redbill-appearance');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('redbill-appearance', JSON.stringify(settings));
    
    // Apply font to body
    const root = document.documentElement;
    if (settings.font === 'mono') {
      root.style.setProperty('--font-primary', '"JetBrains Mono", monospace');
    } else if (settings.font === 'display') {
      root.style.setProperty('--font-primary', '"Space Grotesk", sans-serif');
    } else {
      root.style.setProperty('--font-primary', '"Inter", sans-serif');
    }

    // Apply primary color
    root.style.setProperty('--color-primary', settings.primaryColor);
    
    // Apply density
    if (settings.density === 'compact') {
      root.classList.add('compact-ui');
    } else {
      root.classList.remove('compact-ui');
    }
  }, [settings]);

  return { settings, setSettings };
}
