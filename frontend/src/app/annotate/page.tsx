import { requireAuth } from "@/components/shared/auth-guard";
import { AnnotationWorkspace } from "@/components/annotate/annotation-workspace";

export default async function AnnotatePage() {
  await requireAuth();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc,_#e2e8f0)] px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Annotate</p>
          <h1 className="mt-2 text-3xl font-semibold">Polygon annotation workspace</h1>
          <p className="mt-2 text-sm text-slate-600">Upload an image, select it from the filmstrip, and draw polygons point by point.</p>
        </header>
        <AnnotationWorkspace />
      </div>
    </main>
  );
}
