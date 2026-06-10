# Testes de Estresse (Stress Testing)

Testes que empurram o sistema além da capacidade esperada para encontrar o ponto de quebra,
verificar recuperação e identificar vazamentos de memória.

## Ferramenta recomendada: k6

```bash
k6 run tests/stress/api-stress.js
```

## Diferença de Load vs Stress

| | Load | Stress |
|---|---|---|
| Objetivo | Verificar comportamento normal | Encontrar limite e recuperação |
| VUs | Esperado em produção | 2-10× o esperado |
| Duração | Sustentada | Ramp up → pico → ramp down |

## Métricas monitoradas

- Erros 5xx (não deve ultrapassar 1% em pico)
- Tempo de resposta degradando mas não falhando
- Memória do processo Node.js (sem vazamento)
- Recuperação após o pico (p95 volta ao normal em < 30s)
