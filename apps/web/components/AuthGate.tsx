"use client";

import type { ReactNode } from "react";

import LoginDialog from "@/components/LoginDialog";
import { useAuth } from "@/hooks/useAuth";

/**
 * Renders the login modal until the session is authenticated; otherwise renders
 * the dashboard. While the auth state rehydrates from storage it shows nothing,
 * avoiding a flash of either the modal or the dashboard.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return null;
  }

  if (status !== "authed") {
    return <LoginDialog />;
  }

  return <>{children}</>;
}
