"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import * as api from "@/lib/api";
import { usePages } from "@/lib/hooks";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import {
    CheckSquare,
    File,
    FileText,
    Menu,
    Plus,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface MobileSidebarProps {
  workspaceId: string;
  workspaceName: string;
  isDemo?: boolean;
  activeTab?: "tasks" | "notes";
  onTabChange?: (tab: "tasks" | "notes") => void;
}

export function MobileSidebar({
  workspaceId,
  workspaceName,
  isDemo = false,
  activeTab = "tasks",
  onTabChange,
}: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { pages, isLoading, mutate } = usePages(workspaceId, isDemo);
  const [localPages, setLocalPages] = useState<api.Page[] | null>(null);

  const displayPages = isDemo && localPages ? localPages : pages;
  const isOnPage = pathname.includes("/pages/");

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
      setIsOpen(false);
      return;
    }

    try {
      const page = await api.createPage(workspaceId, { title: "Untitled Page" });
      mutate([...pages, page], false);
      toast.success("Page created");
      setIsOpen(false);
    } catch (err) {
      logger.error("Failed to create page:", err);
      toast.error("Failed to create page");
    }
  }

  const navItems = [
    { id: "tasks" as const, icon: CheckSquare, label: "Tasks" },
    { id: "notes" as const, icon: FileText, label: "Notes" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-sm border-r border-border/60 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <span className="font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Workspace Switcher */}
        <div className="p-2 border-b border-border/60">
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
                  onClick={() => {
                    onTabChange?.(item.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
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
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-muted-foreground hover:text-foreground"
                onClick={handleNewPage}
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
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
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-2.5 rounded-md text-sm transition-colors",
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
      </div>
    </>
  );
}
