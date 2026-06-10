import { NextResponse } from "next/server";

import { ApiError, getReport } from "@/lib/api";
import { readBearerToken } from "@/lib/auth-header";

/**
 * Validates the password submitted from the login modal. The browser sends it as
 * `Authorization: Bearer <password>`; this proxy probes a cheap authenticated
 * upstream call (the weekly report) to confirm it. Returns 204 on success, 401
 * if the upstream rejects the token, and 502 if the API is unreachable. Error
 * bodies are intentionally generic and never echo the upstream detail.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const token = readBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "Missing credentials." },
      { status: 401 },
    );
  }

  try {
    await getReport("weekly", token);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }
    if (error instanceof ApiError && error.status === 502) {
      return NextResponse.json(
        { error: "Telemetry API is unreachable." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Failed to verify credentials." },
      { status: 500 },
    );
  }
}
