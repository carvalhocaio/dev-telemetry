// k6 stress test — ramp up beyond normal capacity, then back down.
// Run: k6 run api-stress.js -e BASE_URL=http://localhost:3000

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },   // ramp up to normal load
    { duration: "1m",  target: 50 },   // push beyond expected (stress)
    { duration: "30s", target: 100 },  // peak — find the breaking point
    { duration: "1m",  target: 10 },   // scale back down
    { duration: "30s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],    // max 5% errors allowed at peak
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE_URL}/api/me/secrets/status`, {
    headers: {
      Cookie: `better-auth.session_token=${__ENV.SESSION || ""}`,
    },
  });
  check(res, { "status not 500": (r) => r.status !== 500 });
  sleep(0.5);
}
