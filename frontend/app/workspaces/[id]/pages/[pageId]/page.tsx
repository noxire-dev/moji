"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { PageEditor } from "@/components/PageEditor";
import * as api from "@/lib/api";

const DEMO_WORKSPACES: Record<string, api.Workspace> = {
  "demo-1": { id: "demo-1", name: "Personal", description: "", user_id: "demo", created_at: "", updated_at: "" },
  "demo-2": { id: "demo-2", name: "Moji Development", description: "", user_id: "demo", created_at: "", updated_at: "" },
  "demo-3": { id: "demo-3", name: "2026 Goals", description: "", user_id: "demo", created_at: "", updated_at: "" },
};

function PageDetail() {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const pageId = params.pageId as string;
  const [workspaceName, setWorkspaceName] = useState("Workspace");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isDemo) {
      setWorkspaceName(DEMO_WORKSPACES[workspaceId]?.name || "Workspace");
    } else if (user) {
      api.getWorkspace(workspaceId)
        .then((ws) => setWorkspaceName(ws.name))
        .catch(() => {});
    }
  }, [workspaceId, isDemo, user]);

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
      <AppHeader email={user.email} isDemo={isDemo} onSignOut={signOut} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          isDemo={isDemo}
          onTabChange={(tab) => router.push(`/workspaces/${workspaceId}?tab=${tab}`)}
        />
        
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
  return (
    <AuthProvider>
      <PageDetail />
    </AuthProvider>
  );
}
