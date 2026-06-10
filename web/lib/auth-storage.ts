/**
 * Browser-side persistence for the API password.
 *
 * The token (the API password typed in the login modal) is stored in
 * `localStorage` together with an absolute expiry set to the next local
 * midnight, so a session resets at 00:00 browser-local time rather than after a
 * fixed 24h window. Every function is a no-op / null under SSR (`window`
 * undefined) and the helpers below are pure so they can be unit tested with a
 * mocked `Date` / `localStorage`.
 */

const STORAGE_KEY = "dev-telemetry.auth";

interface StoredToken {
  token: string;
  expiresAt: number;
}

/** Timestamp (ms) of the next local 00:00 — i.e. the start of tomorrow. */
export function nextLocalMidnight(now: Date = new Date()): number {
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return midnight.getTime();
}

/** Milliseconds remaining until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  return nextLocalMidnight(now) - now.getTime();
}

/** Persists the token with an expiry at the next local midnight. */
export function saveToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const payload: StoredToken = { token, expiresAt: nextLocalMidnight() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Returns the stored token if it is still valid, otherwise clears it and
 * returns `null`. Malformed entries are treated as absent and cleared.
 */
export function loadToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearToken();
    return null;
  }

  if (!isStoredToken(parsed) || Date.now() >= parsed.expiresAt) {
    clearToken();
    return null;
  }

  return parsed.token;
}

/** Removes the persisted token. */
export function clearToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

function isStoredToken(value: unknown): value is StoredToken {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredToken).token === "string" &&
    typeof (value as StoredToken).expiresAt === "number"
  );
}
