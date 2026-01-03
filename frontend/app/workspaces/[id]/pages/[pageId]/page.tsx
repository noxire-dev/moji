"use client";

import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useNavigationLoading } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/lib/hooks";

// Dynamically import PageEditor for code splitting
const PageEditor = dynamic(() => import("@/components/PageEditor").then(mod => ({ default: mod.PageEditor })), {
  loading: () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-1">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-20 h-8 rounded" />
        </div>
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ),
  ssr: false,
});

function PageDetail() {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const { setLoading } = useNavigationLoading();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const pageId = params.pageId as string;

  const { workspace, isLoading } = useWorkspace(workspaceId, isDemo);

  // Use navbar loader for workspace loading
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Only show full page spinner for initial auth loading
  if (authLoading) {
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
    <div className="h-screen flex flex-col bg-background">
      <AppHeader username={user.user_metadata?.username} email={user.email} isDemo={isDemo} onSignOut={signOut} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile for PageEditor view */}
        <div className="hidden md:block">
          <Sidebar
            workspaceId={workspaceId}
            workspaceName={workspace?.name || "Workspace"}
            isDemo={isDemo}
            onTabChange={(tab) => router.push(`/workspaces/${workspaceId}?tab=${tab}`)}
          />
        </div>

        <main className="flex-1 overflow-hidden bg-background">
          <PageEditor
            pageId={pageId}
            workspaceId={workspaceId}
            isDemo={isDemo}
            onBack={() => router.push(`/workspaces/${workspaceId}`)}
            onDelete={() => router.push(`/workspaces/${workspaceId}`)}
          />
        </main>
      </div>
    </div>
  );
}

export default function PagePage() {
  return <PageDetail />;
}
