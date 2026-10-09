import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GenerateReportButton from "./GenerateReportButton";

describe("GenerateReportButton", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders trigger button and opens DailyReportModal directly on click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Report de Atividades",
        summary: "Resumo executivo",
        projects: [],
        markdownText: "Markdown",
      }),
    } as unknown as Response);

    render(
      <GenerateReportButton
        scope="all"
        filterStart="2026-10-03"
        filterEnd="2026-10-09"
      />,
    );

    const button = screen.getByText("Gerar Report");
    expect(button).toBeDefined();

    // Modal dialog initially closed
    expect(screen.queryByRole("dialog")).toBeNull();

    // Click button opens modal directly for the filter period
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });
    expect(screen.getByText(/Report de Atividades —/)).toBeDefined();
  });
});
