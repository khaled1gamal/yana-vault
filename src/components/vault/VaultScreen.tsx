"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/Primitives";
import { Countdown, GlowingLock } from "@/components/vault/VaultVisuals";
import { SealedMedia } from "@/components/vault/SealedMedia";
import { useServerClock } from "@/hooks/useServerClock";
import { formatManila } from "@/lib/time/unlock";
import { hapticPulse, playSealTone } from "@/lib/ui/feedback";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import type { FamilyMessage, Memory, StorageFileRef, VibeCheck } from "@/types/models";

type OpenMemory = Memory & { media?: Array<StorageFileRef & { url?: string }>; vibe?: VibeCheck | null };
type OpenFamily = FamilyMessage & { media?: Array<StorageFileRef & { url?: string }> };

export function VaultScreen() {
  const toast = useToast();
  const { session } = useAuth();
  const clock = useServerClock();
  const [feed, setFeed] = useState<{ memories: OpenMemory[]; familyMessages: OpenFamily[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clock.isUnlocked && session?.role !== "admin") return;
    void fetch("/api/vault/content?kind=unlocked-feed&id=all")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setFeed(json);
      })
      .catch(() => setError("Could not load unlocked memories just yet."));
  }, [clock.isUnlocked, session?.role]);

  const progress = clock.parts
    ? Math.min(99, Math.max(4, 100 - Math.min(100, clock.parts.days / 11)))
    : 8;

  if (!clock.isUnlocked && session?.role !== "admin") {
    return (
      <GlassCard
        className="min-h-[60vh] text-center"
        onClick={() => {
          hapticPulse();
          playSealTone();
          toast("Nice try! The vault is still sealed. 😉✨");
        }}
      >
        <GlowingLock unlocked={false} />
        <h1 className="mt-4 font-serif text-4xl">LOCKED</h1>
        <p className="mt-2 text-muted">
          Midnight, Asia/Manila, on your 18th. The frontend is just the velvet rope — the real lock lives on
          the server.
        </p>
        <p className="mt-2 text-sm text-lilac">
          {clock.unlockAt ? formatManila(clock.unlockAt, clock.session?.timezone) : "Unlock pending"}
        </p>
        {clock.parts ? (
          <div className="mt-6">
            <Countdown {...clock.parts} />
          </div>
        ) : null}
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full bg-gradient-to-r from-lilac to-pink" style={{ width: `${progress}%` }} />
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlowingLock unlocked />
      <h1 className="text-center font-serif text-4xl">Your vault is open</h1>
      {error ? <p className="text-rose-200">{error}</p> : null}
      {!feed ? <p className="text-muted">Opening sealed pages…</p> : null}
      {feed?.memories.map((memory) => (
        <GlassCard key={memory.id}>
          <p className="text-xs uppercase tracking-widest text-lilac">{memory.type}</p>
          <h2 className="font-serif text-3xl">{memory.title}</h2>
          {memory.caption ? <p className="mt-1 text-sm text-muted">{memory.caption}</p> : null}
          <p className="mt-2 whitespace-pre-wrap text-lavender/90">{memory.content}</p>
          <SealedMedia media={memory.media} vibe={memory.vibe} />
        </GlassCard>
      ))}
      {feed?.familyMessages.map((message) => (
        <GlassCard key={message.id}>
          <p className="text-xs uppercase tracking-widest text-pink">Family · {message.type}</p>
          <h2 className="font-serif text-3xl">{message.title}</h2>
          <p className="mt-2 whitespace-pre-wrap">{message.content}</p>
          <SealedMedia media={message.media} />
        </GlassCard>
      ))}
      {feed && feed.memories.length === 0 && feed.familyMessages.length === 0 ? (
        <GlassCard>
          <p>The door is open. The shelves are still waiting for more love.</p>
        </GlassCard>
      ) : null}
    </div>
  );
}
