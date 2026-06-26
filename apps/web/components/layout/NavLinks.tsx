"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "INÍCIO",  href: "/",              auth: false },
  { label: "PAINEL",  href: "/dashboard",     auth: true  },
  { label: "SETUP",   href: "/settings",      auth: true  },
  { label: "DOCS",    href: "/contributions", auth: false },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((l) => !l.auth || isLoggedIn);

  return (
    <nav aria-label="Navegação principal">
      <ul className="flex items-center gap-6">
        {links.map((link) => {
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
  );
}
