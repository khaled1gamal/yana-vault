"use client";

import { motion, useReducedMotion } from "framer-motion";

export function Countdown({
  days,
  hours,
  minutes,
  seconds,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}) {
  const cells = [
    ["Days", days],
    ["Hours", hours],
    ["Minutes", minutes],
    ["Seconds", seconds],
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2" aria-live="polite">
      {cells.map(([label, value]) => (
        <div key={label} className="glass rounded-2xl px-1 py-3 text-center">
          <div className="font-serif text-2xl md:text-4xl">{String(value).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function GlowingLock({ unlocked }: { unlocked: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="glow-lock mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-lilac/40 bg-white/5 text-5xl"
      animate={reduce ? undefined : unlocked ? { scale: [1, 1.08, 1] } : { rotate: [0, -6, 6, 0] }}
      transition={{ repeat: Infinity, duration: unlocked ? 2.4 : 3.4 }}
      aria-hidden
    >
      {unlocked ? "✨" : "🔒"}
    </motion.div>
  );
}
