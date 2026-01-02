"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { WorkspaceList } from "@/components/WorkspaceList";
import { AppHeader } from "@/components/AppHeader";

export default function HomePage() {
  const { user, loading, signOut, isDemo } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        username={user.user_metadata?.username}
        email={user.email}
        isDemo={isDemo}
        onSignOut={signOut}
      />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <WorkspaceList isDemo={isDemo} />
        </div>
      </main>
    </div>
  );
}
