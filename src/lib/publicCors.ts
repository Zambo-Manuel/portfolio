import { NextRequest, NextResponse } from "next/server";

/**
 * Public CORS headers for endpoints consumed by the static portfolio.
 *
 * Default behaviour:
 * - Allow any origin ("*") for public GET requests.
 * - Disable caching to avoid stale content on the portfolio.
 *
 * Optional hardening:
 * - Set PUBLIC_CORS_ORIGINS as a comma-separated allow-list.
 *   Example:
 *     PUBLIC_CORS_ORIGINS="http://localhost:8080,https://www.mydomain.tld"
 */
export function publicCorsHeaders(request?: NextRequest): Record<string, string> {
  const origin = request?.headers.get("origin") || "";
  const raw = process.env.PUBLIC_CORS_ORIGINS || "";
  const allowList = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin = allowList.length === 0
    ? "*"
    : (origin && allowList.includes(origin) ? origin : allowList[0]);

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };
}

export function publicOptionsResponse(request: NextRequest) {
  const headers = publicCorsHeaders(request);
  headers["Access-Control-Max-Age"] = "86400";
  return new NextResponse(null, { status: 204, headers });
}
