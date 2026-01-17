"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import * as api from "@/lib/api";
import { usePages } from "@/lib/hooks";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import {
    CheckSquare,
    File,
    FileText,
    Plus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";

interface SidebarProps {
  workspaceId: string;
  workspaceName: string;
  isDemo?: boolean;
  activeTab?: "tasks" | "notes";
  onTabChange?: (tab: "tasks" | "notes") => void;
  onNewTask?: () => void;
  onNewNote?: () => void;
}

export const Sidebar = memo(function Sidebar({
  workspaceId,
  workspaceName,
  isDemo = false,
  activeTab = "tasks",
  onTabChange,
  onNewTask,
  onNewNote,
}: SidebarProps) {
  const pathname = usePathname();
  const { pages, isLoading, mutate } = usePages(workspaceId, isDemo);
  const [localPages, setLocalPages] = useState<api.Page[] | null>(null);

  const displayPages = useMemo(
    () => isDemo && localPages ? localPages : pages,
    [isDemo, localPages, pages]
  );
  const isOnPage = useMemo(
    () => pathname.includes("/pages/"),
    [pathname]
  );

  // Initialize local pages from SWR data for demo mode
  if (isDemo && localPages === null && pages.length > 0) {
    setLocalPages(pages);
  }

  async function handleNewPage() {
    const newPage: api.Page = {
      id: `page-${Date.now()}`,
      title: "Untitled Page",
      content: "",
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDemo) {
      setLocalPages([...(localPages || pages), newPage]);
      return;
    }

    try {
      const page = await api.createPage(workspaceId, { title: "Untitled Page" });
      mutate([...pages, page], false);
      toast.success("Page created");
    } catch (err) {
      logger.error("Failed to create page:", err);
      toast.error("Failed to create page");
    }
  }

  const navItems = useMemo(() => [
    {
      id: "tasks" as const,
      icon: CheckSquare,
      label: "Tasks",
    },
    {
      id: "notes" as const,
      icon: FileText,
      label: "Notes",
    },
  ], []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full w-60 bg-card/40 border-r border-border/40">
        {/* Workspace Switcher */}
        <div className="p-2 border-b border-border/40">
          <WorkspaceSwitcher
            currentWorkspaceId={workspaceId}
            currentWorkspaceName={workspaceName}
            isDemo={isDemo}
          />
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = !isOnPage && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <Separator className="my-3" />

          {/* Pages Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Pages
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handleNewPage}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Page</TooltipContent>
              </Tooltip>
            </div>

            {isLoading ? (
              <div className="px-2 py-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ) : displayPages.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No pages yet
              </p>
            ) : (
              displayPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/workspaces/${workspaceId}/pages/${page.id}`}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      pathname.includes(`/pages/${page.id}`)
                        ? "bg-accent/80 text-foreground"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                    )}
                  >
                    <File className="w-4 h-4" />
                    <span className="truncate">{page.title}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-2 border-t border-border/40 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={onNewTask}
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={onNewNote}
          >
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
});
