import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockDbSelect = vi.fn();
const mockDbUpdate = vi.fn();
const mockDecrypt = vi.fn();
const mockStartSyncJob = vi.fn();
const mockRunBackfillBatch = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("@dev-telemetry/db/client", () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    update: (...args: unknown[]) => mockDbUpdate(...args),
  },
}));

vi.mock("@/lib/app-crypto", () => ({
  appCrypto: {
    decrypt: (...args: unknown[]) => mockDecrypt(...args),
    encrypt: vi.fn(),
  },
}));

vi.mock("@dev-telemetry/github", () => ({
  createOctokit: vi.fn(),
  startSyncJob: (...args: unknown[]) => mockStartSyncJob(...args),
  runBackfillBatch: (...args: unknown[]) => mockRunBackfillBatch(...args),
}));

// Import app after mocks are set up
import { app } from "./app";

describe("syncRoutes", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 12345, login: "carvalhocaio" }),
    } as unknown as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("POST /api/sync/start", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await app.handle(
        new Request("http://localhost/api/sync/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "recent" }),
        }),
      );

      expect(res.status).toBe(401);
    });

    it("creates sync job and passes since parameter correctly", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123", email: "dev@example.com" },
      });

      // DB update mock (for auto-heal)
      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      mockDbUpdate.mockReturnValue({ set: mockSet });

      // Mock DB select queries
      mockDbSelect
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]), // no running job
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    id: "sec-1",
                    userId: "user-123",
                    githubPatEnc: "encrypted-pat",
                  },
                ]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ githubLogin: "carvalhocaio" }]),
            }),
          }),
        });

      mockDecrypt.mockReturnValue("decrypted-pat");
      mockStartSyncJob.mockResolvedValue("job-456");
      mockRunBackfillBatch.mockResolvedValue({ done: false });

      const sinceDate = "2026-10-01T00:00:00.000Z";

      const res = await app.handle(
        new Request("http://localhost/api/sync/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "recent", since: sinceDate }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ jobId: "job-456", done: false });

      // Verify startSyncJob received the since date
      expect(mockStartSyncJob).toHaveBeenCalledWith(
        expect.anything(),
        "user-123",
        "recent",
        sinceDate,
      );
    });

    it("returns 409 when a sync job is already actively running", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123", email: "dev@example.com" },
      });

      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      mockDbUpdate.mockReturnValue({ set: mockSet });

      mockDbSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: "active-job-999" }]), // active job exists
          }),
        }),
      });

      const res = await app.handle(
        new Request("http://localhost/api/sync/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "recent" }),
        }),
      );

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toBe("Sync já em andamento.");
    });
  });
});
