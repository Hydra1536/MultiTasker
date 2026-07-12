"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

const ACCESS_TOKEN_COOKIE = "mt_access_token";
const REFRESH_TOKEN_COOKIE = "mt_refresh_token";

export function AuthNav() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const hydrateFromCookies = useAuthStore((state) => state.hydrateFromCookies);

  useEffect(() => {
    const entries = document.cookie.split("; ").reduce<Record<string, string>>((accumulator, entry) => {
      const [name, ...rest] = entry.split("=");
      if (!name || rest.length === 0) {
        return accumulator;
      }
      accumulator[name] = decodeURIComponent(rest.join("="));
      return accumulator;
    }, {});
    hydrateFromCookies(entries[ACCESS_TOKEN_COOKIE] ?? null, entries[REFRESH_TOKEN_COOKIE] ?? null);
  }, [hydrateFromCookies]);

  function handleLogout() {
    clearSession();
    document.cookie = "mt_access_token=; path=/; max-age=0; samesite=lax";
    document.cookie = "mt_refresh_token=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
    router.refresh();
  }

  return isAuthenticated ? (
    <button type="button" onClick={handleLogout} className="transition hover:text-slate-950">
      Logout
    </button>
  ) : (
    <Link href="/login" className="transition hover:text-slate-950">
      Sign in
    </Link>
  );
}
