"use client";

import { useMemo, useState } from "react";
import type { AnnotationPoint, AnnotationRecord, ImageRecord } from "@/types/annotation";

type CanvasWorkspaceProps = {
  image: ImageRecord | null;
  annotations: AnnotationRecord[];
  onAddAnnotation: (annotation: { image: number; shape_type: "polygon"; points: AnnotationPoint[]; label: string }) => Promise<void>;
  onDeleteAnnotation: (annotationId: number) => Promise<void>;
};

export function CanvasWorkspace({ image, annotations, onAddAnnotation, onDeleteAnnotation }: CanvasWorkspaceProps) {
  const [points, setPoints] = useState<AnnotationPoint[]>([]);
  const [label, setLabel] = useState("");
  const imageUrl = image?.image_url ?? "";

  const pointList = useMemo(() => points.map((point) => `${point.x},${point.y}`).join(" "), [points]);

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!image) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPoints((current) => [...current, { x, y }]);
  }

  function handleUndoPoint() {
    setPoints((current) => current.slice(0, -1));
  }

  function handleClear() {
    setPoints([]);
  }

  async function handleSave() {
    if (!image || points.length < 3) {
      return;
    }
    await onAddAnnotation({ image: image.id, shape_type: "polygon", points, label });
    setPoints([]);
    setLabel("");
  }

  return (
    <section className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div onClick={handleCanvasClick} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950">
          {image ? <img src={imageUrl} alt="Selected annotation image" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Upload and select an image to begin.</div>}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {annotations.map((annotation) => (
              <polygon
                key={annotation.id}
                points={annotation.points.map((point) => `${point.x},${point.y}`).join(" ")}
                className="fill-cyan-500/20 stroke-cyan-300 stroke-2"
              />
            ))}
            {points.length > 2 ? <polygon points={pointList} className="fill-amber-500/20 stroke-amber-300 stroke-2" /> : null}
            {points.length > 0 ? <polyline points={pointList} className="fill-none stroke-amber-300 stroke-2" /> : null}
          </svg>
        </div>
        <p className="text-sm text-slate-600">Click on the image to add polygon points. Add at least three points before saving.</p>
      </div>
      <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Label</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none" />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={handleUndoPoint} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            Undo
          </button>
          <button type="button" onClick={handleClear} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
            Clear
          </button>
          <button type="button" onClick={handleSave} className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Saved polygons</h3>
          {annotations.length === 0 ? <p className="text-sm text-slate-500">No saved polygons yet.</p> : null}
          {annotations.map((annotation) => (
            <button key={annotation.id} type="button" onClick={() => void onDeleteAnnotation(annotation.id)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-rose-300 hover:text-rose-700">
              <span>{annotation.label || "Untitled polygon"}</span>
              <span>Delete</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
