from pydantic import BaseModel, Field


class Narrative(BaseModel):
    summary: str = Field(
        description="Resumo interpretativo do trabalho no período, em 2-3 frases."
    )
    themes: list[str] = Field(
        description="Temas técnicos recorrentes identificados (ex: 'refatoração', "
        "'integração de API', 'correção de bugs'). Máximo 5."
    )
    strengths: list[str] = Field(
        description="Sinais positivos no trabalho do período. Máximo 3."
    )
    watchouts: list[str] = Field(
        description="Pontos de atenção ou possíveis fragilidades. Máximo 3. "
        "Lista vazia se não houver."
    )


class NarrativeResponse(BaseModel):
    period: str
    level: str
    model: str
    narrative: Narrative
