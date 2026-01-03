"use client";

import { useNavigationLoading } from "@/app/providers";

export function NavigationLoader() {
  const { isLoading } = useNavigationLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed top-14 left-0 right-0 h-1 z-50">
      <div className="h-full bg-primary/20 animate-pulse" />
      <div className="h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite] absolute top-0 left-0 w-1/3" />
    </div>
  );
}
