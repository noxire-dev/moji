import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  options: RequestInit = {}
): Promise<T> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new ApiError(401, "Not authenticated");
  }

  const response = await fetch(`${API_BASE}/api/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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

export async function getWorkspaces(): Promise<Workspace[]> {
  return apiFetch<Workspace[]>("/workspaces");
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/${id}`);
}

export async function createWorkspace(data: {
  name: string;
  description?: string;
}): Promise<Workspace> {
  return apiFetch<Workspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWorkspace(
  id: string,
  data: { name?: string; description?: string }
): Promise<Workspace> {
  return apiFetch<Workspace>(`/workspaces/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWorkspace(id: string): Promise<void> {
  return apiFetch<void>(`/workspaces/${id}`, {
    method: "DELETE",
  });
}

// ============================================
// Task API
// ============================================

export async function getTasks(workspaceId: string): Promise<Task[]> {
  return apiFetch<Task[]>(`/workspaces/${workspaceId}/tasks`);
}

export async function getTask(taskId: string): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}`);
}

export async function createTask(
  workspaceId: string,
  data: { content: string; priority?: number }
): Promise<Task> {
  return apiFetch<Task>(`/workspaces/${workspaceId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  taskId: string,
  data: { content?: string; done?: boolean; priority?: number }
): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function toggleTask(taskId: string): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}/toggle`, {
    method: "PATCH",
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  return apiFetch<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// ============================================
// Note API
// ============================================

export async function getNotes(workspaceId: string): Promise<Note[]> {
  return apiFetch<Note[]>(`/workspaces/${workspaceId}/notes`);
}

export async function getNote(noteId: string): Promise<Note> {
  return apiFetch<Note>(`/notes/${noteId}`);
}

export async function createNote(
  workspaceId: string,
  data: { title: string; content?: string; tags?: string[] }
): Promise<Note> {
  return apiFetch<Note>(`/workspaces/${workspaceId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  noteId: string,
  data: { title?: string; content?: string; tags?: string[] }
): Promise<Note> {
  return apiFetch<Note>(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  return apiFetch<void>(`/notes/${noteId}`, {
    method: "DELETE",
  });
}

// ============================================
// Page API
// ============================================

export async function getPages(workspaceId: string): Promise<Page[]> {
  return apiFetch<Page[]>(`/workspaces/${workspaceId}/pages`);
}

export async function getPage(pageId: string): Promise<Page> {
  return apiFetch<Page>(`/pages/${pageId}`);
}

export async function createPage(
  workspaceId: string,
  data: { title: string; content?: string }
): Promise<Page> {
  return apiFetch<Page>(`/workspaces/${workspaceId}/pages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePage(
  pageId: string,
  data: { title?: string; content?: string }
): Promise<Page> {
  return apiFetch<Page>(`/pages/${pageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePage(pageId: string): Promise<void> {
  return apiFetch<void>(`/pages/${pageId}`, {
    method: "DELETE",
  });
}

