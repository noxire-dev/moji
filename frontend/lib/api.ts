import { supabase } from "./supabase";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function normalizeApiBase(base: string): string {
  try {
    const url = new URL(base);
    const isHttpsPage = typeof window !== "undefined" && window.location.protocol === "https:";
    if (url.protocol === "http:" && (url.hostname.endsWith(".up.railway.app") || isHttpsPage)) {
      url.protocol = "https:";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return base;
  }
}

const API_BASE = normalizeApiBase(RAW_API_BASE);

if (typeof window !== "undefined") {
  const win = window as typeof window & { __mojiApiBaseLogged?: boolean };
  if (!win.__mojiApiBaseLogged) {
    win.__mojiApiBaseLogged = true;
    console.info("Moji API base:", API_BASE);
  }
}

// Token cache to avoid repeated lookups
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Types matching backend models
export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  content: string;
  done: boolean;
  priority: number;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  title: string;
  content: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

// API Error type
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  // Use provided token, or try cache, or fetch from supabase
  let accessToken = token;

  if (!accessToken) {
    // Check cache first
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) {
      accessToken = cachedToken;
    } else {
      // Fetch from supabase and cache
      const session = await supabase.auth.getSession();
      accessToken = session.data.session?.access_token ?? null;

      if (accessToken) {
        cachedToken = accessToken;
        // Cache for 50 minutes (tokens typically expire in 1 hour)
        tokenExpiry = now + 50 * 60 * 1000;
      }
    }
  } else {
    // Update cache when token is provided
    cachedToken = accessToken;
    tokenExpiry = Date.now() + 50 * 60 * 1000;
  }

  if (!accessToken) {
    throw new ApiError(401, "Not authenticated");
  }

  const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(response.status, error.detail || "Request failed");
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ============================================
// Workspace API
// ============================================

export async function getWorkspaces(token?: string | null): Promise<Workspace[]> {
  return apiFetch<Workspace[]>("/workspaces", {}, token);
}

export async function getWorkspace(id: string, token?: string | null): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/${id}`, {}, token);
}

export async function createWorkspace(data: {
  name: string;
  description?: string;
}, token?: string | null): Promise<Workspace> {
  return apiFetch<Workspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateWorkspace(
  id: string,
  data: { name?: string; description?: string },
  token?: string | null
): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deleteWorkspace(id: string, token?: string | null): Promise<void> {
  return apiFetch<void>(`/workspaces/${id}`, {
    method: "DELETE",
  }, token);
}

// ============================================
// Task API
// ============================================

export async function getTasks(workspaceId: string, token?: string | null): Promise<Task[]> {
  return apiFetch<Task[]>(`/workspaces/${workspaceId}/tasks`, {}, token);
}

export async function getTask(taskId: string, token?: string | null): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}`, {}, token);
}

export async function createTask(
  workspaceId: string,
  data: { content: string; priority?: number },
  token?: string | null
): Promise<Task> {
  return apiFetch<Task>(`/workspaces/${workspaceId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateTask(
  taskId: string,
  data: { content?: string; done?: boolean; priority?: number },
  token?: string | null
): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function toggleTask(taskId: string, token?: string | null): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}/toggle`, {
    method: "PATCH",
  }, token);
}

export async function deleteTask(taskId: string, token?: string | null): Promise<void> {
  return apiFetch<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  }, token);
}

// ============================================
// Note API
// ============================================

export async function getNotes(workspaceId: string, token?: string | null): Promise<Note[]> {
  return apiFetch<Note[]>(`/workspaces/${workspaceId}/notes`, {}, token);
}

export async function getNote(noteId: string, token?: string | null): Promise<Note> {
  return apiFetch<Note>(`/notes/${noteId}`, {}, token);
}

export async function createNote(
  workspaceId: string,
  data: { title: string; content?: string; tags?: string[] },
  token?: string | null
): Promise<Note> {
  return apiFetch<Note>(`/workspaces/${workspaceId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateNote(
  noteId: string,
  data: { title?: string; content?: string; tags?: string[] },
  token?: string | null
): Promise<Note> {
  return apiFetch<Note>(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deleteNote(noteId: string, token?: string | null): Promise<void> {
  return apiFetch<void>(`/notes/${noteId}`, {
    method: "DELETE",
  }, token);
}

// ============================================
// Page API
// ============================================

export async function getPages(workspaceId: string, token?: string | null): Promise<Page[]> {
  return apiFetch<Page[]>(`/workspaces/${workspaceId}/pages`, {}, token);
}

export async function getPage(pageId: string, token?: string | null): Promise<Page> {
  return apiFetch<Page>(`/pages/${pageId}`, {}, token);
}

export async function createPage(
  workspaceId: string,
  data: { title: string; content?: string },
  token?: string | null
): Promise<Page> {
  return apiFetch<Page>(`/workspaces/${workspaceId}/pages`, {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updatePage(
  pageId: string,
  data: { title?: string; content?: string },
  token?: string | null
): Promise<Page> {
  return apiFetch<Page>(`/pages/${pageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deletePage(pageId: string, token?: string | null): Promise<void> {
  return apiFetch<void>(`/pages/${pageId}`, {
    method: "DELETE",
  }, token);
}

// ============================================
// Account API
// ============================================

export async function deleteAccount(token?: string | null): Promise<void> {
  return apiFetch<void>("/account", {
    method: "DELETE",
  }, token);
}
