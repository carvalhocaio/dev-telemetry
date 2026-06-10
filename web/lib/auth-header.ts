/**
 * Extracts the Bearer token from an incoming request's `Authorization` header,
 * shared by the Next route handlers that proxy to the upstream API. Returns
 * `null` when the header is missing or malformed.
 */
export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
