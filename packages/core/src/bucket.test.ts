import { describe, expect, it } from "vitest";

import { bucketStart, bucketStartDate, parseLocalISODate } from "./bucket.js";

describe("bucketStart daily", () => {
  it("returns the same day", () => {
    expect(bucketStart("daily", "2025-03-12")).toBe("2025-03-12");
  });
});

describe("bucketStart weekly", () => {
  it("snaps a midweek day back to its Monday", () => {
    // 2025-03-12 is a Wednesday → Monday 2025-03-10
    expect(bucketStart("weekly", "2025-03-12")).toBe("2025-03-10");
  });

  it("keeps a Monday as itself", () => {
    expect(bucketStart("weekly", "2025-03-10")).toBe("2025-03-10");
  });

  it("snaps Sunday back to the previous Monday (date_trunc semantics)", () => {
    // 2025-03-16 is a Sunday → Monday 2025-03-10 (six days earlier)
    expect(bucketStart("weekly", "2025-03-16")).toBe("2025-03-10");
  });

  it("crosses a month boundary correctly", () => {
    // 2025-03-01 is a Saturday → Monday 2025-02-24
    expect(bucketStart("weekly", "2025-03-01")).toBe("2025-02-24");
  });
});

describe("bucketStart monthly", () => {
  it("snaps any day back to the 1st", () => {
    expect(bucketStart("monthly", "2025-03-12")).toBe("2025-03-01");
    expect(bucketStart("monthly", "2025-03-01")).toBe("2025-03-01");
    expect(bucketStart("monthly", "2025-12-31")).toBe("2025-12-01");
  });
});

describe("bucketStartDate", () => {
  it("operates on local-midnight Date objects", () => {
    const wed = parseLocalISODate("2025-03-12");
    const monday = bucketStartDate("weekly", wed);
    expect(monday.getFullYear()).toBe(2025);
    expect(monday.getMonth()).toBe(2); // March (0-indexed)
    expect(monday.getDate()).toBe(10);
  });
});
