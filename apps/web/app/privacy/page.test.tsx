import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./page";

describe("PrivacyPage landmarks", () => {
  it("does not render its own <main>, since the root layout already provides one", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.querySelectorAll("main")).toHaveLength(0);
  });
});
