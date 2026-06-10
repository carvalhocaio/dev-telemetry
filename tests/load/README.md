# Testes de Carga (Load Testing)

Testes que verificam o comportamento do sistema sob carga esperada — múltiplos usuários
simultâneos realizando operações normais.

## Ferramenta recomendada: k6

```bash
brew install k6  # macOS
# ou: https://k6.io/docs/getting-started/installation/
```

## Executar

```bash
k6 run tests/load/sync-api.js --vus 10 --duration 30s
```

## Script: sync-api.js

Simula 10 usuários fazendo sync incremental simultâneos.

**Thresholds sugeridos:**
- `http_req_duration p(95) < 2000ms` — 95% das respostas abaixo de 2s
- `http_req_failed < 0.01` — menos de 1% de erros
