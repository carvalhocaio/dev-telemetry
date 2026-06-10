// k6 load test — sync API under normal expected load.
// Run: k6 run sync-api.js --vus 10 --duration 30s
//
// Requires: BASE_URL and SESSION_COOKIE env vars.
//   k6 run sync-api.js -e BASE_URL=http://localhost:3000 -e SESSION=<cookie>

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const headers = {
    "Content-Type": "application/json",
    Cookie: `better-auth.session_token=${__ENV.SESSION || ""}`,
  };

  // GET /api/sync/current
  const currentRes = http.get(`${BASE_URL}/api/sync/current`, { headers });
  check(currentRes, { "sync/current 200": (r) => r.status === 200 });

  // GET /api/me/secrets/status
  const statusRes = http.get(`${BASE_URL}/api/me/secrets/status`, { headers });
  check(statusRes, { "secrets/status 200": (r) => r.status === 200 });

  sleep(1);
}
