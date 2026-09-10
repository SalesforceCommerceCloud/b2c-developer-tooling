# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for Account Manager organization operations (``operations/orgs``).

Mirrors ``packages/b2c-tooling-sdk/test/operations/orgs/index.test.ts``. The
module simply delegates to the hand-rolled :class:`AccountManagerOrgsClient`,
so these tests cover the delegation plus the client's not-found/ambiguous-name
error paths surfaced through the operations functions.
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients import AccountManagerClientConfig, create_account_manager_orgs_client
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST
from b2c_tooling_sdk.operations.orgs import ListOrgsOptions, get_org, get_org_by_name, list_orgs

BASE = f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1"


class FakeAuth:
    """Minimal auth strategy: header injection only."""

    def __init__(self, header: str = "Bearer test-token") -> None:
        self._header = header

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        pass


def _client(header: str = "Bearer test-token") -> object:
    return create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth(header))


@respx.mock
async def test_get_org_returns_org_and_strips_links() -> None:
    respx.get(f"{BASE}/organizations/org-1").mock(
        return_value=httpx.Response(200, json={"id": "org-1", "name": "Acme", "links": {"self": "..."}})
    )
    client = _client("Bearer org-token")

    org = await get_org(client, "org-1")

    assert org == {"id": "org-1", "name": "Acme"}


@respx.mock
async def test_get_org_not_found_raises() -> None:
    respx.get(f"{BASE}/organizations/missing").mock(return_value=httpx.Response(404, json={}))
    client = _client()

    with pytest.raises(RuntimeError, match="Organization missing not found"):
        await get_org(client, "missing")


@respx.mock
async def test_get_org_forbidden_raises() -> None:
    respx.get(f"{BASE}/organizations/org-1").mock(return_value=httpx.Response(403, json={}))
    client = _client()

    with pytest.raises(RuntimeError, match="Operation forbidden"):
        await get_org(client, "org-1")


@respx.mock
async def test_get_org_by_name_finds_exact_match_among_prefix_results() -> None:
    route = respx.get(f"{BASE}/organizations/search/findByName").mock(
        return_value=httpx.Response(
            200,
            json={
                "content": [
                    {"id": "org-1", "name": "Acme Corp"},
                    {"id": "org-2", "name": "Acme"},
                ]
            },
        )
    )
    client = _client()

    org = await get_org_by_name(client, "Acme")

    assert org == {"id": "org-2", "name": "Acme"}
    request = route.calls.last.request
    assert request.url.params["startsWith"] == "Acme"


@respx.mock
async def test_get_org_by_name_ambiguous_raises() -> None:
    respx.get(f"{BASE}/organizations/search/findByName").mock(
        return_value=httpx.Response(
            200, json={"content": [{"id": "org-1", "name": "Acme Corp"}, {"id": "org-2", "name": "Acme Inc"}]}
        )
    )
    client = _client()

    with pytest.raises(RuntimeError, match="is ambiguous"):
        await get_org_by_name(client, "Acme")


@respx.mock
async def test_get_org_by_name_not_found_raises() -> None:
    respx.get(f"{BASE}/organizations/search/findByName").mock(return_value=httpx.Response(200, json={"content": []}))
    client = _client()

    with pytest.raises(RuntimeError, match="Organization NoSuchOrg not found"):
        await get_org_by_name(client, "NoSuchOrg")


@respx.mock
async def test_list_orgs_applies_pagination() -> None:
    route = respx.get(f"{BASE}/organizations").mock(
        return_value=httpx.Response(200, json={"content": [{"id": "org-1", "name": "Acme"}], "totalElements": 1})
    )
    client = _client()

    result = await list_orgs(client, ListOrgsOptions(size=10, page=1))

    assert result["content"] == [{"id": "org-1", "name": "Acme"}]
    request = route.calls.last.request
    assert request.url.params["size"] == "10"
    assert request.url.params["page"] == "1"


@respx.mock
async def test_list_orgs_all_uses_max_page_size() -> None:
    route = respx.get(f"{BASE}/organizations").mock(return_value=httpx.Response(200, json={"content": []}))
    client = _client()

    await list_orgs(client, ListOrgsOptions(all=True))

    request = route.calls.last.request
    assert request.url.params["size"] == "5000"
    assert request.url.params["page"] == "0"


@respx.mock
async def test_list_orgs_defaults_when_no_options_given() -> None:
    route = respx.get(f"{BASE}/organizations").mock(return_value=httpx.Response(200, json={"content": []}))
    client = _client()

    await list_orgs(client)

    request = route.calls.last.request
    assert request.url.params["size"] == "25"
    assert request.url.params["page"] == "0"
