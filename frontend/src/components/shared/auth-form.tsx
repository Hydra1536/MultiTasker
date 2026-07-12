"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthFormMode, AuthResponse } from "@/types/auth";
import { useAuthStore } from "@/store/auth";

type AuthFormProps = {
  mode: AuthFormMode;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { email, password, password_confirmation: passwordConfirmation }
            : { email, password },
        ),
      });

      const payload = (await response.json()) as AuthResponse | { detail?: string; non_field_errors?: string[]; password_confirmation?: string[] };
      if (!response.ok) {
        const message =
          "detail" in payload && payload.detail
            ? payload.detail
            : "non_field_errors" in payload && payload.non_field_errors?.[0]
              ? payload.non_field_errors[0]
              : "password_confirmation" in payload && payload.password_confirmation?.[0]
                ? payload.password_confirmation[0]
                : "Unable to authenticate.";
        throw new Error(message);
      }

      const authPayload = payload as AuthResponse;
      setSession({ user: authPayload.user, accessToken: authPayload.access, refreshToken: authPayload.refresh });
      document.cookie = `mt_access_token=${authPayload.access}; path=/; max-age=${60 * 15}; samesite=lax`;
      document.cookie = `mt_refresh_token=${authPayload.refresh}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      router.replace("/tasks");
      router.refresh();
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.3)] backdrop-blur">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-950">{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="text-sm text-slate-600">
          {isRegister ? "Use your email and a strong password to get started." : "Welcome back. Continue to your task board."}
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
        />
      </label>

      {isRegister ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Confirm password</span>
          <input
            type="password"
            required
            minLength={8}
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </label>
      ) : null}

      {errorMessage ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
