"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = { id: string; title: string; tone?: "ok" | "err" | "info" };

const ToastContext = createContext<(title: string, tone?: Toast["tone"]) => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((title: string, tone: Toast["tone"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, title, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              className={`pointer-events-auto glass max-w-md rounded-2xl px-4 py-3 text-sm ${
                toast.tone === "err" ? "text-rose-200" : toast.tone === "ok" ? "text-emerald-200" : "text-lavender"
              }`}
              role="status"
            >
              {toast.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
