# Testes Unitários

Testes que verificam uma única unidade de código em isolamento (função, classe ou módulo),
sem dependências externas reais.

## Localização

Os testes unitários ficam **co-localizados com o código-fonte** de cada pacote:

| Pacote | Localização |
|--------|-------------|
| `@dev-telemetry/crypto` | `packages/crypto/src/index.test.ts` |
| `@dev-telemetry/ai` | `packages/ai/src/index.test.ts` |
| `@dev-telemetry/core` | `packages/core/src/{classifier,bucket,reporting}.test.ts` |
| `apps/web` | `apps/web/{hooks,lib}/*.test.{ts,tsx}` |

## Executar

```bash
# todos os pacotes
turbo test

# pacote específico
cd packages/crypto && bun test
cd packages/core && bun test
```

## Convenção

- Arquivo: `<module>.test.ts` ao lado do módulo
- Framework: Vitest
- Mocks: `vi.mock` no topo do arquivo (hoisted)
- Sem chamadas de rede ou banco de dados reais
