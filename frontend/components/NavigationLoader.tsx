"use client";

import { useNavigationLoading } from "@/app/providers";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const SLOW_LOADING_MS = 5000; // Show toast after 5 seconds

export function NavigationLoader() {
  const { isLoading } = useNavigationLoading();
  const loadingStartTimeRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (isLoading) {
      console.log("[NavigationLoader] loading started");
      // Record when loading started (only on first load, not on re-renders)
      if (loadingStartTimeRef.current === null) {
        loadingStartTimeRef.current = Date.now();
        console.log("[NavigationLoader] timer scheduled for", SLOW_LOADING_MS, "ms");

        // Schedule toast after 5 seconds
        toastTimeoutRef.current = setTimeout(() => {
          console.log("[NavigationLoader] showing slow loading toast");
          toastIdRef.current = toast.info("Loading is taking longer than usual. The backend may be waking up...", {
            duration: 8000,
          });
        }, SLOW_LOADING_MS);
      }
    } else {
      console.log("[NavigationLoader] loading stopped");
      // Loading stopped - reset everything
      loadingStartTimeRef.current = null;

      // Clear timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }

      // Dismiss toast if it's showing
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [isLoading]);

  return null;
}
