"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

interface ReportRefetchValue {
  /** Registers the active report's refetch callback (called by Dashboard). */
  register: (refetch: () => void) => void;
  /** Triggers a refetch of the current report (called by the sync button). */
  trigger: () => void;
}

const ReportRefetchContext = createContext<ReportRefetchValue | null>(null);

/**
 * Bridges the sync button (in the header) and the report fetch (in Dashboard),
 * which are siblings under the gate. Dashboard registers its `refetch`; the sync
 * button triggers it after a successful sync — no prop drilling across the tree.
 */
export function ReportRefetchProvider({ children }: { children: ReactNode }) {
  const refetchRef = useRef<(() => void) | null>(null);

  const register = useCallback((refetch: () => void) => {
    refetchRef.current = refetch;
  }, []);

  const trigger = useCallback(() => {
    refetchRef.current?.();
  }, []);

  return (
    <ReportRefetchContext.Provider value={{ register, trigger }}>
      {children}
    </ReportRefetchContext.Provider>
  );
}

export function useReportRefetch(): ReportRefetchValue {
  const context = useContext(ReportRefetchContext);
  if (!context) {
    throw new Error(
      "useReportRefetch must be used within a ReportRefetchProvider",
    );
  }
  return context;
}
