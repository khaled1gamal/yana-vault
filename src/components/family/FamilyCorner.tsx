"use client";

import { useEffect, useState } from "react";
import { DepositWizard } from "@/components/memories/DepositWizard";
import { GlassCard } from "@/components/ui/Primitives";
import { SealedMedia } from "@/components/vault/SealedMedia";
import { useAuth } from "@/components/providers/AuthProvider";
import type { FamilyMessage, StorageFileRef } from "@/types/models";

type OwnMessage = FamilyMessage & { media?: Array<StorageFileRef & { url?: string }> };

export function FamilyCorner() {
  const { session } = useAuth();
  const [items, setItems] = useState<OwnMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    if (session.role !== "family" && session.role !== "admin") return;
    void fetch("/api/vault/content?kind=own-family-feed&id=mine")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setItems(json.familyMessages ?? []);
      })
      .catch(() => setError("Could not load your family notes."));
  }, [session]);

  return (
    <div className="space-y-4">
      <GlassCard>
        <h1 className="font-serif text-4xl">Family Corner</h1>
        <p className="mt-2 text-muted">
          Birthday letters, advice, and voice hugs stay sealed from her until midnight. You can reopen your
          own contributions — never hers.
        </p>
      </GlassCard>
      {session?.role === "recipient" ? (
        <GlassCard>
          <p>Family messages unlock with the vault. Until then, only a teaser lives in Preview.</p>
        </GlassCard>
      ) : (
        <DepositWizard family />
      )}
      {error ? <p className="text-rose-300">{error}</p> : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <GlassCard key={item.id}>
            <p className="text-xs uppercase tracking-widest text-pink">{item.type}</p>
            <h2 className="font-serif text-2xl">{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-lavender/90">{item.content}</p>
            <SealedMedia media={item.media} />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
