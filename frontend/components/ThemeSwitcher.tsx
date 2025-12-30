"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/providers";

export function ThemeSwitcher() {
  const { theme: currentTheme, themes, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Theme</h4>
        <p className="text-xs text-muted-foreground">
          Choose how Moji looks to you
        </p>
      </div>

      <div className="grid gap-3">
        {themes.map((theme) => {
          const isSelected = currentTheme.id === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              {/* Color preview circles */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-full border border-white/10 shadow-sm"
                  style={{ backgroundColor: theme.colors.background }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-white/10 shadow-sm -ml-2"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-white/10 shadow-sm -ml-2"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>

              {/* Theme info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{theme.name}</span>
                  {theme.hasPaperTexture && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Texture
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {theme.description}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
