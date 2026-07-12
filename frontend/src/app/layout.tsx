import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthNav } from "@/components/shared/auth-nav";

export const metadata: Metadata = {
  title: "MultiTasker",
  description: "Task management and image annotation workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-sm">
            <Link href="/tasks" className="font-semibold text-slate-950">
              MultiTasker
            </Link>
            <nav className="flex items-center gap-4 text-slate-600">
              <Link href="/tasks" className="transition hover:text-slate-950">
                Tasks
              </Link>
              <Link href="/annotate" className="transition hover:text-slate-950">
                Annotate
              </Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
