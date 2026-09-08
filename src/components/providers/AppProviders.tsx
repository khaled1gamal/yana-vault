"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ParticleField } from "@/components/ui/ParticleField";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ParticleField />
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
