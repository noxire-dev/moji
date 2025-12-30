"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/app/providers";
import { Sidebar } from "@/components/Sidebar";
import { AppHeader } from "@/components/AppHeader";
import { TaskList } from "@/components/TaskList";
import { NoteList } from "@/components/NoteList";
import * as api from "@/lib/api";

// Demo workspaces for preview
const DEMO_WORKSPACES: Record<string, api.Workspace> = {
  "demo-1": { id: "demo-1", name: "Personal", description: "Personal tasks and notes", user_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  "demo-2": { id: "demo-2", name: "Moji Development", description: "Building the best productivity app", user_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  "demo-3": { id: "demo-3", name: "2026 Goals", description: "New year resolutions and plans", user_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
};

function WorkspaceDetail() {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<api.Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && workspaceId) {
      loadWorkspace();
    }
  }, [user, workspaceId, isDemo]);

  async function loadWorkspace() {
    if (isDemo) {
      const demoWorkspace = DEMO_WORKSPACES[workspaceId] || {
        id: workspaceId,
        name: "Demo Workspace",
        description: "This is a demo workspace",
        user_id: "demo",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWorkspace(demoWorkspace);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getWorkspace(workspaceId);
      setWorkspace(data);
    } catch (err) {
      console.error("Failed to load workspace:", err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !workspace) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader email={user.email} isDemo={isDemo} onSignOut={signOut} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          isDemo={isDemo}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 overflow-auto bg-background">
          <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold capitalize">{activeTab}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "tasks" 
                  ? "Manage your todos and track progress" 
                  : "Quick notes and snippets"}
              </p>
            </div>
            
            {/* Content */}
            {activeTab === "tasks" ? (
              <TaskList workspaceId={workspaceId} isDemo={isDemo} />
            ) : (
              <NoteList workspaceId={workspaceId} isDemo={isDemo} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <AuthProvider>
      <WorkspaceDetail />
    </AuthProvider>
  );
}
