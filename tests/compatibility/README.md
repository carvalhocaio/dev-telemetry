# Testes de Compatibilidade (Compatibility Testing)

Verifica que a aplicação funciona corretamente em diferentes navegadores e dispositivos.

## Ferramenta recomendada: Playwright (multi-browser)

```bash
bun add -D @playwright/test
bunx playwright install  # instala chromium, firefox, webkit
```

## Configuração (`playwright.config.ts`)

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
    { name: "webkit",   use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 12"] } },
  ],
});
```

## Executar

```bash
bunx playwright test tests/compatibility/ --project=chromium
bunx playwright test tests/compatibility/  # todos os browsers
```

## O que verificar

- Login GitHub OAuth funciona em todos os browsers
- Dashboard renderiza corretamente (barras █, fontes monospace)
- Settings form funciona em mobile (touch, virtual keyboard)
- Fontes Space Grotesk e JetBrains Mono carregam corretamente
