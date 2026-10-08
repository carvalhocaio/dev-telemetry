import { describe, expect, it } from "vitest";

import {
  aggregateDailyActivity,
  getDailyActivity,
  toLocalDateStr,
} from "./daily-activity";
import type { DailyCommitItem, DailyPrItem } from "./types";

function makeCommit(overrides: Partial<DailyCommitItem> & { sha: string; authoredAt: string }): DailyCommitItem {
  return {
    message: "feat: update something",
    repoName: "my-repo",
    additions: 10,
    deletions: 5,
    htmlUrl: `https://github.com/my-org/my-repo/commit/${overrides.sha}`,
    ...overrides,
  };
}

function makePr(overrides: Partial<DailyPrItem> & { number: number; ghCreatedAt: string }): DailyPrItem {
  return {
    title: "feat: add feature",
    repoName: "my-repo",
    state: "open",
    htmlUrl: `https://github.com/my-org/my-repo/pull/${overrides.number}`,
    ghMergedAt: null,
    ...overrides,
  };
}

function createMockDb({
  commits = [],
  prs = [],
}: {
  commits?: unknown[];
  prs?: unknown[];
}) {
  const executedQueries: unknown[] = [];
  return {
    executedQueries,
    async execute(query: unknown) {
      executedQueries.push(query);
      const chunks = (query as any)?.queryChunks;
      const isPrQuery =
        Array.isArray(chunks) &&
        chunks.some(
          (c: any) =>
            c?.[Symbol.for("drizzle:Name")] === "pull_request" ||
            (Array.isArray(c?.value) &&
              c.value.some((v: unknown) => typeof v === "string" && v.includes("pull_request"))),
        );
      if (isPrQuery) {
        return prs;
      }
      return commits;
    },
  };
}

describe("toLocalDateStr", () => {
  it("formats string date YYYY-MM-DD cleanly", () => {
    expect(toLocalDateStr("2026-10-08")).toBe("2026-10-08");
  });

  it("formats Date instance into local YYYY-MM-DD", () => {
    const d = new Date(2026, 9, 8, 15, 30); // October 8, 2026
    expect(toLocalDateStr(d)).toBe("2026-10-08");
  });
});

describe("aggregateDailyActivity - grouping and calculations", () => {
  it("groups commits and PRs by local date (YYYY-MM-DD)", () => {
    const commits: DailyCommitItem[] = [
      makeCommit({ sha: "c1", authoredAt: "2026-10-08", repoName: "frontend" }),
      makeCommit({ sha: "c2", authoredAt: "2026-10-07", repoName: "backend" }),
    ];
    const prs: DailyPrItem[] = [
      makePr({ number: 101, ghCreatedAt: "2026-10-08", repoName: "frontend" }),
      makePr({ number: 102, ghCreatedAt: "2026-10-07", repoName: "backend" }),
    ];

    const report = aggregateDailyActivity({ commits, prs });

    expect(report.days).toHaveLength(2);
    expect(report.days[0]!.date).toBe("2026-10-08");
    expect(report.days[1]!.date).toBe("2026-10-07");

    expect(report.days[0]!.commits).toHaveLength(1);
    expect(report.days[0]!.commits[0]!.sha).toBe("c1");
    expect(report.days[0]!.prs).toHaveLength(1);
    expect(report.days[0]!.prs[0]!.number).toBe(101);

    expect(report.days[1]!.commits).toHaveLength(1);
    expect(report.days[1]!.commits[0]!.sha).toBe("c2");
    expect(report.days[1]!.prs).toHaveLength(1);
    expect(report.days[1]!.prs[0]!.number).toBe(102);
  });

  it("calculates commitsCount, prsCreated, prsMerged, churn, and unique repositories", () => {
    // 2026-10-08:
    // 2 commits in repo-a (add 50, del 10) and repo-b (add 20, del 5) -> churn = 60 + 25 = 85
    // 1 PR created today and unmerged (pr #1 in repo-a)
    // 1 PR created yesterday and merged today (pr #2 in repo-c)
    // 1 PR created today AND merged today (pr #3 in repo-b)
    const commits: DailyCommitItem[] = [
      makeCommit({ sha: "c1", authoredAt: "2026-10-08", additions: 50, deletions: 10, repoName: "repo-a" }),
      makeCommit({ sha: "c2", authoredAt: "2026-10-08", additions: 20, deletions: 5, repoName: "repo-b" }),
    ];

    const prs: DailyPrItem[] = [
      makePr({ number: 1, ghCreatedAt: "2026-10-08", ghMergedAt: null, repoName: "repo-a" }),
      makePr({ number: 2, ghCreatedAt: "2026-10-07", ghMergedAt: "2026-10-08", repoName: "repo-c" }),
      makePr({ number: 3, ghCreatedAt: "2026-10-08", ghMergedAt: "2026-10-08", repoName: "repo-b" }),
    ];

    const report = aggregateDailyActivity({ commits, prs });
    const day = report.days.find((d) => d.date === "2026-10-08");
    expect(day).toBeDefined();

    expect(day!.commitsCount).toBe(2);
    // pr #1 (created today) + pr #3 (created today)
    expect(day!.prsCreated).toBe(2);
    // pr #2 (merged today) + pr #3 (merged today)
    expect(day!.prsMerged).toBe(2);
    // Churn: (50+10) + (20+5) = 85
    expect(day!.churn).toBe(85);
    // Repositories from commits (repo-a, repo-b) and PRs (repo-a, repo-b, repo-c)
    expect(day!.repositories).toEqual(["repo-a", "repo-b", "repo-c"]);
    // PRs array contains pr #1, #2, and #3
    expect(day!.prs).toHaveLength(3);
  });

  it("places cross-day PR in both created date and merged date", () => {
    const prs: DailyPrItem[] = [
      makePr({
        number: 42,
        repoName: "core-lib",
        ghCreatedAt: "2026-10-05",
        ghMergedAt: "2026-10-08",
      }),
    ];

    const report = aggregateDailyActivity({ commits: [], prs });

    expect(report.days).toHaveLength(2);

    const oct8 = report.days.find((d) => d.date === "2026-10-08");
    expect(oct8).toBeDefined();
    expect(oct8!.prsCreated).toBe(0);
    expect(oct8!.prsMerged).toBe(1);
    expect(oct8!.prs).toHaveLength(1);
    expect(oct8!.repositories).toEqual(["core-lib"]);

    const oct5 = report.days.find((d) => d.date === "2026-10-05");
    expect(oct5).toBeDefined();
    expect(oct5!.prsCreated).toBe(1);
    expect(oct5!.prsMerged).toBe(0);
    expect(oct5!.prs).toHaveLength(1);
    expect(oct5!.repositories).toEqual(["core-lib"]);
  });
});

describe("aggregateDailyActivity - sorting", () => {
  it("sorts days newest first", () => {
    const commits: DailyCommitItem[] = [
      makeCommit({ sha: "c1", authoredAt: "2026-10-02" }),
      makeCommit({ sha: "c2", authoredAt: "2026-10-08" }),
      makeCommit({ sha: "c3", authoredAt: "2026-10-05" }),
    ];

    const report = aggregateDailyActivity({ commits, prs: [] });

    expect(report.days.map((d) => d.date)).toEqual([
      "2026-10-08",
      "2026-10-05",
      "2026-10-02",
    ]);
  });
});

describe("aggregateDailyActivity - summary totals across all days", () => {
  it("computes totals across all days accurately", () => {
    const commits: DailyCommitItem[] = [
      makeCommit({ sha: "c1", authoredAt: "2026-10-08", additions: 100, deletions: 20, repoName: "repo-a" }),
      makeCommit({ sha: "c2", authoredAt: "2026-10-08", additions: 50, deletions: 10, repoName: "repo-b" }),
      makeCommit({ sha: "c3", authoredAt: "2026-10-07", additions: 30, deletions: 5, repoName: "repo-a" }),
    ];

    const prs: DailyPrItem[] = [
      makePr({ number: 1, ghCreatedAt: "2026-10-08", ghMergedAt: "2026-10-08", repoName: "repo-b" }),
      makePr({ number: 2, ghCreatedAt: "2026-10-07", ghMergedAt: null, repoName: "repo-c" }),
    ];

    const report = aggregateDailyActivity({ commits, prs });

    expect(report.totals).toEqual({
      daysCount: 2,
      commitsCount: 3,
      prsCreated: 2, // PR #1 on 10-08 + PR #2 on 10-07
      prsMerged: 1,  // PR #1 on 10-08
      churn: 215,    // (100+20) + (50+10) + (30+5)
      repositories: ["repo-a", "repo-b", "repo-c"],
    });
  });

  it("handles empty activity cleanly", () => {
    const report = aggregateDailyActivity({ commits: [], prs: [] });

    expect(report.days).toEqual([]);
    expect(report.totals).toEqual({
      daysCount: 0,
      commitsCount: 0,
      prsCreated: 0,
      prsMerged: 0,
      churn: 0,
      repositories: [],
    });
  });

  it("respects start and end date filters", () => {
    const commits: DailyCommitItem[] = [
      makeCommit({ sha: "c1", authoredAt: "2026-10-01" }),
      makeCommit({ sha: "c2", authoredAt: "2026-10-05" }),
      makeCommit({ sha: "c3", authoredAt: "2026-10-10" }),
    ];

    const report = aggregateDailyActivity({
      commits,
      prs: [],
      start: "2026-10-03",
      end: "2026-10-08",
    });

    expect(report.days).toHaveLength(1);
    expect(report.days[0]!.date).toBe("2026-10-05");
    expect(report.totals.daysCount).toBe(1);
    expect(report.totals.commitsCount).toBe(1);
  });
});

describe("getDailyActivity - database integration", () => {
  it("queries db with executor and builds report", async () => {
    const rawCommits = [
      {
        sha: "abc1234",
        message: "feat: add widget",
        repoName: "widget-app",
        additions: 45,
        deletions: 12,
        authoredAt: "2026-10-08T10:00:00.000Z",
        htmlUrl: "https://github.com/org/widget-app/commit/abc1234",
      },
    ];

    const rawPrs = [
      {
        number: 7,
        title: "feat: widget support",
        repoName: "widget-app",
        state: "closed",
        htmlUrl: "https://github.com/org/widget-app/pull/7",
        ghCreatedAt: "2026-10-07T12:00:00.000Z",
        ghMergedAt: "2026-10-08T14:00:00.000Z",
      },
    ];

    const mockDb = createMockDb({ commits: rawCommits, prs: rawPrs });

    const report = await getDailyActivity({
      db: mockDb,
      userId: "user-123",
      start: "2026-10-07",
      end: "2026-10-08",
      scope: "all",
    });

    expect(mockDb.executedQueries).toHaveLength(2);
    expect(report.days.length).toBeGreaterThanOrEqual(1);

    const oct8 = report.days.find((d) => d.date === "2026-10-08");
    expect(oct8).toBeDefined();
    expect(oct8!.commitsCount).toBe(1);
    expect(oct8!.prsMerged).toBe(1);
    expect(oct8!.churn).toBe(57);
    expect(oct8!.repositories).toEqual(["widget-app"]);
  });
});
