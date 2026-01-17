"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TooltipProvider
} from "@/components/ui/tooltip";
import * as api from "@/lib/api";
import { htmlToMarkdown, markdownToHtml } from "@/lib/editor";
import { usePage } from "@/lib/hooks";
import { logger } from "@/lib/logger";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Suggestion } from "@tiptap/suggestion";
import { ArrowLeft, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { toast } from "sonner";

interface PageEditorProps {
  pageId: string;
  workspaceId: string;
  isDemo?: boolean;
  onBack: () => void;
  onDelete?: () => void;
}

// Slash menu command interface
interface SlashCommand {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (editor: any) => void;
}

// Slash menu commands
const slashCommands: SlashCommand[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Create a bullet list",
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Code Block",
    description: "Create a code block",
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Quote",
    description: "Create a quote",
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
];

// Slash menu component
function SlashMenu({ items, selectedIndex, onSelect }: {
  items: SlashCommand[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl py-1.5 px-1.5 min-w-[240px] max-h-[320px] overflow-y-auto">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              index === selectedIndex
                ? "bg-accent/90 text-accent-foreground"
                : "hover:bg-accent/60 text-foreground"
            }`}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/70 border border-border/70">
              <Icon className="w-4 h-4 flex-shrink-0" />
            </span>
            <div className="flex-1 text-left font-medium">
              {item.title}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Slash menu extension - create a proper Tiptap Extension
const SlashMenuExtension = Extension.create({
  name: "slashMenu",

  addProseMirrorPlugins() {
    let container: HTMLElement | null = null;
    let root: Root | null = null;
    let selectedIndex = 0;
    let currentProps: any = null;

    const updateMenu = (props: any) => {
      currentProps = props;
      if (root && container && props) {
        const items = props.items || [];
        root.render(
          <SlashMenu
            items={items}
            selectedIndex={selectedIndex}
            onSelect={(index: number) => {
              const item = items[index];
              if (item && props.command) {
                props.command(item);
              }
            }}
          />
        );

        // Update position
        if (props.clientRect) {
          const rect = props.clientRect();
          if (rect) {
            container.style.left = `${rect.left}px`;
            container.style.top = `${rect.bottom + 4}px`;
          }
        }
      }
    };

    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        allowedPrefixes: null, // Allow "/" anywhere (at start of line, after space, etc.)
        items: ({ query }: { query: string; editor: any }) => {
          const filtered = slashCommands.filter((cmd) =>
            cmd.title.toLowerCase().includes(query.toLowerCase()) ||
            cmd.description?.toLowerCase().includes(query.toLowerCase())
          );
          const result = filtered.length > 0 ? filtered : slashCommands;
          return result;
        },
        command: ({ editor, range, props: selectedItem }: { editor: any; range: any; props: SlashCommand }) => {
          // Delete the "/" and query text
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .run();

          // Execute the selected command
          if (selectedItem) {
            selectedItem.command(editor);
          }
        },
        render: () => {
          return {
            onStart: (props: any) => {
              selectedIndex = 0;
              // Create container element
              container = document.createElement("div");
              container.className = "tiptap-suggestion-menu";
              container.style.position = "fixed";
              container.style.zIndex = "9999";
              document.body.appendChild(container);

              // Create React root
              root = createRoot(container);
              updateMenu(props);
            },
            onUpdate: (props: any) => {
              selectedIndex = 0; // Reset selection on update
              updateMenu(props);
            },
            onKeyDown: (keyDownProps: any) => {
              if (!currentProps) return false;

              if (keyDownProps.event.key === "Enter") {
                const items = currentProps.items || [];
                const item = items[selectedIndex];
                if (item && currentProps.command) {
                  currentProps.command(item);
                  return true;
                }
                return false;
              }
              if (keyDownProps.event.key === "ArrowUp") {
                const items = currentProps.items || [];
                selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                if (root && container) {
                  updateMenu(currentProps);
                }
                return true;
              }
              if (keyDownProps.event.key === "ArrowDown") {
                const items = currentProps.items || [];
                selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                if (root && container) {
                  updateMenu(currentProps);
                }
                return true;
              }
              return false;
            },
            onExit: () => {
              selectedIndex = 0;
              if (root) {
                root.unmount();
                root = null;
              }
              if (container) {
                container.remove();
                container = null;
              }
            },
          };
        },
      }),
    ];
  },
});

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
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      SlashMenuExtension,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[200px] px-1 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      if (initialized && fetchedPage && !isInitializingRef.current) {
        const html = editor.getHTML();
        const markdown = htmlToMarkdown(html);
        const changed = title !== fetchedPage.title || markdown !== fetchedPage.content;
        setHasChanges(changed);
      }
    },
  });

  // Initialize title and content when page data loads
  useEffect(() => {
    if (fetchedPage && !initialized && editor && !isInitializingRef.current) {
      isInitializingRef.current = true;
      setTitle(fetchedPage.title);

      // Convert markdown to HTML and set editor content
      const markdown = fetchedPage.content || "";
      if (markdown.trim()) {
        try {
          const html = markdownToHtml(markdown);
          editor.commands.setContent(html);
        } catch (err) {
          logger.error("Failed to parse markdown:", err);
          editor.commands.setContent(`<p>${markdown}</p>`);
        }
      } else {
        editor.commands.setContent("<p></p>");
      }

      setInitialized(true);
      isInitializingRef.current = false;
    }
  }, [fetchedPage, initialized, editor]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || !fetchedPage || !editor) return;

    try {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);

      if (isDemo) {
        mutate({ ...fetchedPage, title, content: markdown }, false);
        setHasChanges(false);
        return;
      }

      setSaving(true);
      const updated = await api.updatePage(pageId, { title, content: markdown });
      mutate(updated, false);
      setHasChanges(false);
      toast.success("Page saved");
    } catch (err) {
      logger.error("Failed to save page:", err);
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  }, [pageId, title, hasChanges, isDemo, fetchedPage, mutate, editor]);

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
      logger.error("Failed to delete page:", err);
      toast.error("Failed to delete page");
    }
  }

  // Track title changes
  useEffect(() => {
    if (fetchedPage && initialized && editor) {
      try {
        const html = editor.getHTML();
        const markdown = htmlToMarkdown(html);
        const changed = title !== fetchedPage.title || markdown !== fetchedPage.content;
        setHasChanges(changed);
      } catch (err) {
        // Ignore errors during change tracking
      }
    }
  }, [title, fetchedPage, initialized, editor]);

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
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/40 bg-card/40">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base md:text-lg font-medium bg-transparent border-none focus-visible:ring-0 max-w-md"
              placeholder="Page title..."
            />
          </div>
          <div className="flex items-center gap-1">
            {hasChanges && (
              <span className="text-xs text-muted-foreground mr-2">Unsaved</span>
            )}
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

        {/* Tiptap Editor */}
        {editor ? (
          <div className="flex-1 overflow-hidden bg-background">
            <ScrollArea className="h-full">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5">
                <div className="prose prose-invert max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mt-5 [&_.ProseMirror_h2]:mb-2.5 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_p]:my-3 [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-primary [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_blockquote]:my-2 [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_.is-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_.is-empty:first-child::before]:float-left [&_.ProseMirror_.is-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-empty:first-child::before]:h-0">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
