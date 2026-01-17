"use client";

import { useNavigationLoading } from "@/app/providers";
import { useEffect, useState } from "react";

const SLOW_LOADING_MS = 10000;

export function NavigationLoader() {
  const { isLoading } = useNavigationLoading();
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSlowMessage(false);
      return;
    }

    // Reset and start timer when loading begins
    setShowSlowMessage(false);
    const timeoutId = window.setTimeout(() => {
      setShowSlowMessage(true);
    }, SLOW_LOADING_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-12 left-0 right-0 z-50">
      <div className="relative h-1">
        <div className="h-full bg-primary/20 animate-pulse" />
        <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite] absolute top-0 left-0 w-1/3" />
      </div>
      {showSlowMessage && (
        <div className="mx-auto mt-2 max-w-[calc(100%-2rem)] w-fit rounded-md border border-border/60 bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm text-center">
          Sorry for the wait! The free tier backend can take up to 50 seconds to wake up. Refreshing the page often helps.
        </div>
      )}
    </div>
  );
}
