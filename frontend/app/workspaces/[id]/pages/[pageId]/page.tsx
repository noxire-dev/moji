"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { PageEditor } from "@/components/PageEditor";
import { useWorkspace } from "@/lib/hooks";

function PageDetail() {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const pageId = params.pageId as string;

  const { workspace, isLoading } = useWorkspace(workspaceId, isDemo);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
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
