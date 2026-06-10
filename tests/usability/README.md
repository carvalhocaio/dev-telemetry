# Testes de Usabilidade (Usability Testing)

Testes automatizados de acessibilidade (a11y) e experiência do usuário. Complementam
testes manuais com usuários reais.

## Ferramenta recomendada: Playwright + axe-core

```bash
bun add -D @playwright/test @axe-core/playwright
bunx playwright install
```

## Executar

```bash
bunx playwright test tests/usability/
```

## O que verificar

1. **Acessibilidade WCAG 2.1 AA**
   - Contraste de cores (background `#0A0A0F`, texto `#E8E8E8` → ratio OK)
   - Labels em todos os inputs
   - `aria-*` attributes em componentes interativos
   - Navegação por teclado (Tab order, focus visible)

2. **UX flows**
   - Login → onboarding → dashboard em < 3 cliques
   - Mensagem de erro clara quando PAT é inválido
   - Progresso do backfill visível e atualizado em tempo real

3. **Responsive**
   - Dashboard legível em 375px (mobile)
   - Formulários de settings funcionando em touch
