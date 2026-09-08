"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { publicRecipientName } from "@/constants/capsule";

export function Celebration({
  open,
  name,
  onClose,
}: {
  open: boolean;
  name?: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [phase, setPhase] = useState<"unlocking" | "unlocked">("unlocking");

  useEffect(() => {
    if (!open) return;
    setPhase("unlocking");
    const t = window.setTimeout(() => setPhase("unlocked"), reduce ? 200 : 1600);
    return () => window.clearTimeout(t);
  }, [open, reduce]);

  useEffect(() => {
    if (!open || reduce) return;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors: ["#c4b5fd", "#f9a8d4", "#e9d5ff"] });
    });
    return () => {
      cancelled = true;
    };
  }, [open, reduce]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#07071a]/85 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="glass max-w-lg rounded-[2rem] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-lilac">
          {phase === "unlocking" ? "UNLOCKING" : "VAULT UNLOCKED"}
        </p>
        <h2 id="celebration-title" className="mt-3 font-serif text-4xl">
          Welcome to your 18th birthday vault
        </h2>
        <p className="mt-3 text-muted">
          {name || publicRecipientName()}, the seal lifted at midnight in Manila. Your memories are
          waiting — quietly, beautifully, all yours.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="min-h-12 rounded-full bg-gradient-to-r from-lilac to-pink px-5 text-navy"
            onClick={() => {
              onClose();
              router.push("/vault");
            }}
          >
            Open the vault
          </button>
          <button type="button" className="min-h-12 rounded-full border border-white/20 px-5" onClick={onClose}>
            Stay on this page
          </button>
        </div>
      </div>
    </div>
  );
}
