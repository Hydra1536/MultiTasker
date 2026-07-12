"use client";

import { useMemo } from "react";
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./task-card";

type ColumnProps = {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onMove: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
};

const columns: Array<{ status: TaskStatus; title: string }> = [
  { status: "todo", title: "To Do" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

function Column({ status, title, tasks, onMove, onEdit }: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <section ref={setNodeRef} className={`rounded-[1.75rem] border p-4 transition ${isOver ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No tasks for this day yet. Add one.
          </div>
        ) : null}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMove={onMove} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

function DeleteDropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: "trash" });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[1.5rem] border-2 border-dashed px-4 py-5 text-center text-sm transition ${isOver ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-500"}`}
    >
      Drag here to delete a task
    </div>
  );
}

export function Board({ tasks, onMove, onEdit, onDelete }: { tasks: Task[]; onMove: (task: Task, status: TaskStatus) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void }) {
  const sensors = useSensors(useSensor(PointerSensor));

  const grouped = useMemo(() => {
    return columns.reduce<Record<TaskStatus, Task[]>>(
      (acc, column) => ({ ...acc, [column.status]: tasks.filter((task) => task.status === column.status) }),
      { todo: [], in_progress: [], done: [] },
    );
  }, [tasks]);

  function handleDragEnd(event: DragEndEvent) {
    const taskId = Number(event.active.data.current?.taskId);
    const overId = event.over?.id;
    if (!taskId || !overId) {
      return;
    }
    const dragged = tasks.find((task) => task.id === taskId);
    if (!dragged) {
      return;
    }
    if (overId === "trash") {
      onDelete(dragged);
      return;
    }
    const overStatus = overId as TaskStatus;
    if (dragged.status !== overStatus) {
      onMove(dragged, overStatus);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <Column key={column.status} status={column.status} title={column.title} tasks={grouped[column.status]} onMove={onMove} onEdit={onEdit} />
        ))}
      </div>
      <div className="mt-4">
        <DeleteDropZone />
      </div>
    </DndContext>
  );
}
