"use client";

import { create } from "zustand";

type DateState = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

const today = new Date();
const initialDate = today.toISOString().slice(0, 10);

export const useDateStore = create<DateState>((set) => ({
  selectedDate: initialDate,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
