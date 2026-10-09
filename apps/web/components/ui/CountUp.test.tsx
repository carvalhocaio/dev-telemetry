import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CountUp from "./CountUp";

describe("CountUp", () => {
  it("renders correctly with formatted value", async () => {
    render(<CountUp to={1234} duration={0} />);
    await waitFor(() => {
      expect(screen.getByText("1.234")).toBeDefined();
    });
  });

  it("formats zero correctly", async () => {
    render(<CountUp to={0} duration={0} />);
    await waitFor(() => {
      expect(screen.getByText("0")).toBeDefined();
    });
  });

  it("applies className prop", async () => {
    render(<CountUp to={10} className="font-bold text-accent" duration={0} />);
    await waitFor(() => {
      const el = screen.getByText("10");
      expect(el.className).toContain("font-bold");
      expect(el.className).toContain("text-accent");
    });
  });
});
