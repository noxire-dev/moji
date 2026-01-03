"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import * as api from "@/lib/api";
import { useTasks } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";

interface TaskListProps {
  workspaceId: string;
  isDemo?: boolean;
}

const priorityConfig = {
  0: { label: "None", color: "text-muted-foreground", border: "border-l-muted" },
  1: { label: "Low", color: "text-priority-low", border: "border-l-priority-low" },
  2: { label: "Medium", color: "text-priority-medium", border: "border-l-priority-medium" },
  3: { label: "High", color: "text-priority-high", border: "border-l-priority-high" },
};

export const TaskList = memo(function TaskList({ workspaceId, isDemo = false }: TaskListProps) {
  const { tasks, isLoading, mutate } = useTasks(workspaceId, isDemo);
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState(0);
  // Local state for demo mode mutations
  const [localTasks, setLocalTasks] = useState<api.Task[] | null>(null);

  // Use local tasks for demo mode, SWR tasks otherwise
  const displayTasks = isDemo && localTasks ? localTasks : tasks;

  // Initialize local tasks from SWR data for demo mode
  if (isDemo && localTasks === null && tasks.length > 0) {
    setLocalTasks(tasks);
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
      setLocalTasks([...(localTasks || tasks), newTask]);
      setNewContent("");
      setNewPriority(0);
      return;
    }

    try {
      const task = await api.createTask(workspaceId, {
        content: newContent.trim(),
        priority: newPriority,
      });
      mutate([...tasks, task], false);
      setNewContent("");
      setNewPriority(0);
    } catch (err) {
      console.error("Failed to create task:", err);
      toast.error("Failed to create task");
    }
  }

  async function handleToggle(taskId: string) {
    if (isDemo) {
      setLocalTasks((localTasks || tasks).map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ));
      return;
    }

    try {
      const updated = await api.toggleTask(taskId);
      mutate(tasks.map((t) => (t.id === taskId ? updated : t)), false);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      toast.error("Failed to update task");
    }
  }

  async function handleDelete(taskId: string) {
    if (isDemo) {
      setLocalTasks((localTasks || tasks).filter((t) => t.id !== taskId));
      return;
    }

    try {
      await api.deleteTask(taskId);
      mutate(tasks.filter((t) => t.id !== taskId), false);
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error("Failed to delete task");
    }
  }

  const incompleteTasks = useMemo(
    () => displayTasks.filter((t) => !t.done).sort((a, b) => b.priority - a.priority),
    [displayTasks]
  );
  const completedTasks = useMemo(
    () => displayTasks.filter((t) => t.done),
    [displayTasks]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
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
          <CompletedHeader completedTasks={completedTasks} />
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
      {displayTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No tasks yet. Add one above!</p>
        </div>
      )}
    </div>
  );
});

const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: api.Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const priority = useMemo(
    () => priorityConfig[task.priority as keyof typeof priorityConfig],
    [task.priority]
  );

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
        task.done
          ? "bg-muted/30 border-transparent opacity-75"
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
      {task.priority > 0 && (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium border-0 px-2.5 py-0.5 transition-opacity",
            !task.done && task.priority === 3 && "bg-destructive/15 text-destructive",
            !task.done && task.priority === 2 && "bg-yellow-500/15 text-yellow-500",
            !task.done && task.priority === 1 && "bg-green-500/15 text-green-500",
            task.done && task.priority === 3 && "bg-destructive/8 text-destructive/60",
            task.done && task.priority === 2 && "bg-yellow-500/8 text-yellow-500/60",
            task.done && task.priority === 1 && "bg-green-500/8 text-green-500/60"
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
});

const CompletedHeader = memo(function CompletedHeader({ completedTasks }: { completedTasks: api.Task[] }) {
  const { lowCount, mediumCount, highCount, hasPriorityCounts } = useMemo(() => {
    const low = completedTasks.filter((t) => t.priority === 1).length;
    const medium = completedTasks.filter((t) => t.priority === 2).length;
    const high = completedTasks.filter((t) => t.priority === 3).length;
    return {
      lowCount: low,
      mediumCount: medium,
      highCount: high,
      hasPriorityCounts: low > 0 || medium > 0 || high > 0,
    };
  }, [completedTasks]);

  return (
    <div className="flex items-center gap-3 mb-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Completed ({completedTasks.length})
      </h4>
      {hasPriorityCounts && (
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-destructive/10 text-destructive/70">
              High {highCount}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500/70">
              Med {mediumCount}
            </span>
          )}
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-500/70">
              Low {lowCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
});
