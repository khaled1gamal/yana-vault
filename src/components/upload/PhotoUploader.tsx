"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { compressImageIfNeeded } from "@/lib/storage/upload";
import { validateImageFile } from "@/lib/validation/schemas";
import { DEFAULT_MAX_IMAGE_BYTES, DEFAULT_MAX_PHOTOS_PER_MEMORY } from "@/constants/capsule";

export interface LocalPhoto {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

export function PhotoUploader({
  photos,
  setPhotos,
  maxBytes = DEFAULT_MAX_IMAGE_BYTES,
}: {
  photos: LocalPhoto[];
  setPhotos: (photos: LocalPhoto[]) => void;
  maxBytes?: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function addFiles(list: FileList | File[]) {
    setError(null);
    const next = [...photos];
    for (const original of Array.from(list)) {
      if (next.length >= DEFAULT_MAX_PHOTOS_PER_MEMORY) {
        setError(`Keep it to ${DEFAULT_MAX_PHOTOS_PER_MEMORY} photos.`);
        break;
      }
      const file = await compressImageIfNeeded(original);
      const invalid = validateImageFile(file, maxBytes);
      if (invalid) {
        setError(invalid);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        caption: "",
      });
    }
    setPhotos(next);
  }

  function move(id: string, dir: -1 | 1) {
    const index = photos.findIndex((p) => p.id === id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= photos.length) return;
    const copy = [...photos];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item!);
    setPhotos(copy);
  }

  const empty = useMemo(() => photos.length === 0, [photos.length]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center rounded-[1.6rem] border-2 border-dashed p-6 text-center transition-all ${
          dragging
            ? "border-pink bg-pink/10 shadow-[0_0_25px_rgba(249,168,212,0.25)]"
            : "border-white/20 bg-white/5 hover:border-lilac/50 hover:bg-white/[0.07]"
        }`}
      >
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lilac">
          <UploadCloud size={24} />
        </div>
        <p className="text-sm font-medium text-lavender">Drag & drop photos here or browse files</p>
        <p className="mt-1 text-xs text-muted">
          Supports JPEG, PNG, WEBP, HEIC · Max {Math.round(maxBytes / (1024 * 1024))}MB each · Up to {DEFAULT_MAX_PHOTOS_PER_MEMORY} photos
        </p>
        <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95">
          <ImagePlus size={16} />
          <span>Choose photos</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {!empty && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{photos.length} of {DEFAULT_MAX_PHOTOS_PER_MEMORY} photos added</span>
          <span>Reorder or add captions below</span>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-md transition hover:border-white/25"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.preview} alt="" className="h-36 w-full object-cover" />
            <div className="space-y-2 p-3">
              <input
                value={photo.caption}
                placeholder="Add caption..."
                aria-label={`Caption for photo ${index + 1}`}
                className="min-h-9 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-white placeholder:text-white/40 focus:border-lilac/60 focus:outline-none"
                onChange={(e) =>
                  setPhotos(photos.map((p) => (p.id === photo.id ? { ...p, caption: e.target.value } : p)))
                }
              />
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(photo.id, -1)}
                    disabled={index === 0}
                    aria-label="Move photo up"
                    title="Move previous"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-lavender transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(photo.id, 1)}
                    disabled={index === photos.length - 1}
                    aria-label="Move photo down"
                    title="Move next"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-lavender transition hover:bg-white/20 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Delete photo"
                  title="Remove this photo"
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
                  onClick={() => {
                    URL.revokeObjectURL(photo.preview);
                    setPhotos(photos.filter((p) => p.id !== photo.id));
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
