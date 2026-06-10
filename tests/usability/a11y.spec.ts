// Playwright + axe-core accessibility tests.
// Install first: bun add -D @playwright/test @axe-core/playwright
// Run: bunx playwright test tests/usability/a11y.spec.ts

// import { test, expect } from "@playwright/test";
// import AxeBuilder from "@axe-core/playwright";

// test.describe("accessibility — WCAG 2.1 AA", () => {
//   test("login page has no accessibility violations", async ({ page }) => {
//     await page.goto("/login");
//     const results = await new AxeBuilder({ page })
//       .withTags(["wcag2a", "wcag2aa"])
//       .analyze();
//     expect(results.violations).toHaveLength(0);
//   });
//
//   test("settings page has no accessibility violations", async ({ page }) => {
//     // Requires authenticated session — set cookie before navigating.
//     await page.goto("/settings");
//     const results = await new AxeBuilder({ page })
//       .withTags(["wcag2a", "wcag2aa"])
//       .analyze();
//     expect(results.violations).toHaveLength(0);
//   });
//
//   test("dashboard has no accessibility violations", async ({ page }) => {
//     await page.goto("/");
//     const results = await new AxeBuilder({ page })
//       .withTags(["wcag2a", "wcag2aa"])
//       .analyze();
//     expect(results.violations).toHaveLength(0);
//   });
// });

// Placeholder: uncomment after installing @playwright/test and @axe-core/playwright.
export {};
