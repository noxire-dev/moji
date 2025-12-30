import useSWR from "swr";
import * as api from "./api";

// ============================================
// Demo Data
// ============================================

const DEMO_WORKSPACES: api.Workspace[] = [
  {
    id: "demo-1",
    name: "Personal",
    description: "Personal tasks and notes",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "Moji Development",
    description: "Building the best productivity app",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    name: "2026 Goals",
    description: "New year resolutions and plans",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_TASKS: api.Task[] = [
  { id: "t1", content: "Set up Supabase project", done: true, priority: 3, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t2", content: "Build FastAPI backend", done: true, priority: 2, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t3", content: "Create Next.js frontend with shadcn", done: false, priority: 3, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t4", content: "Implement Pages feature", done: false, priority: 2, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t5", content: "Add markdown editor", done: false, priority: 1, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const DEMO_NOTES: api.Note[] = [
  { id: "n1", title: "Quick idea", content: "Add keyboard shortcuts for common actions", tags: ["feature"], workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "n2", title: "Bug fix", content: "Check mobile responsiveness on sidebar", tags: ["bug"], workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const DEMO_PAGES: api.Page[] = [
  { id: "p1", title: "Project Overview", content: "# Moji Project Overview\n\nA workspace-centric productivity app.", workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p2", title: "Architecture Notes", content: "# Architecture Notes\n\nBackend: FastAPI\nFrontend: Next.js", workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p3", title: "Meeting Notes", content: "# Meeting Notes\n\nDecember 30, 2025", workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// ============================================
// Workspaces Hooks
// ============================================

export function useWorkspaces(isDemo: boolean = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : "workspaces",
    () => api.getWorkspaces(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    workspaces: isDemo ? DEMO_WORKSPACES : (data ?? []),
    isLoading: isDemo ? false : isLoading,
    error,
    mutate,
  };
}

export function useWorkspace(id: string, isDemo: boolean = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `workspace-${id}`,
    () => api.getWorkspace(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const demoWorkspace = DEMO_WORKSPACES.find(w => w.id === id) || {
    id,
    name: "Demo Workspace",
    description: "This is a demo workspace",
    user_id: "demo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    workspace: isDemo ? demoWorkspace : data,
    isLoading: isDemo ? false : isLoading,
    error,
    mutate,
  };
}

// ============================================
// Tasks Hooks
// ============================================

export function useTasks(workspaceId: string, isDemo: boolean = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `tasks-${workspaceId}`,
    () => api.getTasks(workspaceId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const demoTasks = DEMO_TASKS.filter(t => t.workspace_id === workspaceId || workspaceId.startsWith("demo"));

  return {
    tasks: isDemo ? demoTasks : (data ?? []),
    isLoading: isDemo ? false : isLoading,
    error,
    mutate,
  };
}

// ============================================
// Notes Hooks
// ============================================

export function useNotes(workspaceId: string, isDemo: boolean = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `notes-${workspaceId}`,
    () => api.getNotes(workspaceId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const demoNotes = DEMO_NOTES.filter(n => n.workspace_id === workspaceId || workspaceId.startsWith("demo"));

  return {
    notes: isDemo ? demoNotes : (data ?? []),
    isLoading: isDemo ? false : isLoading,
    error,
    mutate,
  };
}

// ============================================
// Pages Hooks
// ============================================

export function usePages(workspaceId: string, isDemo: boolean = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `pages-${workspaceId}`,
    () => api.getPages(workspaceId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const demoPages = DEMO_PAGES.filter(p => p.workspace_id === workspaceId || workspaceId.startsWith("demo"));

  return {
    pages: isDemo ? demoPages : (data ?? []),
    isLoading: isDemo ? false : isLoading,
    error,
    mutate,
  };
}

export function usePage(pageId: string, isDemo: boolean = false) {
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `page-${pageId}`,
    () => api.getPage(pageId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const demoPage = DEMO_PAGES.find(p => p.id === pageId) || {
    id: pageId,
    title: "Untitled Page",
    content: "",
    workspace_id: "demo-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    page: isDemo ? demoPage : data,
    isLoading: isDemo ? false : isLoading,
    error,
    mutate,
  };
}
