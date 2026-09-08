"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function ParticleField() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stars = useMemo(
    () =>
      Array.from({ length: reduce ? 8 : 36 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 19) % 100}%`,
        delay: `${(i % 8) * 0.4}s`,
        size: i % 4 === 0 ? 3 : 1.5,
      })),
    [reduce],
  );

  if (!mounted) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-lavender/70"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animation: reduce ? undefined : `twinkle 4s ${star.delay} infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
