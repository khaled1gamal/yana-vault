"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { listMemoryIndex, previewCounts } from "@/services/capsule";
import { hapticPulse, playSealTone } from "@/lib/ui/feedback";
import { useToast } from "@/components/ui/Toast";
import type { MemoryIndex, VaultPreviewCounts } from "@/types/models";

export function PreviewScreen() {
  const toast = useToast();
  const { session } = useAuth();
  const [counts, setCounts] = useState<VaultPreviewCounts | null>(null);
  const [items, setItems] = useState<MemoryIndex[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !isFirebaseConfigured()) return;
    const db = getClientDb();
    Promise.all([previewCounts(db, session.capsuleId), listMemoryIndex(db, session.capsuleId)])
      .then(([nextCounts, nextItems]) => {
        setCounts(nextCounts);
        setItems(nextItems);
      })
      .catch(() => setError("Preview metadata could not be loaded."));
  }, [session]);

  function tease() {
    hapticPulse();
    playSealTone();
    toast("Nice try! The vault is still sealed. 😉✨");
  }

  const teasers = [
    { label: "Letters", value: counts?.letters, icon: "✉️" },
    { label: "Photos", value: counts?.photos, icon: "📷" },
    { label: "Voice memories", value: counts?.voices, icon: "🎙️" },
    { label: "Vibe checks", value: counts?.vibes, icon: "💫" },
    { label: "Family messages", value: counts?.familyMessages, icon: "💌" },
  ];

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="font-serif text-4xl">Vault preview</h1>
        <p className="mt-2 text-muted">
          Only safe counts and mystery cards. Sealed letters, photos, and audio never travel to this
          browser until the server says the vault is open.
        </p>
      </GlassCard>
      {error ? <p className="text-rose-300">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {teasers.map((item) => (
          <GlassCard key={item.label} locked onClick={tease}>
            <div className="text-2xl" aria-hidden>
              {item.icon}
            </div>
            <p className="mt-2 text-sm text-muted">🔒 {item.value ?? "—"} {item.label}</p>
          </GlassCard>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <GlassCard key={item.id} locked onClick={tease}>
            <p className="text-xs uppercase tracking-[0.2em] text-lilac">Sealed {item.type}</p>
            <div className="mt-3 h-16 rounded-2xl bg-white/5 blur-sm" aria-hidden />
            <p className="mt-3 text-muted">Mystery title · closed envelope</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
