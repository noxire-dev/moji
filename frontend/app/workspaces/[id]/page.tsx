"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useNavigationLoading } from "@/app/providers";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { AppHeader } from "@/components/AppHeader";
import { TaskList } from "@/components/TaskList";
import { NoteList } from "@/components/NoteList";
import { useWorkspace, useTasks, useNotes, usePages, usePrefetchWorkspaceData } from "@/lib/hooks";

function WorkspaceDetail() {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const { setLoading } = useNavigationLoading();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId, isDemo);
  const { tasks, isLoading: tasksLoading } = useTasks(workspaceId, isDemo);
  const { notes, isLoading: notesLoading } = useNotes(workspaceId, isDemo);
  const { pages, isLoading: pagesLoading } = usePages(workspaceId, isDemo);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");

  // Prefetch notes and pages in background (non-blocking)
  usePrefetchWorkspaceData(workspaceId, isDemo);

  // Progressive loading: show content as soon as workspace and tasks are loaded
  const isLoading = workspaceLoading || (activeTab === "tasks" && tasksLoading);

  // Use navbar loader for workspace/data loading
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

  // Show skeleton/loading state while workspace is loading, but use navbar loader
  if (!workspace) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <AppHeader username={user.user_metadata?.username} email={user.email} isDemo={isDemo} onSignOut={signOut} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader username={user.user_metadata?.username} email={user.email} isDemo={isDemo} onSignOut={signOut} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            workspaceId={workspaceId}
            workspaceName={workspace.name}
            isDemo={isDemo}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        <main className="flex-1 overflow-auto bg-background">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Mobile Header with Menu */}
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <MobileSidebar
                workspaceId={workspaceId}
                workspaceName={workspace.name}
                isDemo={isDemo}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-semibold capitalize">{activeTab}</h1>
                <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                  {activeTab === "tasks"
                    ? "Manage your todos and track progress"
                    : "Quick notes and snippets"}
                </p>
              </div>
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
  return <WorkspaceDetail />;
}
