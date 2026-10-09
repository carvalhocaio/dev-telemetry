import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SyncButton from "./SyncButton";

const mockTrigger = vi.fn();

vi.mock("@/hooks/useReportRefetch", () => ({
  useReportRefetch: () => ({
    trigger: mockTrigger,
  }),
}));

describe("SyncButton", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders Sync button with idle state", () => {
    render(<SyncButton />);
    const btn = screen.getByRole("button", { name: /Sync/i });
    expect(btn).toBeDefined();
    expect(screen.queryByText("Sincronizando…")).toBeNull();
  });

  it("sends since date scoped to active filter and does not show 'Sincronizando…' text", async () => {
    let capturedBody: { mode: string; since?: string } | null = null;

    global.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url === "/api/sync/start") {
        capturedBody = JSON.parse((opts?.body as string) || "{}");
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ jobId: "job-123", done: true }),
        } as unknown as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as unknown as Response);
    });

    render(<SyncButton since="2026-10-03" />);

    const btn = screen.getByRole("button", { name: /Sync/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockTrigger).toHaveBeenCalled();
    });

    expect(capturedBody).toBeDefined();
    expect(capturedBody?.mode).toBe("recent");
    expect(capturedBody?.since).toBeDefined();
    // Verify 2-day safety margin is included: 2026-10-03 - 2 days = 2026-10-01
    expect(capturedBody?.since).toContain("2026-10-01");

    // Text "Sincronizando…" should NOT be rendered
    expect(screen.queryByText("Sincronizando…")).toBeNull();
  });
});
