"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDateStore } from "@/store/date";

export function DateSelector() {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const setSelectedDate = useDateStore((state) => state.setSelectedDate);

  function shiftDate(days: number) {
    const nextDate = new Date(`${selectedDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate.toISOString().slice(0, 10));
  }

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <button type="button" onClick={() => shiftDate(-1)} className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <input
        type="date"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value)}
        className="bg-transparent text-sm font-medium text-slate-900 outline-none"
      />
      <button type="button" onClick={() => shiftDate(1)} className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
