import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReportRefetchProvider } from "@/hooks/useReportRefetch";
import DailyTimeline from "./DailyTimeline";

function renderWithProvider(ui: React.ReactElement) {
  return render(<ReportRefetchProvider>{ui}</ReportRefetchProvider>);
}

describe("DailyTimeline", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders empty state when there are no activity days", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        days: [],
        totals: {
          daysCount: 0,
          commitsCount: 0,
          prsCreated: 0,
          prsMerged: 0,
          churn: 0,
          repositories: [],
        },
      }),
    } as unknown as Response);

    renderWithProvider(<DailyTimeline start="2026-10-01" end="2026-10-08" />);

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma atividade registrada"),
      ).toBeDefined();
    });
    expect(
      screen.getByText(
        /Nenhuma atividade registrada neste período\. Use o botão Sincronizar para importar commits e PRs do GitHub\./,
      ),
    ).toBeDefined();
  });

  it("renders activity days with formatted date, badges, and repositories", async () => {
    const mockReport = {
      days: [
        {
          date: "2026-10-08",
          commitsCount: 3,
          prsCreated: 1,
          prsMerged: 1,
          churn: 450,
          repositories: ["dev-telemetry", "ai-engine"],
          commits: [
            {
              sha: "abcdef1234567890",
              message: "feat: add daily timeline component",
              repoName: "dev-telemetry",
              additions: 300,
              deletions: 50,
              authoredAt: "2026-10-08T14:00:00Z",
              htmlUrl: "https://github.com/org/repo/commit/abcdef1",
            },
            {
              sha: "1234567890abcdef",
              message: "fix: update date parsing",
              repoName: "ai-engine",
              additions: 80,
              deletions: 20,
              authoredAt: "2026-10-08T11:00:00Z",
              htmlUrl: "https://github.com/org/repo/commit/1234567",
            },
          ],
          prs: [
            {
              number: 42,
              title: "feat: daily timeline and modal",
              repoName: "dev-telemetry",
              state: "closed",
              htmlUrl: "https://github.com/org/repo/pull/42",
              ghCreatedAt: "2026-10-08T09:00:00Z",
              ghMergedAt: "2026-10-08T15:00:00Z",
            },
          ],
        },
      ],
      totals: {
        daysCount: 1,
        commitsCount: 3,
        prsCreated: 1,
        prsMerged: 1,
        churn: 450,
        repositories: ["ai-engine", "dev-telemetry"],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as unknown as Response);

    renderWithProvider(<DailyTimeline start="2026-10-01" end="2026-10-08" />);

    // Check date formatted as DD/MM/YYYY
    await waitFor(() => {
      expect(screen.getByText("08/10/2026")).toBeDefined();
    });

    // Check badges
    expect(screen.getByText(/3 commits/)).toBeDefined();
    expect(screen.getByText(/1 PRs/)).toBeDefined();
    expect(screen.getByText(/450 churn/)).toBeDefined();
    expect(screen.getByText("+380")).toBeDefined();
    expect(screen.getByText("-70")).toBeDefined();

    // Check repos
    expect(screen.getAllByText("dev-telemetry").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ai-engine").length).toBeGreaterThan(0);

    // Check action button
    expect(screen.getByText("Gerar Daily")).toBeDefined();
  });

  it("expands row to show commit details and PR details", async () => {
    const mockReport = {
      days: [
        {
          date: "2026-10-08",
          commitsCount: 1,
          prsCreated: 1,
          prsMerged: 0,
          churn: 100,
          repositories: ["dev-telemetry"],
          commits: [
            {
              sha: "abcdef1234567890",
              message: "feat: add timeline toggle",
              repoName: "dev-telemetry",
              additions: 80,
              deletions: 20,
              authoredAt: "2026-10-08T14:00:00Z",
              htmlUrl: "https://github.com/org/repo/commit/abcdef1",
            },
          ],
          prs: [
            {
              number: 99,
              title: "feat: super exciting feature",
              repoName: "dev-telemetry",
              state: "open",
              htmlUrl: "https://github.com/org/repo/pull/99",
              ghCreatedAt: "2026-10-08T09:00:00Z",
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
        churn: 100,
        repositories: ["dev-telemetry"],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as unknown as Response);

    renderWithProvider(<DailyTimeline start="2026-10-01" end="2026-10-08" />);

    await waitFor(() => {
      expect(screen.getByText("08/10/2026")).toBeDefined();
    });

    // Expand details
    const detailsBtn = screen.getByText("Ver detalhes");
    fireEvent.click(detailsBtn);

    // Details should now be visible
    expect(screen.getByText("feat: add timeline toggle")).toBeDefined();
    expect(screen.getByText("abcdef1")).toBeDefined();
    expect(screen.getByText("feat: super exciting feature")).toBeDefined();
    expect(screen.getByText("#99")).toBeDefined();
    expect(screen.getByText("open")).toBeDefined();
  });

  it("opens DailyReportModal when 'Gerar Daily' button is clicked", async () => {
    const mockReport = {
      days: [
        {
          date: "2026-10-08",
          commitsCount: 1,
          prsCreated: 0,
          prsMerged: 0,
          churn: 10,
          repositories: ["dev-telemetry"],
          commits: [
            {
              sha: "abcdef1234567890",
              message: "docs: update readme",
              repoName: "dev-telemetry",
              additions: 10,
              deletions: 0,
              authoredAt: "2026-10-08T14:00:00Z",
              htmlUrl: "https://github.com/org/repo/commit/abcdef1",
            },
          ],
          prs: [],
        },
      ],
      totals: {
        daysCount: 1,
        commitsCount: 1,
        prsCreated: 0,
        prsMerged: 0,
        churn: 10,
        repositories: ["dev-telemetry"],
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/reports/generate")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            title: "Report de Atividades — 08/10/2026",
            summary: "Resumo do dia",
            projects: [],
            markdownText: "Markdown do dia",
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockReport,
      });
    });

    renderWithProvider(<DailyTimeline start="2026-10-01" end="2026-10-08" />);

    await waitFor(() => {
      expect(screen.getByText("Gerar Daily")).toBeDefined();
    });

    const gerarBtn = screen.getByText("Gerar Daily");
    fireEvent.click(gerarBtn);

    // Modal should be opened with title
    await waitFor(() => {
      expect(
        screen.getByText("Report de Atividades — 08/10/2026"),
      ).toBeDefined();
    });
  });
});
