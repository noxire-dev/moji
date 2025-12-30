"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";

interface TaskListProps {
  workspaceId: string;
  isDemo?: boolean;
}

const DEMO_TASKS: api.Task[] = [
  { id: "t1", content: "Set up Supabase project", done: true, priority: 3, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t2", content: "Build FastAPI backend", done: true, priority: 2, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t3", content: "Create Next.js frontend with shadcn", done: false, priority: 3, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t4", content: "Implement Pages feature", done: false, priority: 2, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t5", content: "Add markdown editor", done: false, priority: 1, workspace_id: "demo-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const priorityConfig = {
  0: { label: "None", color: "text-muted-foreground", border: "border-l-muted" },
  1: { label: "Low", color: "text-priority-low", border: "border-l-priority-low" },
  2: { label: "Medium", color: "text-priority-medium", border: "border-l-priority-medium" },
  3: { label: "High", color: "text-priority-high", border: "border-l-priority-high" },
};

export function TaskList({ workspaceId, isDemo = false }: TaskListProps) {
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [workspaceId, isDemo]);

  async function loadTasks() {
    if (isDemo) {
      setTasks(DEMO_TASKS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getTasks(workspaceId);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newTask: api.Task = {
      id: `task-${Date.now()}`,
      content: newContent.trim(),
      done: false,
      priority: newPriority,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDemo) {
      setTasks([...tasks, newTask]);
      setNewContent("");
      setNewPriority(0);
      return;
    }

    try {
      const task = await api.createTask(workspaceId, {
        content: newContent.trim(),
        priority: newPriority,
      });
      setTasks([...tasks, task]);
      setNewContent("");
      setNewPriority(0);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  }

  async function handleToggle(taskId: string) {
    if (isDemo) {
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
      return;
    }

    try {
      const updated = await api.toggleTask(taskId);
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  }

  async function handleDelete(taskId: string) {
    if (isDemo) {
      setTasks(tasks.filter((t) => t.id !== taskId));
      return;
    }

    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  }

  const incompleteTasks = tasks.filter((t) => !t.done).sort((a, b) => b.priority - a.priority);
  const completedTasks = tasks.filter((t) => t.done);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Task Form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="flex-1 bg-card"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(Number(e.target.value))}
          className="px-3 py-2 rounded-md bg-card border border-input text-sm text-foreground"
        >
          <option value={0}>None</option>
          <option value={1}>Low</option>
          <option value={2}>Medium</option>
          <option value={3}>High</option>
        </select>
        <Button type="submit" size="icon" disabled={!newContent.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </form>

      {/* Task List */}
      <div className="space-y-1 stagger">
        {incompleteTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={() => handleToggle(task.id)}
            onDelete={() => handleDelete(task.id)}
          />
        ))}
      </div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Completed ({completedTasks.length})
          </h4>
          <div className="space-y-1">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task.id)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No tasks yet. Add one above!</p>
        </div>
      )}
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: api.Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
        task.done
          ? "bg-muted/30 border-transparent opacity-60"
          : `bg-card/80 border-border/50 hover:border-border hover:bg-card hover:shadow-md hover:shadow-primary/5 ${priority.border}`
      )}
    >
      <Checkbox
        checked={task.done}
        onCheckedChange={onToggle}
        className={cn(
          "h-5 w-5 rounded-full border-2 transition-colors",
          task.done 
            ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
            : "border-muted-foreground/40 hover:border-primary"
        )}
      />
      <span
        className={cn(
          "flex-1 text-sm leading-relaxed",
          task.done && "line-through text-muted-foreground"
        )}
      >
        {task.content}
      </span>
      {task.priority > 0 && !task.done && (
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs font-medium border-0 px-2.5 py-0.5",
            task.priority === 3 && "bg-destructive/15 text-destructive",
            task.priority === 2 && "bg-yellow-500/15 text-yellow-500",
            task.priority === 1 && "bg-green-500/15 text-green-500"
          )}
        >
          {priority.label}
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
