"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { StatePanel } from "@/components/ui/Primitives";
import type { UserRole } from "@/types/models";

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const router = useRouter();
  const { loading, session, configured } = useAuth();

  useEffect(() => {
    if (!loading && configured && !session) router.replace("/");
  }, [configured, loading, router, session]);

  if (!configured) {
    return (
      <StatePanel
        title="Firebase isn’t connected yet"
        body="Add the variables from .env.example to .env.local, then restart the app."
      />
    );
  }

  if (loading) {
    return <StatePanel title="Opening the vault…" body="Checking your session with the server." />;
  }

  if (!session) {
    return <StatePanel title="Please sign in" body="This room is private." />;
  }

  if (roles && !roles.includes(session.role)) {
    return (
      <StatePanel
        title="Permission denied"
        body="This screen is reserved for another role."
      />
    );
  }

  return <>{children}</>;
}
