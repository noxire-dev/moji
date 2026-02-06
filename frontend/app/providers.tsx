"use client";

import { AuthUser, supabase } from "@/lib/supabase";
import {
  applyTextureIntensity,
  applyTexturePreference,
  applyTheme,
  DEFAULT_TEXTURE_INTENSITY,
  defaultTheme,
  getThemeById,
  TEXTURE_INTENSITY_STORAGE_KEY,
  TEXTURE_STORAGE_KEY,
  Theme,
  THEME_STORAGE_KEY,
  themes,
} from "@/lib/themes";
import { Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

// ============================================================================
// Auth Context
// ============================================================================

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isDemo: false,
  signOut: async () => {},
});

// ============================================================================
// Theme Context
// ============================================================================

interface ThemeContextType {
  theme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => void;
  textureEnabled: boolean;
  setTexture: (enabled: boolean) => void;
  textureIntensity: number;
  setTextureIntensity: (intensity: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  themes: themes,
  setTheme: () => {},
  textureEnabled: false,
  setTexture: () => {},
  textureIntensity: DEFAULT_TEXTURE_INTENSITY,
  setTextureIntensity: () => {},
});

// ============================================================================
// Navigation Loading Context
// ============================================================================

interface NavigationLoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

// Demo user for UI preview
const DEMO_USER: AuthUser = {
  id: "demo-user-id",
  email: "demo@usemoji.app",
  user_metadata: { username: "demo" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as typeof window & { __mojiFetchPatched?: boolean };
      if (!win.__mojiFetchPatched) {
        win.__mojiFetchPatched = true;
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
          const requestUrl = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
          if (requestUrl.startsWith("http://moji-production-8243.up.railway.app")) {
            const upgradedUrl = requestUrl.replace(/^http:\/\//, "https://");
            console.warn("Moji fetch upgraded to HTTPS:", requestUrl, upgradedUrl, new Error().stack);
            if (typeof input === "string") {
              input = upgradedUrl;
            } else if (input instanceof Request) {
              input = new Request(upgradedUrl, input);
            }
          }
          return originalFetch(input, init);
        };
      }
    }

    const demoFromUrl = typeof window !== "undefined" && (() => {
      const { pathname, search } = window.location;
      if (pathname.startsWith("/workspaces/demo-")) {
        return true;
      }
      const params = new URLSearchParams(search);
      const demoParam = params.get("demo");
      return demoParam === "true" || demoParam === "1";
    })();

    console.log("[AuthProvider] demoFromUrl", demoFromUrl, typeof window !== "undefined" ? window.location.pathname : "");

    if (demoFromUrl) {
      localStorage.setItem("moji_demo_mode", "true");
      setIsDemo(true);
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // Check for demo mode
    const demoMode = localStorage.getItem("moji_demo_mode") === "true";
    console.log("[AuthProvider] demoMode from localStorage", demoMode);
    if (demoMode) {
      setIsDemo(true);
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("moji_demo_mode");
    setIsDemo(false);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
    // Force full page reload to clear all state and redirect to login
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Hook to get access token for API calls
export function useAccessToken(): string | null {
  const { session, isDemo } = useAuth();
  if (isDemo) return null; // Demo mode doesn't need auth
  return session?.access_token ?? null;
}

// ============================================================================
// Theme Provider
// ============================================================================

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);
  const [textureEnabled, setTextureEnabled] = useState(false);
  const [textureIntensity, setTextureIntensity] = useState(DEFAULT_TEXTURE_INTENSITY);

  // Load theme from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    const savedTexture = localStorage.getItem(TEXTURE_STORAGE_KEY);
    const savedTextureIntensity = localStorage.getItem(TEXTURE_INTENSITY_STORAGE_KEY);
    const texturePref = savedTexture === "true";
    const parsedIntensity = savedTextureIntensity ? Number.parseFloat(savedTextureIntensity) : DEFAULT_TEXTURE_INTENSITY;
    const intensityPref = Number.isFinite(parsedIntensity) ? parsedIntensity : DEFAULT_TEXTURE_INTENSITY;
    setTextureEnabled(texturePref);
    setTextureIntensity(intensityPref);
    if (savedThemeId) {
      const theme = getThemeById(savedThemeId);
      setCurrentTheme(theme);
      // Apply theme after a small delay to ensure DOM is ready
      setTimeout(() => {
        applyTheme(theme);
        applyTexturePreference(texturePref);
        applyTextureIntensity(intensityPref);
      }, 0);
    } else {
      // Apply default theme on mount
      setTimeout(() => {
        applyTheme(defaultTheme);
        applyTexturePreference(texturePref);
        applyTextureIntensity(intensityPref);
      }, 0);
    }
  }, []);

  // Apply theme when it changes (only after mount)
  useEffect(() => {
    if (mounted) {
      applyTheme(currentTheme);
    }
  }, [currentTheme, mounted]);

  useEffect(() => {
    if (mounted) {
      applyTexturePreference(textureEnabled);
    }
  }, [textureEnabled, mounted]);

  useEffect(() => {
    if (mounted) {
      applyTextureIntensity(textureIntensity);
    }
  }, [textureIntensity, mounted]);

  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  };

  const setTexture = (enabled: boolean) => {
    setTextureEnabled(enabled);
    localStorage.setItem(TEXTURE_STORAGE_KEY, String(enabled));
  };

  const setTextureIntensityValue = (intensity: number) => {
    setTextureIntensity(intensity);
    localStorage.setItem(TEXTURE_INTENSITY_STORAGE_KEY, String(intensity));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themes,
        setTheme,
        textureEnabled,
        setTexture,
        textureIntensity,
        setTextureIntensity: setTextureIntensityValue,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ============================================================================
// Navigation Loading Provider
// ============================================================================

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Reset loading when pathname changes
    setIsLoading(false);
  }, [pathname]);

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}
