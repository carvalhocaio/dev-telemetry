import { NextResponse } from "next/server";

import { ApiError, getNarrative, NotFoundError } from "@/lib/api";
import { readBearerToken } from "@/lib/auth-header";
import { isValidPeriod } from "@/lib/normalize";
import { isGranularity } from "@/types/report";

/**
 * Thin server-side proxy consumed by the client NarrativePanel on bar click.
 * The browser supplies the API password as a Bearer token; this route forwards
 * it to the upstream API so the token never goes to FastAPI directly.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ granularity: string; period: string }> },
): Promise<NextResponse> {
  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { granularity, period } = await context.params;

  if (!isGranularity(granularity)) {
    return NextResponse.json(
      { error: "Invalid granularity. Expected 'weekly' or 'monthly'." },
      { status: 400 },
    );
  }

  if (!isValidPeriod(period)) {
    return NextResponse.json(
      { error: "Invalid period. Expected format YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const narrative = await getNarrative(granularity, period, token);
    return NextResponse.json(narrative);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: "No narrative found for this period." },
        { status: 404 },
      );
    }
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: "Failed to load narrative." },
      { status },
    );
  }
}
