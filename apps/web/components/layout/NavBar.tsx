"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "INÍCIO", href: "/" },
  { label: "PAINEL", href: "/dashboard" },
  { label: "SETUP", href: "/settings" },
  { label: "DOCS", href: "/contributions" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-widest text-accent"
        >
          DEV-TELEMETRY
        </Link>

        <nav aria-label="Navegação principal">
          <ul className="flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "font-mono text-xs tracking-wider transition-colors hover:text-foreground",
                      active
                        ? "text-accent underline decoration-accent underline-offset-4"
                        : "text-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
