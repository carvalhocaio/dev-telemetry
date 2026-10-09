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

  it("renders trigger button and toggles dropdown on click", () => {
    render(<GenerateReportButton scope="all" />);

    const button = screen.getByText("Gerar Report");
    expect(button).toBeDefined();

    // Dropdown initially closed
    expect(screen.queryByRole("menu")).toBeNull();

    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByRole("menu")).toBeDefined();
    expect(screen.getByText("Hoje")).toBeDefined();
    expect(screen.getByText("Ontem")).toBeDefined();
    expect(screen.getByText("Últimos 7 dias")).toBeDefined();
    expect(screen.getByText("Últimos 30 dias")).toBeDefined();
  });

  it("selecting an option opens DailyReportModal with selected dates", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Report de Atividades",
        summary: "Resumo executivo",
        projects: [],
        markdownText: "Markdown",
      }),
    } as unknown as Response);

    render(<GenerateReportButton scope="all" />);

    // Open dropdown
    fireEvent.click(screen.getByText("Gerar Report"));

    // Select "Últimos 7 dias"
    const last7Btn = screen.getByText("Últimos 7 dias");
    fireEvent.click(last7Btn);

    // Modal dialog should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });
    expect(screen.getByText(/Report de Atividades —/)).toBeDefined();
  });
});
