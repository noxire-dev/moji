"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, AuthUser } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { Theme, themes, defaultTheme, getThemeById, applyTheme, THEME_STORAGE_KEY } from "@/lib/themes";
import { usePathname } from "next/navigation";

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
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  themes: themes,
  setTheme: () => {},
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
  email: "demo@moji.app",
  user_metadata: { username: "demo" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for demo mode
    const demoMode = localStorage.getItem("moji_demo_mode") === "true";
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

  // Load theme from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      const theme = getThemeById(savedThemeId);
      setCurrentTheme(theme);
      // Apply theme after a small delay to ensure DOM is ready
      setTimeout(() => {
        applyTheme(theme);
      }, 0);
    } else {
      // Apply default theme on mount
      setTimeout(() => {
        applyTheme(defaultTheme);
      }, 0);
    }
  }, []);

  // Apply theme when it changes (only after mount)
  useEffect(() => {
    if (mounted) {
      applyTheme(currentTheme);
    }
  }, [currentTheme, mounted]);

  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    setCurrentTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themes, setTheme }}>
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
