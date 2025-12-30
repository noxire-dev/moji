"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import * as api from "@/lib/api";
import { usePage } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { ArrowLeft, Columns2, Maximize2, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface PageEditorProps {
  pageId: string;
  workspaceId: string;
  isDemo?: boolean;
  onBack: () => void;
  onDelete?: () => void;
}

export function PageEditor({
  pageId,
  workspaceId,
  isDemo = false,
  onBack,
  onDelete,
}: PageEditorProps) {
  const { page: fetchedPage, isLoading, mutate } = usePage(pageId, isDemo);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize title and content when page data loads
  useEffect(() => {
    if (fetchedPage && !initialized) {
      setTitle(fetchedPage.title);
      setContent(fetchedPage.content);
      setInitialized(true);
    }
  }, [fetchedPage, initialized]);

  useEffect(() => {
    if (fetchedPage && initialized) {
      const changed = title !== fetchedPage.title || content !== fetchedPage.content;
      setHasChanges(changed);
    }
  }, [title, content, fetchedPage, initialized]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || !fetchedPage) return;

    if (isDemo) {
      mutate({ ...fetchedPage, title, content }, false);
      setHasChanges(false);
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updatePage(pageId, { title, content });
      mutate(updated, false);
      setHasChanges(false);
      toast.success("Page saved");
    } catch (err) {
      console.error("Failed to save page:", err);
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  }, [pageId, title, content, hasChanges, isDemo, fetchedPage, mutate]);

  // Auto-save on Cmd/Ctrl + S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  async function handleDelete() {
    if (isDemo) {
      onDelete?.();
      return;
    }

    try {
      await api.deletePage(pageId);
      toast.success("Page deleted");
      onDelete?.();
    } catch (err) {
      console.error("Failed to delete page:", err);
      toast.error("Failed to delete page");
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-20 h-8 rounded" />
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!fetchedPage) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Page not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium bg-transparent border-none focus-visible:ring-0 max-w-md"
              placeholder="Page title..."
            />
          </div>
          <div className="flex items-center gap-1">
            {hasChanges && (
              <span className="text-xs text-muted-foreground mr-2">Unsaved</span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSplitView(!splitView)}
                >
                  {splitView ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Columns2 className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {splitView ? "Focus mode" : "Split view"}
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className={cn("flex-1 flex overflow-hidden", splitView ? "gap-0" : "")}>
          {/* Markdown Editor */}
          <div className={cn("flex flex-col", splitView ? "w-1/2 border-r border-border" : "flex-1")}>
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <span className="text-xs text-muted-foreground font-medium">MARKDOWN</span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none font-mono text-sm bg-transparent border-none rounded-none focus-visible:ring-0 p-4"
              placeholder="Write your content in markdown..."
            />
          </div>

          {/* Live Preview */}
          {splitView && (
            <div className="w-1/2 flex flex-col">
              <div className="px-4 py-2 border-b border-border bg-muted/30">
                <span className="text-xs text-muted-foreground font-medium">PREVIEW</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 prose max-w-none">
                  <MarkdownPreview content={content} />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Markdown preview with real-time rendering
function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-muted-foreground italic">Start typing to see preview...</p>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent = "";
  let codeLanguage = "";
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listItems.length > 0) {
      if (listType === "ul") {
        elements.push(<ul key={`list-${elements.length}`} className="my-4 pl-6 list-disc">{listItems}</ul>);
      } else {
        elements.push(<ol key={`list-${elements.length}`} className="my-4 pl-6 list-decimal">{listItems}</ol>);
      }
      listItems = [];
      listType = null;
    }
  }

  lines.forEach((line, i) => {
    // Code block handling
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className="bg-muted p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm">
            <code>{codeContent.trim()}</code>
          </pre>
        );
        codeContent = "";
        codeLanguage = "";
      } else {
        flushList();
        codeLanguage = line.slice(3);
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      return;
    }

    // Headers
    if (line.startsWith("# ")) {
      flushList();
      elements.push(<h1 key={i} className="text-2xl font-semibold mt-8 mb-4 first:mt-0">{formatInline(line.slice(2))}</h1>);
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={i} className="text-xl font-semibold mt-6 mb-3">{formatInline(line.slice(3))}</h2>);
      return;
    }
    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={i} className="text-lg font-medium mt-4 mb-2">{formatInline(line.slice(4))}</h3>);
      return;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      flushList();
      elements.push(<hr key={i} className="border-border my-6" />);
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={i} className="border-l-2 border-border pl-4 italic text-muted-foreground my-2">
          {formatInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(<li key={i}>{formatInline(line.slice(2))}</li>);
      return;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(<li key={i}>{formatInline(line.replace(/^\d+\. /, ""))}</li>);
      return;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      return;
    }

    // Paragraph
    flushList();
    elements.push(<p key={i} className="my-3 leading-relaxed">{formatInline(line)}</p>);
  });

  flushList();

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Process inline formatting
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold + Italic
    let match = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (match) {
      parts.push(<strong key={key++}><em>{match[1]}</em></strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Bold
    match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic
    match = remaining.match(/^\*(.+?)\*/);
    if (match) {
      parts.push(<em key={key++}>{match[1]}</em>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Inline code
    match = remaining.match(/^`([^`]+)`/);
    if (match) {
      parts.push(
        <code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Checkbox unchecked
    match = remaining.match(/^\[ \]/);
    if (match) {
      parts.push(
        <span key={key++} className="inline-block w-4 h-4 border border-muted-foreground rounded mr-1.5 align-middle" />
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Checkbox checked
    match = remaining.match(/^\[x\]/i);
    if (match) {
      parts.push(
        <span key={key++} className="inline-flex items-center justify-center w-4 h-4 bg-primary rounded mr-1.5 align-middle text-xs text-primary-foreground">
          ✓
        </span>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Link
    match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      parts.push(
        <a key={key++} href={match[2]} className="text-primary underline underline-offset-2">
          {match[1]}
        </a>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Regular text (take one character at a time if no pattern matches)
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
}
