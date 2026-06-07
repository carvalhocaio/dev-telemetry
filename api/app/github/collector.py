from datetime import UTC, datetime, timedelta

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.github.client import JSON, GitHubClient
from app.models import Commit, PullRequest, Repository

DEFAULT_WINDOW_DAYS = 90
INCREMENTAL_WINDOW_DAYS = 30


class GitHubCollector:
    def __init__(
        self,
        client: GitHubClient,
        session: AsyncSession,
        *,
        org: str,
        username: str,
        window_days: int = DEFAULT_WINDOW_DAYS,
    ) -> None:
        self._client = client
        self._session = session
        self._org = org
        self._username = username
        self._since = datetime.now(UTC) - timedelta(days=window_days)

    async def collect(self) -> None:
        repos = await self._client.list_org_repos(self._org)
        for repo in repos:
            repo_id = await self._upsert_repository(repo)
            await self._collect_commits(repo, repo_id)
            await self._collect_pull_requests(repo, repo_id)
        await self._session.commit()

    async def _upsert_repository(self, repo: JSON) -> int:
        values = {
            "github_id": repo["id"],
            "name": repo["name"],
            "full_name": repo["full_name"],
        }
        stmt = (
            pg_insert(Repository)
            .values(**values)
            .on_conflict_do_update(
                index_elements=[Repository.github_id],
                set_={"name": values["name"], "full_name": values["full_name"]},
            )
            .returning(Repository.id)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one()

    async def _collect_commits(self, repo: JSON, repo_id: int) -> None:
        owner, name = repo["owner"]["login"], repo["name"]
        commits = await self._client.list_commits(
            owner, name, author=self._username, since=self._since
        )
        for item in commits:
            detail = await self._client.get_commit(owner, name, item["sha"])
            await self._upsert_commit(detail, repo_id)

    async def _upsert_commit(self, detail: JSON, repo_id: int) -> None:
        stats = detail.get("stats", {})
        files = detail.get("files", [])
        patch = "\n".join(f["patch"] for f in files if f.get("patch")) or None
        commit_data = detail["commit"]
        stmt = (
            pg_insert(Commit)
            .values(
                repo_id=repo_id,
                sha=detail["sha"],
                message=commit_data["message"],
                authored_at=self._parse_dt(commit_data["author"]["date"]),
                additions=stats.get("additions", 0),
                deletions=stats.get("deletions", 0),
                changed_files=len(files),
                patch=patch,
                html_url=detail["html_url"],
            )
            .on_conflict_do_nothing(index_elements=[Commit.sha])
        )
        await self._session.execute(stmt)

    async def _collect_pull_requests(self, repo: JSON, repo_id: int) -> None:
        owner, name = repo["owner"]["login"], repo["name"]
        pulls = await self._client.list_pull_requests(owner, name)
        for item in pulls:
            if self._parse_dt(item["created_at"]) < self._since:
                break
            if item["user"]["login"] != self._username:
                continue
            detail = await self._client.get_pull_request(owner, name, item["number"])
            await self._upsert_pull_request(detail, repo_id)

    async def _upsert_pull_request(self, detail: JSON, repo_id: int) -> None:
        mutable = {
            "title": detail["title"],
            "body": detail.get("body"),
            "state": self._pr_state(detail),
            "gh_merged_at": self._parse_optional_dt(detail.get("merged_at")),
            "additions": detail.get("additions", 0),
            "deletions": detail.get("deletions", 0),
            "changed_files": detail.get("changed_files", 0),
        }
        stmt = (
            pg_insert(PullRequest)
            .values(
                repo_id=repo_id,
                number=detail["number"],
                gh_created_at=self._parse_dt(detail["created_at"]),
                html_url=detail["html_url"],
                **mutable,
            )
            .on_conflict_do_update(
                index_elements=[PullRequest.repo_id, PullRequest.number],
                set_=mutable,
            )
        )
        await self._session.execute(stmt)

    @staticmethod
    def _pr_state(detail: JSON) -> str:
        return "merged" if detail.get("merged_at") else detail["state"]

    @staticmethod
    def _parse_dt(value: str) -> datetime:
        return datetime.fromisoformat(value)

    @staticmethod
    def _parse_optional_dt(value: str | None) -> datetime | None:
        return datetime.fromisoformat(value) if value else None
