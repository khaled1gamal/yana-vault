"use client";

import { useEffect, useMemo, useState } from "react";
import { getClientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { previewCounts } from "@/services/capsule";
import { GlassCard, PrimaryButton } from "@/components/ui/Primitives";
import { Countdown, GlowingLock } from "@/components/vault/VaultVisuals";
import { Celebration } from "@/components/vault/Celebration";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServerClock } from "@/hooks/useServerClock";
import { formatManila } from "@/lib/time/unlock";
import { hapticPulse, playSealTone } from "@/lib/ui/feedback";
import { useToast } from "@/components/ui/Toast";
import { Eye, Heart, Lock, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import type { VaultPreviewCounts } from "@/types/models";

export function DashboardScreen() {
  const toast = useToast();
  const { session } = useAuth();
  const clock = useServerClock();
  const [counts, setCounts] = useState<VaultPreviewCounts | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [wasLocked, setWasLocked] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !session) return;
    void previewCounts(getClientDb(), session.capsuleId)
      .then(setCounts)
      .catch(() => setCountError("Counts will appear once Firebase is connected."));
  }, [session]);

  useEffect(() => {
    if (clock.isUnlocked && wasLocked && clock.session) {
      setCelebrate(true);
    }
    setWasLocked(!clock.isUnlocked);
  }, [clock.isUnlocked, clock.session, wasLocked]);

  const unlockLabel = useMemo(
    () => (clock.unlockAt ? formatManila(clock.unlockAt, clock.session?.timezone) : "Unlock date pending"),
    [clock.unlockAt, clock.session?.timezone],
  );

  function denySeal() {
    hapticPulse();
    playSealTone();
    toast("Nice try! The vault is still sealed. 😉✨", "info");
  }

  return (
    <div className="space-y-5">
      <section className="glass relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink">
          <Sparkles size={14} className="animate-pulse" />
          <span>Private Capsule for {session?.recipientName || "Yana"}</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
          A private vault for the girl you’re becoming.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-lavender/80 md:text-base">
          Letters, photos, voice notes, and family love stay locked until your 18th birthday at midnight,
          Asia/Manila. Not even a sneaky time-change can open it.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="flex flex-col justify-between">
          <div>
            <GlowingLock unlocked={clock.isUnlocked} />
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-lilac">
              {clock.isUnlocked ? (
                <>
                  <Sparkles size={14} className="text-glow" />
                  <span className="text-glow">UNLOCKED</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-lilac" />
                  <span>SEALED & LOCKED</span>
                </>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-muted">{unlockLabel}</p>
          </div>
          {clock.parts && !clock.isUnlocked ? (
            <div className="mt-5">
              <Countdown {...clock.parts} />
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl md:text-3xl text-white">Digital Vault</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-lilac">
                {session?.role || "guest"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Memories" value={counts?.totalMemories} />
              <Stat label="Photos" value={counts?.photos} />
              <Stat label="Voice notes" value={counts?.voices} />
              <Stat label="Days remaining" value={clock.parts?.days} />
            </div>
            {countError ? <p className="mt-3 text-xs text-rose-200">{countError}</p> : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/deposit" className="flex-1 min-w-[140px]">
              <PrimaryButton className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                <Plus size={16} />
                <span>Deposit Memory</span>
              </PrimaryButton>
            </Link>
            <Link
              href="/family"
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-medium text-lavender transition hover:bg-white/10 active:scale-95 sm:text-sm"
            >
              <Users size={16} className="text-pink" />
              <span>Family Corner</span>
            </Link>
            <Link
              href="/preview"
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-medium text-lavender transition hover:bg-white/10 active:scale-95 sm:text-sm"
            >
              <Eye size={16} className="text-lilac" />
              <span>Preview</span>
            </Link>
          </div>
        </GlassCard>
      </div>

      <GlassCard
        locked
        onClick={clock.isUnlocked ? undefined : denySeal}
        className="cursor-pointer transition hover:border-lilac/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lilac">
              <Heart size={18} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-white">Recent Activity & Vault Status</h2>
              <p className="text-xs text-muted">Click to inspect status</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">
            🔒 Sealed
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Deposits are safely timestamped and encrypted in the cloud. The words, photos, and voice notes remain
          locked until the moment the server turns to midnight on her 18th birthday.
        </p>
      </GlassCard>

      <Celebration
        open={celebrate}
        name={session?.recipientName}
        onClose={() => setCelebrate(false)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="text-2xl font-medium">{value ?? "—"}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
