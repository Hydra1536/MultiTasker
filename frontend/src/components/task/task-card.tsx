"use client";

import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/types/task";

type TaskCardProps = {
  task: Task;
  onMove: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
};

const priorityStyles: Record<Task["priority"], string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-rose-200 bg-rose-50 text-rose-800",
};

export function TaskCard({ task, onMove, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { taskId: task.id },
  });

  const style = useMemo(
    () => ({
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    }),
    [transform],
  );

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(task)}
      className={`cursor-grab rounded-2xl border bg-slate-950 p-4 text-white shadow-sm transition active:cursor-grabbing ${isDragging ? "scale-[0.98] opacity-60" : "hover:-translate-y-0.5 hover:shadow-md"}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{task.title}</h3>
          <p className="mt-1 text-xs text-slate-300">Due {task.due_date}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMove(task, task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo");
          }}
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-white/10"
        >
          Move
        </button>
      </div>
      <p className="mt-3 text-sm text-slate-300 line-clamp-3">{task.description || "No description provided."}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${priorityStyles[task.priority]}`}>{task.priority}</span>
        {task.tags.length === 0 ? <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">No tags</span> : null}
        {task.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
