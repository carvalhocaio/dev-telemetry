import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DailyReportModal from "./DailyReportModal";

describe("DailyReportModal", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("does not render when isOpen is false", () => {
    render(
      <DailyReportModal
        isOpen={false}
        onClose={vi.fn()}
        startDate="2026-10-08"
        endDate="2026-10-08"
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders single day heading in DD/MM/YYYY format and loads executive report", async () => {
    const mockReport = {
      title: "Report de Atividades — 08/10/2026",
      summary: "Implementação da nova timeline e modal de daily reports.",
      projects: [
        {
          name: "Dev Telemetry Dashboard",
          repo: "dev-telemetry",
          highlights: [
            "Construção dos componentes DailyTimeline e DailyReportModal",
            "Integração com endpoint de atividade diária",
          ],
        },
      ],
      markdownText: "# Report de Atividades\n- Destaques do dia",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReport,
    } as unknown as Response);

    render(
      <DailyReportModal
        isOpen={true}
        onClose={vi.fn()}
        startDate="2026-10-08"
        endDate="2026-10-08"
      />,
    );

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(
      screen.getByText("Report de Atividades — 08/10/2026"),
    ).toBeDefined();

    await waitFor(() => {
      expect(
        screen.getByText("Implementação da nova timeline e modal de daily reports."),
      ).toBeDefined();
    });

    expect(screen.getByText("Dev Telemetry Dashboard")).toBeDefined();
    expect(screen.getByText("dev-telemetry")).toBeDefined();
    expect(
      screen.getByText("Construção dos componentes DailyTimeline e DailyReportModal"),
    ).toBeDefined();
    expect(screen.getByText(/# Report de Atividades/)).toBeDefined();
  });

  it("renders date range heading when startDate is different from endDate", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Report",
        summary: "Resumo semanal",
        projects: [],
        markdownText: "Markdown",
      }),
    } as unknown as Response);

    render(
      <DailyReportModal
        isOpen={true}
        onClose={vi.fn()}
        startDate="2026-10-01"
        endDate="2026-10-08"
      />,
    );

    expect(
      screen.getByText("Report de Atividades — 01/10/2026 a 08/10/2026"),
    ).toBeDefined();
  });

  it("copies markdownText to clipboard and shows 'Copiado!'", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Report",
        summary: "Resumo",
        projects: [],
        markdownText: "Texto copiado para clipboard",
      }),
    } as unknown as Response);

    render(
      <DailyReportModal
        isOpen={true}
        onClose={vi.fn()}
        startDate="2026-10-08"
        endDate="2026-10-08"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Copiar Report")).toBeDefined();
    });

    const copyBtn = screen.getByText("Copiar Report");
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Texto copiado para clipboard",
    );
    await waitFor(() => {
      expect(screen.getByText("Copiado!")).toBeDefined();
    });
  });

  it("shows clean error message and settings link when LLM key is not configured", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "LLM não configurado. Acesse as configurações para adicionar sua chave de API.",
      }),
    } as unknown as Response);

    render(
      <DailyReportModal
        isOpen={true}
        onClose={vi.fn()}
        startDate="2026-10-08"
        endDate="2026-10-08"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "LLM não configurado. Acesse as configurações para adicionar sua chave de API.",
        ),
      ).toBeDefined();
    });

    expect(
      screen.getByText("Acessar Configurações para configurar provedor LLM →"),
    ).toBeDefined();
  });

  it("calls onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Report",
        summary: "Resumo",
        projects: [],
        markdownText: "Markdown",
      }),
    } as unknown as Response);

    render(
      <DailyReportModal
        isOpen={true}
        onClose={handleClose}
        startDate="2026-10-08"
        endDate="2026-10-08"
      />,
    );

    const closeBtn = screen.getByText("Fechar");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
