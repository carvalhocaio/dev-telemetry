import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const webApp = resolve(here, "../../apps/web/app");

function read(rel: string): string {
  return readFileSync(resolve(webApp, rel), "utf8");
}

/**
 * Smoke tests for the Phase 3 route restructure:
 *   /            -> public landing
 *   /dashboard   -> authenticated dashboard
 *   /contributions -> public contributions guide
 *
 * Static source checks only — no Next.js runtime, no DB, no network.
 */
describe("smoke — public routes & restructure", () => {
  it("landing page exists at app/page.tsx", () => {
    expect(existsSync(resolve(webApp, "page.tsx"))).toBe(true);
  });

  it("dashboard page exists at app/dashboard/page.tsx", () => {
    expect(existsSync(resolve(webApp, "dashboard/page.tsx"))).toBe(true);
  });

  it("contributions page exists at app/contributions/page.tsx", () => {
    expect(existsSync(resolve(webApp, "contributions/page.tsx"))).toBe(true);
  });

  it("dashboard guards session and config redirects", () => {
    const src = read("dashboard/page.tsx");
    expect(src).toContain('redirect("/login")');
    expect(src).toContain('redirect("/settings")');
  });

  it("landing is public — no auth redirect", () => {
    const src = read("page.tsx");
    expect(src).not.toContain("redirect(");
    // CTA uses ternary: session ? "/dashboard" : "/login"
    expect(src).toContain('"/dashboard"');
    expect(src).toContain('"/login"');
  });

  it("login redirects to /dashboard after OAuth", () => {
    const src = read("login/page.tsx");
    expect(src).toContain('callbackURL: "/dashboard"');
    // "saiba mais" link points to the landing
    expect(src).toContain('href="/"');
  });

  it("settings links back to /dashboard", () => {
    const src = read("settings/page.tsx");
    expect(src).toContain('"/dashboard"');
  });

  it("contributions page exports metadata", () => {
    const src = read("contributions/page.tsx");
    expect(src).toContain("export const metadata");
    expect(src).toContain("Metadata");
  });
});
