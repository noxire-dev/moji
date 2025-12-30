"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CheckSquare,
  FileText,
  Plus,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Page {
  id: string;
  title: string;
}

interface SidebarProps {
  workspaceId: string;
  workspaceName: string;
  pages?: Page[];
  isDemo?: boolean;
  activeTab?: "tasks" | "notes";
  onTabChange?: (tab: "tasks" | "notes") => void;
  onNewTask?: () => void;
  onNewNote?: () => void;
  onNewPage?: () => void;
}

const DEMO_PAGES: Page[] = [
  { id: "p1", title: "Project Overview" },
  { id: "p2", title: "Architecture Notes" },
  { id: "p3", title: "Meeting Notes" },
];

export function Sidebar({
  workspaceId,
  workspaceName,
  pages = [],
  isDemo = false,
  activeTab = "tasks",
  onTabChange,
  onNewTask,
  onNewNote,
  onNewPage,
}: SidebarProps) {
  const pathname = usePathname();
  const displayPages = isDemo ? DEMO_PAGES : pages;
  const isOnPage = pathname.includes("/pages/");

  const navItems = [
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
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full w-60 bg-card/50 border-r border-border">
        {/* Workspace Switcher */}
        <div className="p-2 border-b border-border">
          <WorkspaceSwitcher
            currentWorkspaceId={workspaceId}
            currentWorkspaceName={workspaceName}
            isDemo={isDemo}
          />
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = !isOnPage && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pages
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={onNewPage}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Page</TooltipContent>
              </Tooltip>
            </div>

            {displayPages.length === 0 ? (
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
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
        <div className="p-2 border-t border-border space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={onNewTask}
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={onNewNote}
          >
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

