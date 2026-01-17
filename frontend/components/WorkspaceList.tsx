"use client";

import { useNavigationLoading } from "@/app/providers";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import * as api from "@/lib/api";
import { useWorkspaces } from "@/lib/hooks";
import { logger } from "@/lib/logger";
import { Folder, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface WorkspaceListProps {
  isDemo?: boolean;
}

export function WorkspaceList({ isDemo = false }: WorkspaceListProps) {
  const { workspaces, isLoading, mutate } = useWorkspaces(isDemo);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const { setLoading } = useNavigationLoading();
  const dataLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      dataLoadingRef.current = true;
      setLoading(true);
      return;
    }

    if (dataLoadingRef.current) {
      setLoading(false);
      dataLoadingRef.current = false;
    }
  }, [isLoading, setLoading]);

  async function handleCreate() {
    if (!newName.trim()) return;

    if (isDemo) {
      // For demo, just close the dialog (SWR handles demo data)
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
      mutate([...workspaces, workspace], false);
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      toast.success("Workspace created");
    } catch (err) {
      logger.error("Failed to create workspace:", err);
      toast.error("Failed to create workspace");
    }
  }

  async function handleDelete(id: string) {
    if (isDemo) {
      return; // Don't allow deletion in demo mode
    }

    try {
      await api.deleteWorkspace(id);
      mutate(workspaces.filter((w) => w.id !== id), false);
      toast.success("Workspace deleted");
    } catch (err) {
      logger.error("Failed to delete workspace:", err);
      toast.error("Failed to delete workspace");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
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
              isDemo={isDemo}
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
  isDemo,
}: {
  workspace: api.Workspace;
  onDelete: () => void;
  isDemo: boolean;
}) {
  const router = useRouter();
  const { setLoading } = useNavigationLoading();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    router.push(`/workspaces/${workspace.id}`);
  };

  return (
    <Card className="group relative hover:bg-accent/50 transition-colors">
      <Link href={`/workspaces/${workspace.id}`} onClick={handleClick}>
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
      {!isDemo && (
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
      )}
    </Card>
  );
}
