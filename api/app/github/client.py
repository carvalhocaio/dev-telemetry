from datetime import datetime
from typing import Any

import httpx

from app.config import get_settings

type JSON = dict[str, Any]

GITHUB_API_URL = "https://api.github.com"
API_VERSION = "2022-11-28"
DEFAULT_PER_PAGE = 100
EMPTY_REPOSITORY_STATUS = 409


class GitHubClient:
    def __init__(
        self,
        token: str,
        *,
        base_url: str = GITHUB_API_URL,
        timeout: float = 30.0,
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            timeout=timeout,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": API_VERSION,
            },
        )

    async def __aenter__(self) -> "GitHubClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _get(self, url: str, params: JSON | None = None) -> httpx.Response:
        response = await self._client.get(url, params=params)
        response.raise_for_status()
        return response

    async def _paginate(self, path: str, params: JSON | None = None) -> list[JSON]:
        results: list[JSON] = []
        query: JSON | None = {"per_page": DEFAULT_PER_PAGE, **(params or {})}
        next_url: str | None = path

        while next_url is not None:
            response = await self._get(next_url, params=query)
            results.extend(response.json())
            next_url = response.links.get("next", {}).get("url")
            query = None
        return results

    async def list_org_repos(self, org: str) -> list[JSON]:
        return await self._paginate(f"/orgs/{org}/repos", {"type": "all"})

    async def list_commits(
        self, owner: str, repo: str, *, author: str, since: datetime
    ) -> list[JSON]:
        try:
            return await self._paginate(
                f"/repos/{owner}/{repo}/commits",
                {"author": author, "since": since.isoformat()},
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == EMPTY_REPOSITORY_STATUS:
                return []
            raise

    async def get_commit(self, owner: str, repo: str, sha: str) -> JSON:
        response = await self._get(f"/repos/{owner}/{repo}/commits/{sha}")
        return response.json()

    async def list_pull_requests(self, owner: str, repo: str) -> list[JSON]:
        return await self._paginate(
            f"/repos/{owner}/{repo}/pulls",
            {"state": "all", "sort": "created", "direction": "desc"},
        )

    async def get_pull_request(self, owner: str, repo: str, number: int) -> JSON:
        response = await self._get(f"/repos/{owner}/{repo}/pulls/{number}")
        return response.json()


def create_github_client() -> GitHubClient:
    settings = get_settings()
    return GitHubClient(token=settings.github_token)
