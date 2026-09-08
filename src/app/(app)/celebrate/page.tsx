"use client";

import { useRouter } from "next/navigation";
import { Celebration } from "@/components/vault/Celebration";
import { useServerClock } from "@/hooks/useServerClock";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassCard } from "@/components/ui/Primitives";

export default function CelebratePage() {
  const router = useRouter();
  const { session } = useAuth();
  const clock = useServerClock();

  if (!clock.isUnlocked && session?.role !== "admin") {
    return (
      <GlassCard>
        <h1 className="font-serif text-3xl">Not yet</h1>
        <p className="mt-2 text-muted">Celebration waits for the server clock, not the device clock.</p>
      </GlassCard>
    );
  }

  return <Celebration open name={session?.recipientName} onClose={() => router.push("/vault")} />;
}
