# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for Account Manager role operations (``operations/roles``).

Mirrors ``packages/b2c-tooling-sdk/test/operations/roles/index.test.ts``. The
module is a thin re-export of the ``clients.am_api`` role functions, so these
tests mainly confirm the re-export wiring plus pagination/error behavior.
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients import AccountManagerClientConfig, create_account_manager_roles_client
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST
from b2c_tooling_sdk.operations.roles import ListRolesOptions, get_role, list_roles

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
    return create_account_manager_roles_client(AccountManagerClientConfig(), FakeAuth(header))


@respx.mock
async def test_get_role_returns_role() -> None:
    respx.get(f"{BASE}/roles/bm-admin").mock(
        return_value=httpx.Response(200, json={"id": "bm-admin", "roleEnumName": "ECOM_ADMIN"})
    )
    client = _client()

    role = await get_role(client, "bm-admin")

    assert role == {"id": "bm-admin", "roleEnumName": "ECOM_ADMIN"}


@respx.mock
async def test_get_role_not_found_raises() -> None:
    respx.get(f"{BASE}/roles/missing").mock(return_value=httpx.Response(404, json={"error": {"message": "not found"}}))
    client = _client()

    with pytest.raises(RuntimeError, match="Role missing not found"):
        await get_role(client, "missing")


@respx.mock
async def test_list_roles_applies_pagination_and_role_target_type() -> None:
    route = respx.get(f"{BASE}/roles").mock(return_value=httpx.Response(200, json={"content": []}))
    client = _client("Bearer roles-token")

    await list_roles(client, ListRolesOptions(size=10, page=2, role_target_type="User"))

    request = route.calls.last.request
    assert request.url.params["size"] == "10"
    assert request.url.params["page"] == "2"
    assert request.url.params["roleTargetType"] == "User"
    assert request.headers["Authorization"] == "Bearer roles-token"


@respx.mock
async def test_list_roles_defaults_when_no_options_given() -> None:
    route = respx.get(f"{BASE}/roles").mock(return_value=httpx.Response(200, json={"content": [{"id": "r1"}]}))
    client = _client()

    result = await list_roles(client)

    assert result == {"content": [{"id": "r1"}]}
    request = route.calls.last.request
    assert request.url.params["size"] == "20"
    assert request.url.params["page"] == "0"


@respx.mock
async def test_list_roles_out_of_bounds_raises_friendly_error() -> None:
    respx.get(f"{BASE}/roles").mock(
        return_value=httpx.Response(400, json={"errors": [{"message": "fromIndex: 100, toIndex: 20 out of bounds"}]})
    )
    client = _client()

    with pytest.raises(RuntimeError, match="out of bounds"):
        await list_roles(client, ListRolesOptions(page=5))
