import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTypewriter } from "@/hooks/useTypewriter";

function mockReducedMotion(reduced: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes("reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

function Probe({ text }: { text: string }) {
  const value = useTypewriter(text, 10);
  return <span data-testid="out">{value}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useTypewriter", () => {
  it("renders the full text immediately when reduced motion is preferred", () => {
    mockReducedMotion(true);

    render(<Probe text="hello" />);

    expect(screen.getByTestId("out").textContent).toBe("hello");
  });

  it("reveals the text progressively when motion is allowed", () => {
    mockReducedMotion(false);

    render(<Probe text="abc" />);

    expect(screen.getByTestId("out").textContent).toBe("");

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByTestId("out").textContent).toBe("a");

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByTestId("out").textContent).toBe("abc");
  });

  it("does not exceed the full text length", () => {
    mockReducedMotion(false);

    render(<Probe text="ab" />);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("out").textContent).toBe("ab");
  });
});
