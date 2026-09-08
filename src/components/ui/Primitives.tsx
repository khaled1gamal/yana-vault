"use client";

import { motion, useReducedMotion } from "framer-motion";

export function GlassCard({
  children,
  className = "",
  onClick,
  locked = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  locked?: boolean;
}) {
  const reduce = useReducedMotion();
  const inner = (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick && !reduce ? { scale: 0.98 } : undefined}
      className={`glass rounded-[1.6rem] p-5 ${locked ? "relative overflow-hidden" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (!onClick) return inner;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-12 rounded-full bg-gradient-to-r from-lilac via-pink to-lavender px-5 font-medium text-navy shadow-[0_0_24px_rgba(216,180,254,0.35)] disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-12 rounded-full border border-white/15 px-5 text-lavender disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-lavender/90">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      {error ? (
        <span role="alert" className="block text-sm text-rose-300">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 ${props.className ?? ""}`}
    />
  );
}

export function StatePanel({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <GlassCard className="text-center">
      <h2 className="font-serif text-3xl">{title}</h2>
      <p className="mt-2 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </GlassCard>
  );
}
