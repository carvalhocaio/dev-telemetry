import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearToken,
  loadToken,
  msUntilMidnight,
  nextLocalMidnight,
  saveToken,
} from "@/lib/auth-storage";

const STORAGE_KEY = "dev-telemetry.auth";

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("nextLocalMidnight", () => {
  it("returns the start of the following local day", () => {
    const now = new Date(2026, 5, 9, 14, 30, 15, 500); // 2026-06-09 14:30 local
    const expected = new Date(2026, 5, 10, 0, 0, 0, 0).getTime();

    expect(nextLocalMidnight(now)).toBe(expected);
  });

  it("rolls over month and year boundaries", () => {
    const newYearsEve = new Date(2026, 11, 31, 23, 59, 0, 0);
    const expected = new Date(2027, 0, 1, 0, 0, 0, 0).getTime();

    expect(nextLocalMidnight(newYearsEve)).toBe(expected);
  });
});

describe("msUntilMidnight", () => {
  it("is the distance from now to the next local midnight", () => {
    const now = new Date(2026, 5, 9, 23, 0, 0, 0); // one hour before midnight
    const oneHour = 60 * 60 * 1000;

    expect(msUntilMidnight(now)).toBe(oneHour);
  });
});

describe("saveToken / loadToken", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 9, 12, 0, 0, 0));
  });

  it("persists a token and reads it back while still valid", () => {
    saveToken("super-secret");

    expect(loadToken()).toBe("super-secret");
  });

  it("stores an expiry at the next local midnight", () => {
    saveToken("super-secret");

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw ?? "{}") as { expiresAt: number };

    expect(parsed.expiresAt).toBe(new Date(2026, 5, 10, 0, 0, 0, 0).getTime());
  });

  it("returns null and clears the entry once midnight has passed", () => {
    saveToken("super-secret");

    vi.setSystemTime(new Date(2026, 5, 10, 0, 0, 1, 0)); // just after midnight

    expect(loadToken()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("loadToken with no or malformed data", () => {
  it("returns null when nothing is stored", () => {
    expect(loadToken()).toBeNull();
  });

  it("clears and returns null for non-JSON content", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json{");

    expect(loadToken()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears and returns null for a structurally invalid entry", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 1 }));

    expect(loadToken()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("clearToken", () => {
  it("removes a persisted token", () => {
    saveToken("super-secret");

    clearToken();

    expect(loadToken()).toBeNull();
  });
});
