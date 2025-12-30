"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as api from "@/lib/api";

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  currentWorkspaceName: string;
  isDemo?: boolean;
}

const DEMO_WORKSPACES: api.Workspace[] = [
  { id: "demo-1", name: "Personal", description: "Personal tasks and notes", user_id: "demo", created_at: "", updated_at: "" },
  { id: "demo-2", name: "Moji Development", description: "Building the best productivity app", user_id: "demo", created_at: "", updated_at: "" },
  { id: "demo-3", name: "2026 Goals", description: "New year resolutions", user_id: "demo", created_at: "", updated_at: "" },
];

export function WorkspaceSwitcher({
  currentWorkspaceId,
  currentWorkspaceName,
  isDemo = false,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<api.Workspace[]>([]);
  const [loading, setLoading] = useState(true);

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
      const data = await api.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(workspaceId: string) {
    setOpen(false);
    if (workspaceId !== currentWorkspaceId) {
      router.push(`/workspaces/${workspaceId}`);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between gap-2 px-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="truncate text-sm font-medium">{currentWorkspaceName}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search workspaces..." />
          <CommandList>
            <CommandEmpty>No workspaces found.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => handleSelect(workspace.id)}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {workspace.id === currentWorkspaceId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push("/");
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>All Workspaces</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

