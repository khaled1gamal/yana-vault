"use client";

import { useCallback, useEffect, useState } from "react";
import { remainingUntil } from "@/lib/time/unlock";
import { useAuth, type VaultSession } from "@/components/providers/AuthProvider";

export function useServerClock() {
  const { session, refreshSession } = useAuth();
  const [offsetMs, setOffsetMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [confirmed, setConfirmed] = useState<VaultSession | null>(session);

  const sync = useCallback(async () => {
    const next = await refreshSession();
    if (!next) return;
    setConfirmed(next);
    setOffsetMs(new Date(next.serverNowIso).getTime() - Date.now());
  }, [refreshSession]);

  useEffect(() => {
    void sync();
    const poll = window.setInterval(() => void sync(), 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void sync();
    };
    const onOnline = () => void sync();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [sync]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const serverNow = new Date(now + offsetMs);
  const unlockAt = confirmed?.unlockAtIso ? new Date(confirmed.unlockAtIso) : null;
  const parts = unlockAt ? remainingUntil(serverNow, unlockAt) : null;
  const locallyElapsed = Boolean(parts?.isUnlocked);
  const isUnlocked = Boolean(confirmed?.isUnlocked);

  useEffect(() => {
    if (locallyElapsed && confirmed && !confirmed.isUnlocked) {
      void sync();
    }
  }, [locallyElapsed, confirmed, sync]);

  return {
    session: confirmed,
    serverNow,
    unlockAt,
    parts,
    isUnlocked,
    sync,
  };
}
