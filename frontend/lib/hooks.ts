import { useAccessToken } from "@/app/providers";
import useSWR from "swr";
import * as api from "./api";

// ============================================
// Demo Data
// ============================================

const DEMO_WORKSPACES: api.Workspace[] = [
  {
    id: "demo-welcome",
    name: "Welcome to Moji",
    description: "Start here to learn the Moji flow",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-personal",
    name: "Personal",
    description: "Personal tasks, notes, and pages",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-work",
    name: "Work",
    description: "Work projects and collaboration",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_TASKS: api.Task[] = [
  { id: "t1", content: "Add your first task - quick, actionable, and small", done: false, priority: 2, workspace_id: "demo-welcome", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t2", content: "Use priorities to surface what matters today", done: false, priority: 3, workspace_id: "demo-welcome", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t3", content: "Mark tasks done to keep momentum visible", done: false, priority: 1, workspace_id: "demo-welcome", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const DEMO_NOTES: api.Note[] = [
  { id: "n1", title: "Quick memory", content: "Wi-Fi code: MOJI-2026", tags: ["example", "note"], workspace_id: "demo-welcome", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "n2", title: "Tiny reminder", content: "Sam - design review on Tuesday", tags: ["people"], workspace_id: "demo-welcome", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "n3", title: "Useful link", content: "https://usemoji.app - keep handy links here", tags: ["link"], workspace_id: "demo-welcome", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const DEMO_PAGES: api.Page[] = [
  {
    id: "p1",
    title: "Welcome to Moji",
    content: "# Welcome to Moji\n\nMoji is built for focus. Each workspace keeps a single context so your brain doesn't have to switch modes all day.\n\n## The flow\n- **Tasks** are small, actionable steps.\n- **Notes** are quick memory - codes, names, links.\n- **Pages** are for evolving work: plans, drafts, docs.\n",
    workspace_id: "demo-welcome",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p2",
    title: "Notes vs Pages",
    content: "# Notes vs Pages\n\nNotes capture short, single-purpose bits of information.\nPages are where ideas grow over time.\n\nIf it changes and expands, put it in a Page. If you just need to remember it, put it in a Note.\n",
    workspace_id: "demo-welcome",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================
// Workspaces Hooks
// ============================================

export function useWorkspaces(isDemo: boolean = false) {
  const token = useAccessToken();
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : "workspaces",
    () => api.getWorkspaces(token),
    {
      revalidateOnFocus: false, // Workspaces don't change frequently
      dedupingInterval: 30000, // 30s - workspaces change infrequently
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
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
  const token = useAccessToken();
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `workspace-${id}`,
    () => api.getWorkspace(id, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30s - workspace metadata changes infrequently
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
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
  const token = useAccessToken();
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `tasks-${workspaceId}`,
    () => api.getTasks(workspaceId, token),
    {
      revalidateOnFocus: true, // Tasks can change frequently, revalidate on focus
      dedupingInterval: 2000, // 2s - tasks change more frequently
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
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

// Hook to prefetch notes and pages in background
export function usePrefetchWorkspaceData(workspaceId: string, isDemo: boolean = false) {
  const token = useAccessToken();

  // Prefetch notes and pages when workspace is loaded (non-blocking)
  useSWR(
    isDemo || !workspaceId ? null : `notes-${workspaceId}`,
    () => api.getNotes(workspaceId, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000, // 15s for prefetch
      revalidateOnReconnect: true,
      errorRetryCount: 2, // Fewer retries for prefetch
    }
  );

  useSWR(
    isDemo || !workspaceId ? null : `pages-${workspaceId}`,
    () => api.getPages(workspaceId, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000, // 15s for prefetch
      revalidateOnReconnect: true,
      errorRetryCount: 2, // Fewer retries for prefetch
    }
  );
}

// ============================================
// Notes Hooks
// ============================================

export function useNotes(workspaceId: string, isDemo: boolean = false) {
  const token = useAccessToken();
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `notes-${workspaceId}`,
    () => api.getNotes(workspaceId, token),
    {
      revalidateOnFocus: true, // Notes can be updated, revalidate on focus
      dedupingInterval: 5000, // 5s - notes change moderately
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
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
  const token = useAccessToken();
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `pages-${workspaceId}`,
    () => api.getPages(workspaceId, token),
    {
      revalidateOnFocus: true, // Pages can be updated, revalidate on focus
      dedupingInterval: 5000, // 5s - pages change moderately
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
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
  const token = useAccessToken();
  const { data, error, isLoading, mutate } = useSWR(
    isDemo ? null : `page-${pageId}`,
    () => api.getPage(pageId, token),
    {
      revalidateOnFocus: true, // Active page should be fresh
      dedupingInterval: 2000, // 2s - active page changes frequently
      revalidateOnReconnect: true,
      keepPreviousData: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  const demoPage = DEMO_PAGES.find(p => p.id === pageId) || {
    id: pageId,
    title: "Untitled Page",
    content: "",
    workspace_id: "demo-welcome",
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
