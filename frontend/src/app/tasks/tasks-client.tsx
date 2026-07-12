"use client";

import { useEffect, useState } from "react";
import { DateSelector } from "@/components/shared/date-selector";
import { Board } from "@/components/task/board";
import { TaskModal } from "@/components/task/task-modal";
import { api } from "@/lib/api";
import { useDateStore } from "@/store/date";
import type { Task } from "@/types/task";

export function TasksClient() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    api.get<Task[]>(`/api/tasks/?due_date=${selectedDate}`).then(setTasks).catch(() => setTasks([]));
  }, [selectedDate]);

  async function loadTasks() {
    const data = await api.get<Task[]>(`/api/tasks/?due_date=${selectedDate}`);
    setTasks(data);
  }

  async function handleSaveTask(payload: { title: string; description: string; status: Task["status"]; priority: Task["priority"]; due_date: string; tags: string[]; version?: number }) {
    if (editingTask) {
      await api.patch<Task>(`/api/tasks/${editingTask.id}`, payload);
      setEditingTask(null);
      await loadTasks();
      return;
    }

    await api.post<Task>("/api/tasks/", payload);
    setIsAddOpen(false);
    await loadTasks();
  }

  async function handleMoveTask(task: Task, status: Task["status"]) {
    await api.patch<Task>(`/api/tasks/${task.id}`, {
      title: task.title,
      description: task.description,
      status,
      priority: task.priority,
      due_date: task.due_date,
      tags: task.tags,
      version: task.version,
    });
    await loadTasks();
  }

  async function handleDeleteTask(task: Task) {
    await api.delete(`/api/tasks/${task.id}`);
    await loadTasks();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc,_#e2e8f0)] px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Tasks</p>
            <h1 className="mt-2 text-3xl font-semibold">Date-based board</h1>
            <p className="mt-2 text-sm text-slate-600">Move work across columns for the selected date.</p>
          </div>
          <div className="flex items-center gap-3">
            <DateSelector />
            <button type="button" onClick={() => setIsAddOpen(true)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Add task
            </button>
          </div>
        </header>
        <Board
          tasks={tasks}
          onMove={handleMoveTask}
          onEdit={(task) => setEditingTask(task)}
          onDelete={handleDeleteTask}
        />
        <TaskModal
          key={editingTask?.id ?? `new-${selectedDate}`}
          isOpen={isAddOpen || editingTask !== null}
          task={editingTask}
          selectedDate={selectedDate}
          onClose={() => {
            setIsAddOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
        />
      </div>
    </main>
  );
}