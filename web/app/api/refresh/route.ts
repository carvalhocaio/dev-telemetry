import { NextResponse } from "next/server";

import { ApiError, triggerRefresh } from "@/lib/api";
import { readBearerToken } from "@/lib/auth-header";

/**
 * Server-side proxy for the sync button. Forwards the browser's Bearer token to
 * the upstream API and triggers an incremental refresh. The report data is now
 * fetched client-side, so the client re-fetches after a successful sync — no
 * server cache to revalidate here.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await triggerRefresh(token);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: "Failed to refresh telemetry data." },
      { status },
    );
  }
}
