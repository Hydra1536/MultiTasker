"use client";

import { create } from "zustand";
import type { AuthSession, AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  hydrateFromCookies: (accessToken: string | null, refreshToken: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setSession: (session) => set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken, isAuthenticated: true }),
  hydrateFromCookies: (accessToken, refreshToken) => set({ accessToken, refreshToken, isAuthenticated: Boolean(accessToken && refreshToken) }),
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
}));
