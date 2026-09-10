# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the Account Manager API client (``clients/am_api.py``).

Mirrors ``packages/b2c-tooling-sdk/test/clients/am-api.test.ts``. Covers each
factory's base URL (default + overridden host), the role-tenant-filter regex,
and at least one respx-mocked authenticated request per distinct code path:
users/roles/apiclients (standard :class:`HttpClient` + pageable-transform
middleware), the orgs client's hand-rolled request/error logic, and the
unified :class:`AccountManagerClient` (including ``grant_role``).
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.am_api import (
    ROLE_TENANT_FILTER_PATTERN,
    AccountManagerClientConfig,
    AccountManagerOrgsClient,
    AccountManagerUsersClient,
    ListOrgsOptions,
    ListRolesOptions,
    ListUsersOptions,
    OrgMapping,
    RoleMapping,
    create_account_manager_api_clients_client,
    create_account_manager_client,
    create_account_manager_orgs_client,
    create_account_manager_roles_client,
    create_account_manager_users_client,
    get_user,
    is_valid_role_tenant_filter,
    list_roles,
    list_users,
    resolve_from_internal_role,
    resolve_to_internal_role,
)
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST

CUSTOM_HOST = "account-pod5.demandware.net"


class FakeAuth:
    """Minimal auth strategy: header injection only (no 401 retry needed for these tests)."""

    def __init__(self, header: str = "Bearer test-token") -> None:
        self._header = header
        self.invalidated = False

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated = True

    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:  # pragma: no cover - unused
        raise NotImplementedError


# --- ROLE_TENANT_FILTER_PATTERN / is_valid_role_tenant_filter --------------------


@pytest.mark.parametrize(
    "value",
    [
        "SALESFORCE_COMMERCE_API:abcd_prd",
        "ROLE_ADMIN:abcd_prd,wxyz_stg;ECOM_USER:zzzz_001",
        "ECOM_ADMIN:zzzz_001",
        "",
    ],
)
def test_role_tenant_filter_pattern_matches_valid_values(value: str) -> None:
    assert bool(ROLE_TENANT_FILTER_PATTERN.match(value)) is True


@pytest.mark.parametrize(
    "value",
    [
        "not-a-valid-filter",
        "ROLE:short_1",
        "ROLE:abcd_prd:extra",
        "  ROLE:abcd_prd",
    ],
)
def test_role_tenant_filter_pattern_rejects_invalid_values(value: str) -> None:
    assert bool(ROLE_TENANT_FILTER_PATTERN.match(value)) is False


def test_is_valid_role_tenant_filter_rejects_empty_string() -> None:
    # The regex matches an empty string, but is_valid_role_tenant_filter requires len > 0.
    assert bool(ROLE_TENANT_FILTER_PATTERN.match("")) is True
    assert is_valid_role_tenant_filter("") is False


def test_is_valid_role_tenant_filter_accepts_valid_value() -> None:
    assert is_valid_role_tenant_filter("SALESFORCE_COMMERCE_API:abcd_prd") is True


def test_is_valid_role_tenant_filter_rejects_invalid_value() -> None:
    assert is_valid_role_tenant_filter("not valid!") is False


# --- role resolution helpers ------------------------------------------------------


def _mapping() -> RoleMapping:
    return RoleMapping(
        by_id={"bm-admin": "ECOM_ADMIN"},
        by_enum_name={"ECOM_ADMIN": "bm-admin"},
        descriptions={"ECOM_ADMIN": "Business Manager Administrator"},
    )


def test_resolve_to_internal_role_from_id() -> None:
    assert resolve_to_internal_role("bm-admin", _mapping()) == "ECOM_ADMIN"


def test_resolve_to_internal_role_already_enum_name() -> None:
    assert resolve_to_internal_role("ECOM_ADMIN", _mapping()) == "ECOM_ADMIN"


def test_resolve_to_internal_role_falls_back_to_generic_transform() -> None:
    assert resolve_to_internal_role("some-unknown-role", _mapping()) == "SOME_UNKNOWN_ROLE"


def test_resolve_from_internal_role_known() -> None:
    assert resolve_from_internal_role("ECOM_ADMIN", _mapping()) == "bm-admin"


def test_resolve_from_internal_role_falls_back_to_generic_transform() -> None:
    assert resolve_from_internal_role("SOME_UNKNOWN_ROLE", _mapping()) == "some-unknown-role"


# --- factory: base URL (default + overridden host) ------------------------------


def test_create_users_client_uses_default_host() -> None:
    client = create_account_manager_users_client(AccountManagerClientConfig(), FakeAuth())
    assert isinstance(client, AccountManagerUsersClient)
    assert client.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}"
    assert client.client_type == "am-users-api"


def test_create_users_client_honors_hostname_override() -> None:
    client = create_account_manager_users_client(AccountManagerClientConfig(hostname=CUSTOM_HOST), FakeAuth())
    assert client.base_url == f"https://{CUSTOM_HOST}"


def test_create_roles_client_uses_default_host() -> None:
    client = create_account_manager_roles_client(AccountManagerClientConfig(), FakeAuth())
    assert client.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}"
    assert client.client_type == "am-roles-api"


def test_create_roles_client_honors_hostname_override() -> None:
    client = create_account_manager_roles_client(AccountManagerClientConfig(hostname=CUSTOM_HOST), FakeAuth())
    assert client.base_url == f"https://{CUSTOM_HOST}"


def test_create_api_clients_client_uses_default_host() -> None:
    client = create_account_manager_api_clients_client(AccountManagerClientConfig(), FakeAuth())
    assert client.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}"
    assert client.client_type == "am-apiclients-api"


def test_create_api_clients_client_honors_hostname_override() -> None:
    client = create_account_manager_api_clients_client(AccountManagerClientConfig(hostname=CUSTOM_HOST), FakeAuth())
    assert client.base_url == f"https://{CUSTOM_HOST}"


def test_create_orgs_client_uses_default_host() -> None:
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth())
    assert isinstance(client, AccountManagerOrgsClient)
    assert client._http.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1"
    assert client._http.client_type == "am-orgs-api"


def test_create_orgs_client_honors_hostname_override() -> None:
    client = create_account_manager_orgs_client(AccountManagerClientConfig(hostname=CUSTOM_HOST), FakeAuth())
    assert client._http.base_url == f"https://{CUSTOM_HOST}/dw/rest/v1"


def test_create_account_manager_client_uses_default_host_for_all_subclients() -> None:
    client = create_account_manager_client(AccountManagerClientConfig(), FakeAuth())
    assert client._users.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}"
    assert client._roles.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}"
    assert client._api_clients.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}"
    assert client._orgs._http.base_url == f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1"


def test_create_account_manager_client_honors_hostname_override() -> None:
    client = create_account_manager_client(AccountManagerClientConfig(hostname=CUSTOM_HOST), FakeAuth())
    assert client._users.base_url == f"https://{CUSTOM_HOST}"
    assert client._orgs._http.base_url == f"https://{CUSTOM_HOST}/dw/rest/v1"


# --- Users API: pageable-transform + authenticated request ----------------------


@respx.mock
async def test_list_users_flattens_pageable_query_and_authenticates() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/users").mock(
        return_value=httpx.Response(200, json={"content": [{"id": "u1"}], "totalElements": 1})
    )
    client = create_account_manager_users_client(AccountManagerClientConfig(), FakeAuth("Bearer abc"))

    result = await list_users(client, ListUsersOptions(size=5, page=1))

    assert result == {"content": [{"id": "u1"}], "totalElements": 1}
    request = route.calls.last.request
    assert request.method == "GET"
    assert request.url.params["size"] == "5"
    assert request.url.params["page"] == "1"
    assert "pageable[size]" not in request.url.params
    assert "pageable[page]" not in request.url.params
    assert request.headers["Authorization"] == "Bearer abc"


@respx.mock
async def test_get_user_not_found_raises() -> None:
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/users/missing").mock(
        return_value=httpx.Response(404, json={"error": {"message": "not found"}})
    )
    client = create_account_manager_users_client(AccountManagerClientConfig(), FakeAuth())

    with pytest.raises(RuntimeError, match="User missing not found"):
        await get_user(client, "missing")


@respx.mock
async def test_get_user_with_expand_serializes_repeated_query_params() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/users/u1").mock(
        return_value=httpx.Response(200, json={"id": "u1"})
    )
    client = create_account_manager_users_client(AccountManagerClientConfig(), FakeAuth())

    result = await get_user(client, "u1", ["organizations", "roles"])

    assert result == {"id": "u1"}
    request = route.calls.last.request
    assert request.url.params.get_list("expand") == ["organizations", "roles"]


# --- Roles API: pageable-transform + roleTargetType ------------------------------


@respx.mock
async def test_list_roles_applies_pageable_transform_and_role_target_type() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/roles").mock(
        return_value=httpx.Response(200, json={"content": []})
    )
    client = create_account_manager_roles_client(AccountManagerClientConfig(), FakeAuth("Bearer roles-token"))

    await list_roles(client, ListRolesOptions(size=10, page=2, role_target_type="User"))

    request = route.calls.last.request
    assert request.url.params["size"] == "10"
    assert request.url.params["page"] == "2"
    assert request.url.params["roleTargetType"] == "User"
    assert request.headers["Authorization"] == "Bearer roles-token"


@respx.mock
async def test_list_roles_out_of_bounds_error() -> None:
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/roles").mock(
        return_value=httpx.Response(400, json={"errors": [{"message": "fromIndex: 100, toIndex: 20 out of bounds"}]})
    )
    client = create_account_manager_roles_client(AccountManagerClientConfig(), FakeAuth())

    with pytest.raises(RuntimeError, match="out of bounds"):
        await list_roles(client, ListRolesOptions(page=5))


# --- API Clients API --------------------------------------------------------------


@respx.mock
async def test_create_api_client_omits_active_when_false() -> None:
    route = respx.post(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/apiclients").mock(
        return_value=httpx.Response(201, json={"id": "client-1"})
    )
    client = create_account_manager_api_clients_client(AccountManagerClientConfig(), FakeAuth("Bearer apic"))

    from b2c_tooling_sdk.clients.am_api import create_api_client

    result = await create_api_client(client, {"displayName": "Test", "active": False})

    assert result == {"id": "client-1"}
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer apic"
    import json as json_module

    body = json_module.loads(request.content)
    assert "active" not in body
    assert body["displayName"] == "Test"


@respx.mock
async def test_create_api_client_field_hint_error_message() -> None:
    respx.post(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/apiclients").mock(
        return_value=httpx.Response(
            400,
            json={
                "errors": [
                    {
                        "message": "Validation failed",
                        "fieldErrors": [{"field": "displayName", "defaultMessage": "must not be blank"}],
                    }
                ]
            },
        )
    )
    client = create_account_manager_api_clients_client(AccountManagerClientConfig(), FakeAuth())

    from b2c_tooling_sdk.clients.am_api import create_api_client

    with pytest.raises(RuntimeError, match=r"Validation failed \(displayName: must not be blank\)"):
        await create_api_client(client, {"displayName": ""})


@respx.mock
async def test_delete_api_client_412_maps_to_friendly_message() -> None:
    respx.delete(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/apiclients/c1").mock(
        return_value=httpx.Response(412, json={"error": {"message": "Precondition Failed"}})
    )
    client = create_account_manager_api_clients_client(AccountManagerClientConfig(), FakeAuth())

    from b2c_tooling_sdk.clients.am_api import delete_api_client

    with pytest.raises(RuntimeError, match="disabled for at least 7 days"):
        await delete_api_client(client, "c1")


# --- Organizations API: hand-rolled request/error logic --------------------------


@respx.mock
async def test_orgs_get_org_success_strips_links_and_authenticates() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations/org-1").mock(
        return_value=httpx.Response(200, json={"id": "org-1", "name": "Acme", "links": {"self": "..."}})
    )
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth("Bearer org-token"))

    org = await client.get_org("org-1")

    assert org == {"id": "org-1", "name": "Acme"}
    request = route.calls.last.request
    assert request.method == "GET"
    assert request.headers["Authorization"] == "Bearer org-token"


@respx.mock
async def test_orgs_get_org_404_raises_not_found() -> None:
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations/missing").mock(
        return_value=httpx.Response(404, json={})
    )
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth())

    with pytest.raises(RuntimeError, match="Organization missing not found"):
        await client.get_org("missing")


@respx.mock
async def test_orgs_get_org_401_raises_auth_invalid_with_no_retry() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations/org-1").mock(
        return_value=httpx.Response(401, json={})
    )
    auth = FakeAuth()
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), auth)

    with pytest.raises(RuntimeError, match="Authentication invalid"):
        await client.get_org("org-1")

    # No 401-retry logic for the orgs client (unlike the retrying auth middleware
    # used by users/roles/apiclients).
    assert route.calls.call_count == 1
    assert auth.invalidated is False


@respx.mock
async def test_orgs_get_org_403_raises_forbidden() -> None:
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations/org-1").mock(
        return_value=httpx.Response(403, json={})
    )
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth())

    with pytest.raises(RuntimeError, match="Operation forbidden"):
        await client.get_org("org-1")


@respx.mock
async def test_orgs_get_org_by_name_encodes_and_finds_exact_match() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations/search/findByName").mock(
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
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth())

    org = await client.get_org_by_name("Acme")

    assert org == {"id": "org-2", "name": "Acme"}
    request = route.calls.last.request
    assert request.url.params["startsWith"] == "Acme"
    assert request.url.params["ignoreCase"] == "false"


@respx.mock
async def test_orgs_get_org_by_name_ambiguous_raises() -> None:
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations/search/findByName").mock(
        return_value=httpx.Response(
            200,
            json={"content": [{"id": "org-1", "name": "Acme Corp"}, {"id": "org-2", "name": "Acme Inc"}]},
        )
    )
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth())

    with pytest.raises(RuntimeError, match="is ambiguous"):
        await client.get_org_by_name("Acme")


@respx.mock
async def test_orgs_list_orgs_all_uses_max_page_size_and_strips_links() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations").mock(
        return_value=httpx.Response(
            200, json={"content": [{"id": "org-1", "name": "Acme", "links": {}}], "totalElements": 1}
        )
    )
    client = create_account_manager_orgs_client(AccountManagerClientConfig(), FakeAuth())

    result = await client.list_orgs(ListOrgsOptions(all=True))

    assert result["content"] == [{"id": "org-1", "name": "Acme"}]
    request = route.calls.last.request
    assert request.url.params["size"] == "5000"
    assert request.url.params["page"] == "0"


# --- Unified AccountManagerClient -------------------------------------------------


@respx.mock
async def test_unified_client_grant_role_resolves_role_and_updates_user() -> None:
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/roles").mock(
        return_value=httpx.Response(
            200,
            json={
                "content": [
                    {"id": "bm-admin", "roleEnumName": "ECOM_ADMIN", "description": "Business Manager Administrator"}
                ]
            },
        )
    )
    respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/users/u1").mock(
        return_value=httpx.Response(200, json={"id": "u1", "roles": [], "roleTenantFilter": ""})
    )
    update_route = respx.put(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/users/u1").mock(
        return_value=httpx.Response(200, json={"id": "u1", "roles": ["bm-admin"]})
    )

    client = create_account_manager_client(AccountManagerClientConfig(), FakeAuth("Bearer unified"))

    user = await client.grant_role("u1", "bm-admin", "abcd_prd")

    assert user == {"id": "u1", "roles": ["bm-admin"]}
    request = update_route.calls.last.request
    assert request.headers["Authorization"] == "Bearer unified"
    import json as json_module

    body = json_module.loads(request.content)
    assert body["roles"] == ["bm-admin"]
    assert body["roleTenantFilter"] == "ECOM_ADMIN:abcd_prd"


@respx.mock
async def test_unified_client_get_role_mapping_is_cached() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/roles").mock(
        return_value=httpx.Response(200, json={"content": [{"id": "bm-admin", "roleEnumName": "ECOM_ADMIN"}]})
    )
    client = create_account_manager_client(AccountManagerClientConfig(), FakeAuth())

    mapping1 = await client.get_role_mapping()
    mapping2 = await client.get_role_mapping()

    assert mapping1 is mapping2
    assert isinstance(mapping1, RoleMapping)
    assert mapping1.by_id == {"bm-admin": "ECOM_ADMIN"}
    assert route.calls.call_count == 1


@respx.mock
async def test_unified_client_get_org_mapping_uses_list_orgs_all() -> None:
    route = respx.get(f"https://{DEFAULT_ACCOUNT_MANAGER_HOST}/dw/rest/v1/organizations").mock(
        return_value=httpx.Response(200, json={"content": [{"id": "org-1", "name": "Acme"}]})
    )
    client = create_account_manager_client(AccountManagerClientConfig(), FakeAuth())

    mapping = await client.get_org_mapping()

    assert isinstance(mapping, OrgMapping)
    assert mapping.by_id == {"org-1": "Acme"}
    assert route.calls.last.request.url.params["size"] == "5000"
