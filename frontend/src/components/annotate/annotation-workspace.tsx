"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { AnnotationRecord, ImageRecord } from "@/types/annotation";
import { Filmstrip } from "./filmstrip";
import { CanvasWorkspace } from "./canvas-workspace";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function readTokenCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function AnnotationWorkspace() {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    api.get<ImageRecord[]>("/api/annotations/images").then((data) => {
      setImages(data);
      setSelectedImage((current) => current ?? data[0] ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }
    api.get<AnnotationRecord[]>(`/api/annotations/images/${selectedImage.id}/annotations`).then(setAnnotations);
  }, [selectedImage]);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const accessToken = useAuthStore.getState().accessToken ?? readTokenCookie("mt_access_token");
    const response = await fetch(`${API_BASE}/api/annotations/images`, {
      method: "POST",
      body: formData,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    if (!response.ok) {
      return;
    }
    const created = (await response.json()) as ImageRecord;
    setImages((current) => [created, ...current]);
    setSelectedImage(created);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    setIsUploading(true);
    for (const file of files) {
      await uploadImage(file);
    }
    setIsUploading(false);
    event.target.value = "";
  }

  async function handleAddAnnotation(payload: { image: number; shape_type: "polygon"; points: Array<{ x: number; y: number }>; label: string }) {
    await api.post<AnnotationRecord>("/api/annotations/annotations", payload);
    if (selectedImage && selectedImage.id === payload.image) {
      const refreshed = await api.get<AnnotationRecord[]>(`/api/annotations/images/${selectedImage.id}/annotations`);
      setAnnotations(refreshed);
    }
  }

  async function handleDeleteAnnotation(annotationId: number) {
    await api.delete(`/api/annotations/annotations/${annotationId}`);
    if (selectedImage) {
      const refreshed = await api.get<AnnotationRecord[]>(`/api/annotations/images/${selectedImage.id}/annotations`);
      setAnnotations(refreshed);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600 shadow-sm">
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        {isUploading ? "Uploading images..." : "Click to upload one or more images for annotation"}
      </label>
      <Filmstrip images={images} selectedId={selectedImage?.id ?? null} onSelect={setSelectedImage} />
      <CanvasWorkspace image={selectedImage} annotations={selectedImage ? annotations : []} onAddAnnotation={handleAddAnnotation} onDeleteAnnotation={handleDeleteAnnotation} />
    </div>
  );
}
