from pathlib import Path

from google import genai
from google.genai import types

from app.analysis.classifier import Level
from app.config import get_settings
from app.schemas.narrative import Narrative

MODEL = "gemini-3.5-flash"
TEMPERATURE = 0.2

MAX_ITEMS_PER_KIND = 40
MAX_CHARS_PER_ITEM = 600

_DOCS_ROOT = Path(__file__).resolve().parents[4] / "docs"
_MARKET_REF_PATH = _DOCS_ROOT / "data_engineer_pleno.md"

_SYSTEM_INSTRUCTION = (
    "Você é um analista técnico que interpreta a atividade de um engenheiro "
    "de dados pleno (que também desenvolve agentes de IA) a partir das mensagens "
    "de commit e descrições de pull request que ELE MESMO escreveu.\n\n"
    "Regras invioláveis:\n"
    "- O NÍVEL de desempenho já foi decidido por um classificador determinístico "
    "e é informado a você. NÃO o questione, NÃO o recalcule, NÃO discorde dele. "
    "Sua tarefa é INTERPRETAR o trabalho, não avaliá-lo numericamente.\n"
    "- Baseie-se SOMENTE no conteúdo textual fornecido. Não invente trabalho que "
    "não está descrito. Se o conteúdo for escasso, diga isso honestamente.\n"
    "- Atividade (commits/PRs) mede o que foi feito, não o impacto no negócio. "
    "Seja descritivo, não bajulador.\n"
    "- Responda em português do Brasil."
)


def _load_market_reference() -> str | None:
    try:
        return _MARKET_REF_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None


class NarrativeGenerator:
    def __init__(self, *, include_patches: bool = False) -> None:
        settings = get_settings()
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._include_patches = include_patches
        self._market_ref = _load_market_reference()

    async def generate(
        self,
        *,
        period: str,
        level: Level,
        commit_messages: list[str],
        pr_texts: list[str],
        patches: list[str] | None = None,
    ) -> Narrative:
        prompt = self._build_prompt(
            period=period,
            level=level,
            commit_messages=commit_messages,
            pr_texts=pr_texts,
            patches=patches,
        )
        response = await self._client.aio.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                temperature=TEMPERATURE,
                response_mime_type="application/json",
                response_schema=Narrative,
            ),
        )
        parsed = response.parsed
        if isinstance(parsed, Narrative):
            return parsed
        if response.text is None:
            raise ValueError(
                "A resposta da API não contém dados para serem analisados."
            )
        return Narrative.model_validate_json(response.text)

    def _build_prompt(
        self,
        *,
        period: str,
        level: Level,
        commit_messages: list[str],
        pr_texts: list[str],
        patches: list[str] | None,
    ) -> str:
        commits_block = self._format_block(commit_messages)
        prs_block = self._format_block(pr_texts)

        sections = [
            f"PERÍODO: {period}",
            f"NÍVEL JÁ ATRIBUÍDO PELO CLASSIFICADOR: {level.value}",
            "",
            "MENSAGENS DE COMMIT DO PERÍODO:",
            commits_block or "(nenhuma)",
            "",
            "TÍTULOS E DESCRIÇÕES DE PULL REQUESTS DO PERÍODO:",
            prs_block or "(nenhum)",
        ]

        if self._include_patches and patches:
            sections += ["", "DIFFS (amostra):", self._format_block(patches)]

        if self._market_ref:
            sections += [
                "",
                "RUBRICA DE MERCADO (referência para interpretação dos níveis):",
                self._market_ref,
            ]

        sections += [
            "",
            "Interprete este período. Produza o JSON conforme o schema.",
        ]
        return "\n".join(sections)

    @classmethod
    def _format_block(cls, items: list[str]) -> str:
        clipped = [cls._clip(it) for it in items[:MAX_ITEMS_PER_KIND]]
        return "\n".join(f"- {it}" for it in clipped if it.strip())

    @staticmethod
    def _clip(text: str) -> str:
        text = text.strip()
        if len(text) <= MAX_CHARS_PER_ITEM:
            return text
        return text[:MAX_CHARS_PER_ITEM] + "..."

    async def aclose(self) -> None:
        await self._client.aio.aclose()
