"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Menu, X } from "lucide-react";

import { signOut } from "@/lib/auth-client";
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
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const links = NAV_LINKS.filter((l) => !l.auth || isLoggedIn);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Desktop nav */}
      <nav aria-label="Navegação principal" className="hidden sm:block">
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

      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        className="flex sm:hidden items-center justify-center text-muted transition-colors hover:text-accent"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay menu */}
      {open && (
        <div className="fixed inset-0 top-[49px] z-40 flex flex-col bg-background sm:hidden border-t border-border">
          <nav aria-label="Navegação mobile" className="flex flex-col divide-y divide-border">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-6 py-5 font-mono text-sm tracking-wider transition-colors",
                    active ? "text-accent" : "text-muted hover:text-foreground",
                  )}
                >
                  {active && <span className="mr-2 text-accent">›</span>}
                  {link.label}
                </Link>
              );
            })}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 px-6 py-5 font-mono text-sm tracking-wider text-muted transition-colors hover:text-red-500"
              >
                <LogOut size={14} />
                SAIR
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
