# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for Account Manager user operations (``operations/users``).

Mirrors ``packages/b2c-tooling-sdk/test/operations/users/index.test.ts``. Uses
respx to mock the Account Manager Users API and a minimal fake auth strategy
(no 401-retry behavior is exercised here).
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients import AccountManagerClientConfig, create_account_manager_users_client
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST
from b2c_tooling_sdk.operations.users import (
    CreateUserOptions,
    GrantRoleOptions,
    RevokeRoleOptions,
    UpdateUserOptions,
    create_user,
    delete_user,
    get_user,
    get_user_by_login,
    grant_role,
    list_users,
    purge_user,
    reset_user,
    revoke_role,
    update_user,
)

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
    return create_account_manager_users_client(AccountManagerClientConfig(), FakeAuth(header))


# --- get_user / list_users / delete_user / purge_user / reset_user (re-exports) ---


@respx.mock
async def test_get_user_reexport_returns_user() -> None:
    respx.get(f"{BASE}/users/u1").mock(return_value=httpx.Response(200, json={"id": "u1"}))
    client = _client()

    user = await get_user(client, "u1")

    assert user == {"id": "u1"}


@respx.mock
async def test_list_users_reexport_returns_collection() -> None:
    respx.get(f"{BASE}/users").mock(return_value=httpx.Response(200, json={"content": [{"id": "u1"}]}))
    client = _client()

    result = await list_users(client)

    assert result == {"content": [{"id": "u1"}]}


@respx.mock
async def test_delete_user_reexport_disables_user() -> None:
    route = respx.post(f"{BASE}/users/u1/disable").mock(return_value=httpx.Response(200, json={}))
    client = _client()

    await delete_user(client, "u1")

    assert route.calls.call_count == 1


@respx.mock
async def test_purge_user_reexport_deletes_user() -> None:
    route = respx.delete(f"{BASE}/users/u1").mock(return_value=httpx.Response(204))
    client = _client()

    await purge_user(client, "u1")

    assert route.calls.call_count == 1


@respx.mock
async def test_reset_user_reexport_resets_user() -> None:
    route = respx.post(f"{BASE}/users/u1/reset").mock(return_value=httpx.Response(200, json={}))
    client = _client()

    await reset_user(client, "u1")

    assert route.calls.call_count == 1


# --- get_user_by_login -------------------------------------------------------------


@respx.mock
async def test_get_user_by_login_found() -> None:
    respx.get(f"{BASE}/users/search/findByLogin").mock(
        return_value=httpx.Response(200, json={"id": "u1", "mail": "user@example.com"})
    )
    client = _client()

    user = await get_user_by_login(client, "user@example.com")

    assert user == {"id": "u1", "mail": "user@example.com"}


@respx.mock
async def test_get_user_by_login_not_found_raises() -> None:
    respx.get(f"{BASE}/users/search/findByLogin").mock(return_value=httpx.Response(404, json={}))
    client = _client()

    with pytest.raises(RuntimeError, match="User missing@example.com not found"):
        await get_user_by_login(client, "missing@example.com")


# --- create_user / update_user ------------------------------------------------------


@respx.mock
async def test_create_user_posts_user_body() -> None:
    route = respx.post(f"{BASE}/users").mock(return_value=httpx.Response(201, json={"id": "new-user"}))
    client = _client("Bearer create-token")

    result = await create_user(client, CreateUserOptions(user={"mail": "new@example.com"}))

    assert result == {"id": "new-user"}
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer create-token"
    import json as json_module

    assert json_module.loads(request.content) == {"mail": "new@example.com"}


@respx.mock
async def test_create_user_raises_on_error() -> None:
    respx.post(f"{BASE}/users").mock(return_value=httpx.Response(400, json={"error": {"message": "invalid mail"}}))
    client = _client()

    with pytest.raises(RuntimeError, match="invalid mail"):
        await create_user(client, CreateUserOptions(user={"mail": "bad"}))


@respx.mock
async def test_update_user_puts_changes() -> None:
    route = respx.put(f"{BASE}/users/u1").mock(return_value=httpx.Response(200, json={"id": "u1", "firstName": "Jane"}))
    client = _client()

    result = await update_user(client, UpdateUserOptions(user_id="u1", changes={"firstName": "Jane"}))

    assert result == {"id": "u1", "firstName": "Jane"}
    import json as json_module

    assert json_module.loads(route.calls.last.request.content) == {"firstName": "Jane"}


# --- grant_role ----------------------------------------------------------------------


@respx.mock
async def test_grant_role_adds_role_and_scope() -> None:
    respx.get(f"{BASE}/users/u1").mock(
        return_value=httpx.Response(200, json={"id": "u1", "roles": [], "roleTenantFilter": ""})
    )
    update_route = respx.put(f"{BASE}/users/u1").mock(
        return_value=httpx.Response(200, json={"id": "u1", "roles": ["bm-admin"]})
    )
    client = _client()

    user = await grant_role(
        client,
        GrantRoleOptions(user_id="u1", role="bm-admin", role_enum_name="ECOM_ADMIN", scope="abcd_prd"),
    )

    assert user == {"id": "u1", "roles": ["bm-admin"]}
    import json as json_module

    body = json_module.loads(update_route.calls.last.request.content)
    assert body["roles"] == ["bm-admin"]
    assert body["roleTenantFilter"] == "ECOM_ADMIN:abcd_prd"


@respx.mock
async def test_grant_role_does_not_duplicate_existing_role() -> None:
    respx.get(f"{BASE}/users/u1").mock(
        return_value=httpx.Response(
            200, json={"id": "u1", "roles": ["bm-admin"], "roleTenantFilter": "ECOM_ADMIN:abcd_prd"}
        )
    )
    update_route = respx.put(f"{BASE}/users/u1").mock(return_value=httpx.Response(200, json={"id": "u1"}))
    client = _client()

    await grant_role(client, GrantRoleOptions(user_id="u1", role="bm-admin", role_enum_name="ECOM_ADMIN"))

    import json as json_module

    body = json_module.loads(update_route.calls.last.request.content)
    assert body["roles"] == ["bm-admin"]
    # No scope provided -- existing filter is preserved verbatim (not touched).
    assert body["roleTenantFilter"] == "ECOM_ADMIN:abcd_prd"


# --- revoke_role ----------------------------------------------------------------------


@respx.mock
async def test_revoke_role_without_scope_removes_entire_role() -> None:
    respx.get(f"{BASE}/users/u1").mock(
        return_value=httpx.Response(
            200,
            json={
                "id": "u1",
                "roles": ["bm-admin", "bm-other"],
                "roleTenantFilter": "ECOM_ADMIN:abcd_prd;ECOM_OTHER:wxyz_stg",
            },
        )
    )
    update_route = respx.put(f"{BASE}/users/u1").mock(return_value=httpx.Response(200, json={"id": "u1"}))
    client = _client()

    await revoke_role(client, RevokeRoleOptions(user_id="u1", role="bm-admin", role_enum_name="ECOM_ADMIN"))

    import json as json_module

    body = json_module.loads(update_route.calls.last.request.content)
    assert body["roles"] == ["bm-other"]
    assert body["roleTenantFilter"] == "ECOM_OTHER:wxyz_stg"


@respx.mock
async def test_revoke_role_with_scope_removes_only_that_scope() -> None:
    respx.get(f"{BASE}/users/u1").mock(
        return_value=httpx.Response(
            200,
            json={"id": "u1", "roles": ["bm-admin"], "roleTenantFilter": "ECOM_ADMIN:abcd_prd,wxyz_stg"},
        )
    )
    update_route = respx.put(f"{BASE}/users/u1").mock(return_value=httpx.Response(200, json={"id": "u1"}))
    client = _client()

    await revoke_role(
        client,
        RevokeRoleOptions(user_id="u1", role="bm-admin", role_enum_name="ECOM_ADMIN", scope="abcd_prd"),
    )

    import json as json_module

    body = json_module.loads(update_route.calls.last.request.content)
    # Role stays in the array -- the TS operations/users revokeRole only drops
    # the role from the `roles` array when no scope is provided.
    assert body["roles"] == ["bm-admin"]
    assert body["roleTenantFilter"] == "ECOM_ADMIN:wxyz_stg"


@respx.mock
async def test_revoke_role_with_scope_that_empties_filter_keeps_role_in_array() -> None:
    respx.get(f"{BASE}/users/u1").mock(
        return_value=httpx.Response(
            200,
            json={"id": "u1", "roles": ["bm-admin"], "roleTenantFilter": "ECOM_ADMIN:abcd_prd"},
        )
    )
    update_route = respx.put(f"{BASE}/users/u1").mock(return_value=httpx.Response(200, json={"id": "u1"}))
    client = _client()

    await revoke_role(
        client,
        RevokeRoleOptions(user_id="u1", role="bm-admin", role_enum_name="ECOM_ADMIN", scope="abcd_prd"),
    )

    import json as json_module

    body = json_module.loads(update_route.calls.last.request.content)
    assert body["roles"] == ["bm-admin"]
    assert body["roleTenantFilter"] is None


@respx.mock
async def test_revoke_role_raises_when_user_lookup_fails() -> None:
    respx.get(f"{BASE}/users/missing").mock(return_value=httpx.Response(404, json={"error": {"message": "not found"}}))
    client = _client()

    with pytest.raises(RuntimeError, match="User missing not found"):
        await revoke_role(client, RevokeRoleOptions(user_id="missing", role="bm-admin", role_enum_name="ECOM_ADMIN"))
