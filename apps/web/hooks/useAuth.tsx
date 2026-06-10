"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  clearToken,
  loadToken,
  msUntilMidnight,
  saveToken,
} from "@/lib/auth-storage";

type AuthStatus = "loading" | "authed" | "anonymous";

interface AuthContextValue {
  /** The API password, or `null` while loading / locked. */
  token: string | null;
  status: AuthStatus;
  /** Optional message shown in the login modal (e.g. after auto-lock). */
  reason: string | null;
  login: (token: string) => void;
  logout: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the API password in memory and mirrors it to `localStorage`. On mount it
 * rehydrates from storage (if still valid) and schedules an automatic lock at
 * the next local midnight. The token is shared with data hooks via `useAuth` so
 * it never needs to be drilled through props.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [reason, setReason] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const logout = useCallback(
    (nextReason?: string) => {
      clearTimer();
      clearToken();
      setToken(null);
      setReason(nextReason ?? null);
      setStatus("anonymous");
    },
    [clearTimer],
  );

  const scheduleAutoLock = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      logout("Sessão expirada");
    }, msUntilMidnight());
  }, [clearTimer, logout]);

  const login = useCallback(
    (nextToken: string) => {
      saveToken(nextToken);
      setToken(nextToken);
      setReason(null);
      setStatus("authed");
      scheduleAutoLock();
    },
    [scheduleAutoLock],
  );

  useEffect(() => {
    // Rehydrate from localStorage (an external store) on mount. Reading storage
    // is only possible client-side, so the initial render is always "loading"
    // and this effect resolves it once — a legitimate external-system sync.
    const stored = loadToken();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(stored);
      setStatus("authed");
      scheduleAutoLock();
    } else {
      setStatus("anonymous");
    }
    return clearTimer;
  }, [scheduleAutoLock, clearTimer]);

  return (
    <AuthContext.Provider value={{ token, status, reason, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
