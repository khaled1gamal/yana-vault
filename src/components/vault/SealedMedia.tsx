"use client";

import type { StorageFileRef, VibeCheck } from "@/types/models";

export function SealedMedia({
  media,
  vibe,
}: {
  media?: Array<StorageFileRef & { url?: string }>;
  vibe?: VibeCheck | null;
}) {
  const photos = (media ?? []).filter((file) => file.contentType.startsWith("image/") && file.url);
  const audio = (media ?? []).filter((file) => file.contentType.startsWith("audio/") && file.url);

  return (
    <div className="mt-4 space-y-4">
      {photos.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((file) => (
            <div key={file.fileId} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt=""
                className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      ) : null}
      {audio.map((file) => (
        <div key={file.fileId} className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-pink">Voice Recording</p>
          <audio controls className="w-full" src={file.url} />
        </div>
      ))}
      {vibe ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-lilac">Vibe Check 2026 Snapshot</h3>
          <dl className="grid gap-2.5 sm:grid-cols-2 text-xs">
            {Object.entries(vibe).map(([key, value]) =>
              value ? (
                <div key={key} className="rounded-xl bg-black/20 p-3 border border-white/5">
                  <dt className="text-pink font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                  </dt>
                  <dd className="mt-1 text-lavender/90 leading-relaxed font-sans">{value}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
