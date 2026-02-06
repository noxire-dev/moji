// Theme definitions for Moji
// Each theme defines CSS variable values that override the defaults in globals.css

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    // Preview colors for the theme switcher UI
    primary: string;
    accent: string;
    background: string;
  };
  variables: Record<string, string>;
  hasPaperTexture?: boolean;
}

// Default theme - matches the current blue/dark theme in globals.css
export const defaultTheme: Theme = {
  id: "default",
  name: "Default",
  description: "Clean dark theme with blue accents",
  colors: {
    primary: "#3B82F6",
    accent: "#8B5CF6",
    background: "#0C0D0E",
  },
  variables: {
    // These are the default values, so we don't need to override anything
    // The CSS will use the values from globals.css :root
  },
};

// Japanese Pastel theme - soft lavender accents on dark background
export const japanesePastelTheme: Theme = {
  id: "japanese-pastel",
  name: "Japanese Pastel",
  description: "Soft lavender and sakura tones with paper texture",
  colors: {
    primary: "#CDB4DB",
    accent: "#FFB7C5",
    background: "#0F0F0F",
  },
  hasPaperTexture: true,
  variables: {
    // Background - soft black (not pure black)
    "--background": "0 0% 6%",
    "--foreground": "0 0% 96%",

    // Cards/surfaces - slightly lighter with warm tint
    "--card": "0 0% 8%",
    "--card-foreground": "0 0% 96%",
    "--popover": "0 0% 9%",
    "--popover-foreground": "0 0% 96%",

    // Primary - soft lavender #CDB4DB
    "--primary": "300 26% 78%",
    "--primary-foreground": "0 0% 10%",

    // Secondary/muted - warm grays
    "--secondary": "300 5% 12%",
    "--secondary-foreground": "0 0% 96%",
    "--muted": "300 5% 14%",
    "--muted-foreground": "0 0% 55%",

    // Accent - subtle lavender tint
    "--accent": "300 10% 16%",
    "--accent-foreground": "0 0% 96%",

    // Destructive - softer sakura pink instead of harsh red
    "--destructive": "350 60% 70%",
    "--destructive-foreground": "0 0% 10%",

    // Borders - subtle with slight warmth
    "--border": "300 5% 16%",
    "--input": "300 5% 14%",
    "--ring": "300 26% 78%",

    // Priority colors - Japanese pastel palette
    "--priority-none": "0 0% 45%",
    "--priority-low": "140 30% 70%",      // Matcha green #B7D3B8
    "--priority-medium": "35 80% 75%",     // Yuzu peach #FFD8A8
    "--priority-high": "350 60% 82%",      // Sakura pink #F4C2D1

    // Gradient - lavender to sakura
    "--gradient-start": "300 26% 78%",
    "--gradient-end": "350 60% 82%",
  },
};

// Kanagawa theme - deep indigo with warm highlights
export const kanagawaTheme: Theme = {
  id: "kanagawa",
  name: "Kanagawa",
  description: "Deep indigo with warm sand accents",
  colors: {
    primary: "#C8B089",
    accent: "#7AA89F",
    background: "#0F0F13",
  },
  variables: {
    "--background": "240 12% 6%",
    "--foreground": "40 20% 92%",
    "--card": "240 12% 8%",
    "--card-foreground": "40 20% 92%",
    "--popover": "240 12% 9%",
    "--popover-foreground": "40 20% 92%",

    "--primary": "38 30% 66%",
    "--primary-foreground": "240 12% 10%",

    "--secondary": "240 10% 12%",
    "--secondary-foreground": "40 20% 92%",
    "--muted": "240 10% 14%",
    "--muted-foreground": "35 10% 55%",

    "--accent": "170 20% 46%",
    "--accent-foreground": "40 20% 92%",

    "--destructive": "0 55% 56%",
    "--destructive-foreground": "0 0% 100%",

    "--border": "240 10% 16%",
    "--input": "240 10% 14%",
    "--ring": "38 30% 66%",

    "--priority-none": "35 10% 50%",
    "--priority-low": "140 20% 55%",
    "--priority-medium": "38 45% 62%",
    "--priority-high": "0 55% 60%",

    "--gradient-start": "38 30% 66%",
    "--gradient-end": "170 20% 46%",
  },
};

// All available themes
export const themes: Theme[] = [defaultTheme, japanesePastelTheme, kanagawaTheme];

// Get theme by ID
export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || defaultTheme;
}

// Apply theme variables to document root
export function applyTheme(theme: Theme): void {
  // Only run on client side
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // First, remove any previously applied theme variables
  // by resetting to empty (CSS will fall back to :root defaults)
  for (const t of themes) {
    for (const key of Object.keys(t.variables)) {
      root.style.removeProperty(key);
    }
  }

  // Apply the new theme's variables
  for (const [key, value] of Object.entries(theme.variables)) {
    root.style.setProperty(key, value);
  }

  // Texture toggle is handled separately via applyTexturePreference
}

// Storage key for persisting theme choice
export const THEME_STORAGE_KEY = "moji_theme";

export const TEXTURE_STORAGE_KEY = "moji_texture";
export const TEXTURE_INTENSITY_STORAGE_KEY = "moji_texture_intensity";

export const DEFAULT_TEXTURE_INTENSITY = 0.12;

export function applyTexturePreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const body = document.body || document.querySelector("body");
  requestAnimationFrame(() => {
    if (enabled) {
      root.classList.add("theme-paper-texture");
      body?.classList.add("theme-paper-texture");
    } else {
      root.classList.remove("theme-paper-texture");
      body?.classList.remove("theme-paper-texture");
    }
  });
}

export function applyTextureIntensity(intensity: number): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const clamped = Math.min(Math.max(intensity, 0), 0.6);
  root.style.setProperty("--texture-opacity", clamped.toString());
}
