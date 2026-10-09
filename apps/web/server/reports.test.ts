import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockDbSelect = vi.fn();
const mockDecrypt = vi.fn();
const mockGetDailyActivity = vi.fn();
const mockGenerateExecutiveReport = vi.fn();

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
  },
}));

vi.mock("@/lib/app-crypto", () => ({
  appCrypto: {
    decrypt: (...args: unknown[]) => mockDecrypt(...args),
    encrypt: vi.fn(),
  },
}));

vi.mock("@dev-telemetry/core", () => ({
  getDailyActivity: (...args: unknown[]) => mockGetDailyActivity(...args),
}));

vi.mock("@dev-telemetry/ai", () => ({
  generateExecutiveReport: (...args: unknown[]) => mockGenerateExecutiveReport(...args),
}));

// Import app after mocks are set up
import { app } from "./app";

describe("reportsRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/activity/daily", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await app.handle(
        new Request("http://localhost/api/activity/daily"),
      );

      expect(res.status).toBe(401);
      expect(mockGetDailyActivity).not.toHaveBeenCalled();
    });

    it("returns 200 with DailyActivityReport when authenticated (scope=all)", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123", name: "Alice", email: "alice@example.com" },
      });

      const mockReport = {
        days: [
          {
            date: "2026-10-08",
            commitsCount: 2,
            prsCreated: 1,
            prsMerged: 0,
            churn: 50,
            repositories: ["repo-a"],
            commits: [],
            prs: [],
          },
        ],
        totals: {
          daysCount: 1,
          commitsCount: 2,
          prsCreated: 1,
          prsMerged: 0,
          churn: 50,
          repositories: ["repo-a"],
        },
      };

      mockGetDailyActivity.mockResolvedValue(mockReport);

      const res = await app.handle(
        new Request("http://localhost/api/activity/daily?start=2026-10-01&end=2026-10-08"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(mockReport);
      expect(mockGetDailyActivity).toHaveBeenCalledWith({
        db: expect.anything(),
        userId: "user-123",
        start: "2026-10-01",
        end: "2026-10-08",
        scope: "all",
        githubLogin: undefined,
      });
      expect(mockDbSelect).not.toHaveBeenCalled();
    });

    it("resolves githubLogin when scope !== 'all'", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123", name: "Alice" },
      });

      const mockFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ githubLogin: "alice-gh" }]),
        }),
      });
      mockDbSelect.mockReturnValue({ from: mockFrom });

      mockGetDailyActivity.mockResolvedValue({
        days: [],
        totals: { daysCount: 0, commitsCount: 0, prsCreated: 0, prsMerged: 0, churn: 0, repositories: [] },
      });

      const res = await app.handle(
        new Request("http://localhost/api/activity/daily?scope=personal"),
      );

      expect(res.status).toBe(200);
      expect(mockGetDailyActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          scope: "personal",
          githubLogin: "alice-gh",
        }),
      );
    });

    it("returns 500 when getDailyActivity throws", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123" },
      });

      mockGetDailyActivity.mockRejectedValue(new Error("Database connection failed"));

      const res = await app.handle(
        new Request("http://localhost/api/activity/daily"),
      );

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json).toEqual({ error: "Database connection failed" });
    });
  });

  describe("POST /api/reports/generate", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await app.handle(
        new Request("http://localhost/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: "2026-10-01", endDate: "2026-10-08" }),
        }),
      );

      expect(res.status).toBe(401);
      expect(mockGenerateExecutiveReport).not.toHaveBeenCalled();
    });

    it("returns 400 when user LLM secrets are missing or incomplete", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123" },
      });

      // Case 1: no secret row
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res1 = await app.handle(
        new Request("http://localhost/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: "2026-10-01", endDate: "2026-10-08" }),
        }),
      );

      expect(res1.status).toBe(400);
      expect(await res1.json()).toEqual({
        error: "LLM não configurado. Acesse as configurações para adicionar sua chave de API.",
      });

      // Case 2: secret row missing provider or key
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ llmApiKeyEnc: "enc-key", llmProvider: null, llmModel: "gpt-4" }]),
          }),
        }),
      });

      const res2 = await app.handle(
        new Request("http://localhost/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: "2026-10-01", endDate: "2026-10-08" }),
        }),
      );

      expect(res2.status).toBe(400);
      expect(await res2.json()).toEqual({
        error: "LLM não configurado. Acesse as configurações para adicionar sua chave de API.",
      });
    });

    it("generates executive report successfully and passes mapped commits and PRs", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123" },
      });

      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                llmApiKeyEnc: "encrypted-api-key",
                llmProvider: "openai",
                llmModel: "gpt-4o",
              },
            ]),
          }),
        }),
      });

      mockDecrypt.mockReturnValue("decrypted-secret-key");

      mockGetDailyActivity.mockResolvedValue({
        days: [
          {
            date: "2026-10-08",
            commitsCount: 1,
            prsCreated: 1,
            prsMerged: 0,
            churn: 15,
            repositories: ["repo-alpha"],
            commits: [
              {
                sha: "c1",
                message: "feat: add executive reports",
                repoName: "repo-alpha",
                additions: 10,
                deletions: 5,
                authoredAt: "2026-10-08T10:00:00.000Z",
                htmlUrl: "https://github.com/repo-alpha/commit/c1",
              },
            ],
            prs: [
              {
                number: 42,
                title: "PR: Executive reporting",
                repoName: "repo-alpha",
                state: "open",
                htmlUrl: "https://github.com/repo-alpha/pull/42",
                ghCreatedAt: "2026-10-08T09:00:00.000Z",
                ghMergedAt: null,
              },
            ],
          },
        ],
        totals: {
          daysCount: 1,
          commitsCount: 1,
          prsCreated: 1,
          prsMerged: 0,
          churn: 15,
          repositories: ["repo-alpha"],
        },
      });

      const mockExecutiveReport = {
        title: "Report de Atividades — 08/10/2026",
        summary: "Implementação da funcionalidade de relatórios executivos.",
        projects: [
          {
            name: "Repo Alpha",
            repo: "repo-alpha",
            highlights: ["Adicionado suporte a relatórios executivos"],
          },
        ],
        markdownText: "# Report de Atividades — 08/10/2026\n...",
      };
      mockGenerateExecutiveReport.mockResolvedValue(mockExecutiveReport);

      const res = await app.handle(
        new Request("http://localhost/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-10-08",
            endDate: "2026-10-08",
          }),
        }),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(mockExecutiveReport);

      expect(mockDecrypt).toHaveBeenCalledWith("encrypted-api-key");
      expect(mockGetDailyActivity).toHaveBeenCalledWith({
        db: expect.anything(),
        userId: "user-123",
        start: "2026-10-08",
        end: "2026-10-08",
        scope: "all",
        githubLogin: undefined,
      });

      expect(mockGenerateExecutiveReport).toHaveBeenCalledWith({
        provider: "openai",
        model: "gpt-4o",
        apiKey: "decrypted-secret-key",
        startDate: "2026-10-08",
        endDate: "2026-10-08",
        commits: [
          {
            message: "feat: add executive reports",
            repo: "repo-alpha",
            additions: 10,
            deletions: 5,
            date: "2026-10-08T10:00:00.000Z",
          },
        ],
        prs: [
          {
            title: "PR: Executive reporting",
            repo: "repo-alpha",
            state: "open",
            date: "2026-10-08T09:00:00.000Z",
          },
        ],
      });
    });

    it("resolves githubLogin when scope !== 'all' on generate report", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123" },
      });

      // 1. userSecret query
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                llmApiKeyEnc: "enc",
                llmProvider: "anthropic",
                llmModel: "claude-3-7-sonnet",
              },
            ]),
          }),
        }),
      });

      // 2. user githubLogin query
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ githubLogin: "alice-gh" }]),
          }),
        }),
      });

      mockDecrypt.mockReturnValue("key-123");
      mockGetDailyActivity.mockResolvedValue({
        days: [],
        totals: { daysCount: 0, commitsCount: 0, prsCreated: 0, prsMerged: 0, churn: 0, repositories: [] },
      });
      mockGenerateExecutiveReport.mockResolvedValue({
        title: "Report",
        summary: "Sum",
        projects: [],
        markdownText: "",
      });

      const res = await app.handle(
        new Request("http://localhost/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-10-01",
            endDate: "2026-10-08",
            scope: "org:my-org",
          }),
        }),
      );

      expect(res.status).toBe(200);
      expect(mockGetDailyActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: "org:my-org",
          githubLogin: "alice-gh",
        }),
      );
    });

    it("returns 500 when generateExecutiveReport throws", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user-123" },
      });

      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                llmApiKeyEnc: "enc",
                llmProvider: "gemini",
                llmModel: "gemini-2.5-flash",
              },
            ]),
          }),
        }),
      });

      mockDecrypt.mockReturnValue("gemini-key");
      mockGetDailyActivity.mockResolvedValue({
        days: [],
        totals: { daysCount: 0, commitsCount: 0, prsCreated: 0, prsMerged: 0, churn: 0, repositories: [] },
      });
      mockGenerateExecutiveReport.mockRejectedValue(new Error("Rate limit exceeded"));

      const res = await app.handle(
        new Request("http://localhost/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: "2026-10-01",
            endDate: "2026-10-08",
          }),
        }),
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Rate limit exceeded" });
    });
  });
});
