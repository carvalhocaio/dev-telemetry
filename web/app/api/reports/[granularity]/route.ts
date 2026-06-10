import { NextResponse, type NextRequest } from "next/server";

import { ApiError, getReport } from "@/lib/api";
import { readBearerToken } from "@/lib/auth-header";
import { isGranularity } from "@/types/report";

/**
 * Proxy consumed by `useReport`. Reads the Bearer token from the browser,
 * validates the granularity (resolution), forwards the optional `start`/`end`
 * window to the upstream and returns the report as JSON. Responds 401 when the
 * token is missing or rejected and 422 for an invalid window (start > end),
 * keeping the upstream detail out of the browser.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ granularity: string }> },
): Promise<NextResponse> {
  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { granularity } = await context.params;
  if (!isGranularity(granularity)) {
    return NextResponse.json(
      { error: "Invalid granularity. Expected 'daily', 'weekly' or 'monthly'." },
      { status: 400 },
    );
  }

  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start") ?? undefined;
  const end = searchParams.get("end") ?? undefined;

  try {
    const report = await getReport(granularity, token, { start, end });
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (error instanceof ApiError && error.status === 422) {
      return NextResponse.json(
        { error: "Invalid date window." },
        { status: 422 },
      );
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: "Failed to load report." },
      { status },
    );
  }
}
