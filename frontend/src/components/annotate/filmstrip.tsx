"use client";

import type { ImageRecord } from "@/types/annotation";

type FilmstripProps = {
  images: ImageRecord[];
  selectedId: number | null;
  onSelect: (image: ImageRecord) => void;
};

export function Filmstrip({ images, selectedId, onSelect }: FilmstripProps) {
  return (
    <div className="flex gap-3 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onSelect(image)}
          className={`flex shrink-0 flex-col overflow-hidden rounded-2xl border transition ${selectedId === image.id ? "border-slate-900" : "border-slate-200 hover:border-slate-400"}`}
        >
          <img src={image.image_url} alt="Uploaded annotation thumbnail" className="h-24 w-32 object-cover" />
          <span className="bg-slate-950 px-2 py-1 text-left text-[11px] text-white">{image.annotation_count} annotations</span>
        </button>
      ))}
    </div>
  );
}
