"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as api from "@/lib/api";

interface NoteListProps {
  workspaceId: string;
  isDemo?: boolean;
}

const DEMO_NOTES: api.Note[] = [
  {
    id: "n1",
    title: "Project Ideas",
    content: "1. AI-powered todo prioritization\n2. Cross-device sync\n3. GitHub integration",
    tags: ["ideas", "roadmap"],
    workspace_id: "demo-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "n2",
    title: "Tech Stack",
    content: "FastAPI + Supabase + Next.js\n\nReasons:\n- Modern stack\n- Great DX",
    tags: ["tech"],
    workspace_id: "demo-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "n3",
    title: "Quick Thoughts",
    content: "Remember to add keyboard shortcuts!",
    tags: [],
    workspace_id: "demo-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function NoteList({ workspaceId, isDemo = false }: NoteListProps) {
  const [notes, setNotes] = useState<api.Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedNote, setSelectedNote] = useState<api.Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, [workspaceId, isDemo]);

  async function loadNotes() {
    if (isDemo) {
      setNotes(DEMO_NOTES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getNotes(workspaceId);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: { title: string; content: string; tags: string[] }) {
    const newNote: api.Note = {
      id: `note-${Date.now()}`,
      ...data,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDemo) {
      setNotes([newNote, ...notes]);
      setShowCreate(false);
      return;
    }

    try {
      const note = await api.createNote(workspaceId, data);
      setNotes([note, ...notes]);
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }

  async function handleUpdate(noteId: string, data: { title?: string; content?: string; tags?: string[] }) {
    if (isDemo) {
      const updated = notes.find((n) => n.id === noteId);
      if (updated) {
        const newNote = { ...updated, ...data, updated_at: new Date().toISOString() };
        setNotes(notes.map((n) => (n.id === noteId ? newNote : n)));
      }
      setSelectedNote(null);
      return;
    }

    try {
      const updated = await api.updateNote(noteId, data);
      setNotes(notes.map((n) => (n.id === noteId ? updated : n)));
      setSelectedNote(null);
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  }

  async function handleDelete(noteId: string) {
    if (isDemo) {
      setNotes(notes.filter((n) => n.id !== noteId));
      setSelectedNote(null);
      return;
    }

    try {
      await api.deleteNote(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
      setSelectedNote(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{notes.length} notes</span>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Note
        </Button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No notes yet. Create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => setSelectedNote(note)}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <NoteDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />

      {/* Edit Dialog */}
      {selectedNote && (
        <NoteDialog
          open={!!selectedNote}
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onSave={(data) => handleUpdate(selectedNote.id, data)}
          onDelete={() => handleDelete(selectedNote.id)}
        />
      )}
    </div>
  );
}

function NoteCard({
  note,
  onClick,
  onDelete,
}: {
  note: api.Note;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="group cursor-pointer relative overflow-hidden border-border/50 bg-card/80 hover:bg-card hover:border-border transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
      onClick={onClick}
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardContent className="p-4">
        <h4 className="font-medium text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {note.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
          {note.content || "No content"}
        </p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 3).map((tag, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary/80 hover:bg-primary/20 border-0"
              >
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
}

function NoteDialog({
  open,
  note,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  note?: api.Note;
  onClose: () => void;
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note?.tags || []);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
    }
  }, [note]);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit() {
    if (!title.trim()) return;
    onSave({ title: title.trim(), content, tags });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium"
          />
          <Textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] resize-none"
          />
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="icon" onClick={addTag}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            {onDelete && (
              <Button variant="ghost" className="text-destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!title.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
