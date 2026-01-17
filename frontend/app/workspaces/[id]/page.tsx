"use client";

import { useAuth, useNavigationLoading } from "@/app/providers";
import { AppHeader } from "@/components/AppHeader";
import { MobileSidebar } from "@/components/MobileSidebar";
import { NoteList } from "@/components/NoteList";
import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes, usePages, usePrefetchWorkspaceData, useTasks, useWorkspace } from "@/lib/hooks";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function WorkspaceDetail() {
  const { user, loading: authLoading, signOut, isDemo } = useAuth();
  const { setLoading } = useNavigationLoading();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.id as string;

  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [simulatedLoading, setSimulatedLoading] = useState(false);

  // Test slow loading in demo mode: add ?slow=15 to URL to simulate 15 second delay
  useEffect(() => {
    if (isDemo) {
      const slowParam = searchParams.get("slow");
      console.log("[WorkspaceDetail] slow param", slowParam);
      if (slowParam) {
        try {
          const delaySeconds = parseFloat(slowParam);
          if (delaySeconds > 0 && delaySeconds <= 60) {
            // Set loading immediately
            console.log("[WorkspaceDetail] simulate loading", `${delaySeconds}s`);
            setSimulatedLoading(true);
            setLoading(true);
            const timer = setTimeout(() => {
              console.log("[WorkspaceDetail] simulated loading complete");
              setSimulatedLoading(false);
              setLoading(false);
            }, delaySeconds * 1000);
            return () => clearTimeout(timer);
          }
        } catch (e) {
          // Invalid parameter, ignore
          console.log("[WorkspaceDetail] invalid slow param");
        }
      }
    }
  }, [isDemo, searchParams, setLoading]);

  const { workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId, isDemo);
  const { tasks, isLoading: tasksLoading } = useTasks(workspaceId, isDemo);
  const { notes, isLoading: notesLoading } = useNotes(workspaceId, isDemo);
  const { pages, isLoading: pagesLoading } = usePages(workspaceId, isDemo);

  // Prefetch notes and pages in background (non-blocking)
  usePrefetchWorkspaceData(workspaceId, isDemo);

  // Progressive loading: show content as soon as workspace and tasks are loaded
  const isLoading = workspaceLoading || (activeTab === "tasks" && tasksLoading);

  // Determine if we should show loading: either actively loading OR we don't have data yet
  // In demo mode with ?slow param, use simulated loading
  const shouldShowLoading = isDemo && simulatedLoading
    ? true
    : isLoading || (!workspace && !isDemo);

  // Use navbar loader for workspace/data loading (keep it true during simulated loading)
  useEffect(() => {
    if (isDemo && simulatedLoading) {
      setLoading(true);
      return;
    }

    setLoading(shouldShowLoading);
  }, [shouldShowLoading, setLoading, isDemo, simulatedLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Only show full page spinner for initial auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
        <AppHeader isDemo={isDemo} onSignOut={signOut} />
        <div className="flex-1 flex overflow-hidden">
          <div className="hidden md:block w-60 border-r border-border/40 bg-card/40">
            <div className="p-3 space-y-3">
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-md" />
            </div>
          </div>
          <main className="flex-1 overflow-auto bg-background">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show skeleton/loading state while workspace is loading, but use navbar loader
  // Also show skeleton if in demo mode with simulated loading
  if (!workspace || (isDemo && simulatedLoading)) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
        <AppHeader username={user.user_metadata?.username} email={user.email} isDemo={isDemo} onSignOut={signOut} />
        <div className="flex-1 flex overflow-hidden">
          <div className="hidden md:block w-60 border-r border-border/40 bg-card/40">
            <div className="p-3 space-y-3">
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-7 w-28 rounded-md" />
            </div>
          </div>
          <main className="flex-1 overflow-auto bg-background">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
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
  return (
    <Suspense fallback={null}>
      <WorkspaceDetail />
    </Suspense>
  );
}
