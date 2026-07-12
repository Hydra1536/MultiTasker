import Link from "next/link";
import { AuthForm } from "@/components/shared/auth-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_42%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)] px-4 py-12 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.7)]">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">MultiTasker</p>
              <h2 className="max-w-md text-4xl font-semibold leading-tight">A focused workspace for tasks and image annotations.</h2>
              <p className="max-w-md text-sm text-slate-300">
                Sign in to continue to the date-based board and annotation tools.
              </p>
            </div>
            <p className="mt-12 text-sm text-slate-400">
              New here? <Link href="/register" className="font-medium text-white underline underline-offset-4">Create an account</Link>
            </p>
          </section>
          <section className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <AuthForm mode="login" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
