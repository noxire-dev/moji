"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Folder, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as api from "@/lib/api";

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

interface WorkspaceListProps {
  isDemo?: boolean;
}

export function WorkspaceList({ isDemo = false }: WorkspaceListProps) {
  const [workspaces, setWorkspaces] = useState<api.Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    loadWorkspaces();
  }, [isDemo]);

  async function loadWorkspaces() {
    if (isDemo) {
      setWorkspaces(DEMO_WORKSPACES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    const newWorkspace: api.Workspace = {
      id: `ws-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || null,
      user_id: "demo-user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDemo) {
      setWorkspaces([...workspaces, newWorkspace]);
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      return;
    }

    try {
      const workspace = await api.createWorkspace({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setWorkspaces([...workspaces, workspace]);
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  }

  async function handleDelete(id: string) {
    if (isDemo) {
      setWorkspaces(workspaces.filter((w) => w.id !== id));
      return;
    }

    try {
      await api.deleteWorkspace(id);
      setWorkspaces(workspaces.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Organize your work by project
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <Input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid */}
      {workspaces.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No workspaces yet</p>
          <Button onClick={() => setShowCreate(true)}>
            Create your first workspace
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onDelete={() => handleDelete(workspace.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkspaceCard({
  workspace,
  onDelete,
}: {
  workspace: api.Workspace;
  onDelete: () => void;
}) {
  return (
    <Card className="group relative hover:bg-accent/50 transition-colors">
      <Link href={`/workspaces/${workspace.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Folder className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{workspace.name}</h3>
              {workspace.description && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
