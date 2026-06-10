"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSession } from "@/lib/auth-client";

/** Client-side safety net: redirects to /login if the session disappears (e.g. expiry during a long tab open). */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session) return null;
  return <>{children}</>;
}
