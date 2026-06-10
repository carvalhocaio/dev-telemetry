import "server-only";

import {
  normalizeRefresh,
  normalizeReport,
  type RefreshResultWire,
  type ReportWire,
} from "@/lib/normalize";
import type {
  Granularity,
  NarrativeResponse,
  RefreshResult,
  Report,
} from "@/types/report";

/**
 * Server-only client for the FastAPI backend.
 *
 * Reads `API_URL` from the server environment and injects the caller-supplied
 * Bearer `token` on every request. The token originates from the browser (the
 * login modal) and is forwarded by the Next route handlers — it is never read
 * from the server env. This module must never be imported into client code; the
 * `import "server-only"` above enforces that at build time. Responses are
 * normalized from snake_case to the domain shape in `@/lib/normalize`.
 */

/** Error for any non-2xx / network failure. Never carries the token. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Raised specifically when the upstream returns 404 (e.g. unknown period). */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

interface ApiConfig {
  baseUrl: string;
}

function getConfig(): ApiConfig {
  const baseUrl = process.env.API_URL;

  if (!baseUrl) {
    throw new ApiError("API_URL is not configured on the server", 500);
  }

  return { baseUrl: baseUrl.replace(/\/$/, "") };
}

async function request(
  path: string,
  token: string,
  init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {},
): Promise<Response> {
  const { baseUrl } = getConfig();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Network-level failure (API down, DNS, etc.). Do not surface internals.
    throw new ApiError("Failed to reach the telemetry API", 502);
  }

  if (response.status === 404) {
    throw new NotFoundError();
  }

  if (!response.ok) {
    throw new ApiError(
      `Telemetry API responded with status ${response.status}`,
      response.status,
    );
  }

  return response;
}

/** Optional date window forwarded to the report endpoint. */
export interface ReportRange {
  start?: string;
  end?: string;
}

export async function getReport(
  resolution: Granularity,
  token: string,
  { start, end }: ReportRange = {},
): Promise<Report> {
  const params = new URLSearchParams();
  if (start) {
    params.set("start", start);
  }
  if (end) {
    params.set("end", end);
  }
  const query = params.toString();
  const path = query ? `/reports/${resolution}?${query}` : `/reports/${resolution}`;

  const response = await request(path, token);
  const wire = (await response.json()) as ReportWire;
  return normalizeReport(wire);
}

export async function getNarrative(
  granularity: Granularity,
  period: string,
  token: string,
): Promise<NarrativeResponse> {
  const response = await request(
    `/reports/${granularity}/${period}/narrative`,
    token,
  );
  return (await response.json()) as NarrativeResponse;
}

export async function triggerRefresh(token: string): Promise<RefreshResult> {
  // Full (90-day) refresh — see `POST /refresh/full` upstream.
  const response = await request(`/refresh/full`, token, { method: "POST" });
  const wire = (await response.json()) as RefreshResultWire;
  return normalizeRefresh(wire);
}
