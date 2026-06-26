import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import NavLinks from "./NavLinks";

export default async function NavBar() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-accent"
        >
          DEV-TELEMETRY
          <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] font-normal tracking-widest text-accent/70">
            AI POWERED
          </span>
        </Link>

        <NavLinks isLoggedIn={!!session} />
      </div>
    </header>
  );
}
