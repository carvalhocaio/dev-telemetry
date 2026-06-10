import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  getNarrative,
  getReport,
  NotFoundError,
  triggerRefresh,
} from "@/lib/api";

const SECRET = "super-secret-token";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const reportBody = {
  meta: {
    granularity: "weekly",
    sample_size: 1,
    weights: {},
    level_cuts: {},
    small_sample: true,
    coverage: { first: "2026-06-01", last: "2026-06-01" },
  },
  window: {
    start: "2026-06-01",
    end: "2026-06-01",
    level: "acima",
    composite: 0.7,
    commit_count: 10,
    pr_count: 2,
    pr_merged: 2,
    additions: 100,
    deletions: 50,
    active_days: 3,
    partial_current: false,
  },
  periods: [
    {
      period: "2026-06-01",
      level: "acima",
      composite: 0.7,
      components: { throughput: 0.8, active_days: 0.6, churn: 0.7 },
      commit_count: 10,
      pr_count: 2,
      pr_merged: 2,
      additions: 100,
      deletions: 50,
      active_days: 3,
      merge_rate: 1,
    },
  ],
};

beforeEach(() => {
  vi.stubEnv("API_URL", "http://api.test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getReport", () => {
  it("sends the Bearer token and returns the normalized report", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(reportBody));

    const report = await getReport("weekly", SECRET);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/reports/weekly",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${SECRET}`,
        }),
      }),
    );
    expect(report.meta.sampleSize).toBe(1);
    expect(report.periods[0].commitCount).toBe(10);
    expect(report.window.commitCount).toBe(10);
  });

  it("forwards the start/end window as a querystring", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse(reportBody));

    await getReport("daily", SECRET, { start: "2026-06-01", end: "2026-06-07" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/reports/daily?start=2026-06-01&end=2026-06-07",
      expect.anything(),
    );
  });

  it("wraps network failures in an ApiError without leaking the token", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const error = await getReport("weekly", SECRET).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).message).not.toContain(SECRET);
  });

  it("maps non-2xx responses to an ApiError carrying the status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "boom" }, 500),
    );

    const error = await getReport("weekly", SECRET).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).not.toContain(SECRET);
  });

  it("surfaces an upstream 401 as an ApiError with status 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "unauthorized" }, 401),
    );

    const error = await getReport("weekly", "wrong-token").catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });

  it("throws when API_URL is missing", async () => {
    vi.unstubAllEnvs();

    const error = await getReport("weekly", SECRET).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });
});

describe("getNarrative", () => {
  it("raises NotFoundError on a 404 (unknown period)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "not found" }, 404),
    );

    const error = await getNarrative("weekly", "2026-06-01", SECRET).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).status).toBe(404);
  });

  it("returns the narrative payload on success", async () => {
    const body = {
      period: "2026-06-01",
      level: "acima",
      model: "gemini-3.5-flash",
      narrative: { summary: "ok", themes: [], strengths: [], watchouts: [] },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(body));

    const result = await getNarrative("weekly", "2026-06-01", SECRET);

    expect(result.narrative.summary).toBe("ok");
  });
});

describe("triggerRefresh", () => {
  it("POSTs the full (90-day) refresh and normalizes the result", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ repositories: 1, commits: 5, pull_requests: 3 }),
      );

    const result = await triggerRefresh(SECRET);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/refresh/full",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ repositories: 1, commits: 5, pullRequests: 3 });
  });
});
