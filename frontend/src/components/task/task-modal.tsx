"use client";

import { useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

type TaskModalProps = {
  isOpen: boolean;
  task: Task | null;
  selectedDate: string;
  onClose: () => void;
  onSave: (payload: { title: string; description: string; status: TaskStatus; priority: TaskPriority; due_date: string; tags: string[]; version?: number }) => Promise<void>;
};

const priorityOptions: TaskPriority[] = ["low", "medium", "high"];
const statusOptions: TaskStatus[] = ["todo", "in_progress", "done"];

export function TaskModal({ isOpen, task, selectedDate, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? selectedDate);
  const [tags, setTags] = useState(task?.tags.join(", ") ?? "");

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    await onSave({
      title,
      description,
      status,
      priority,
      due_date: dueDate,
      tags: parsedTags,
      version: task?.version,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4 rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">{task ? "Edit task" : "Add task"}</h2>
            <p className="text-sm text-slate-600">Task data is saved for the selected day.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600">
            Close
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input required value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Due date</span>
            <input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="design, urgent, backend" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
        </label>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
            Cancel
          </button>
          <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            Save task
          </button>
        </div>
      </form>
    </div>
  );
}
