# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SCAPI/OCAPI Business Manager roles dual backend.

Mirrors ``packages/b2c-tooling-sdk/test/operations/bm-roles/ocapi-backend.test.ts``
(OCAPI permission-shape mapping) plus additional coverage for the SCAPI backend,
error handling, and backend selection (explicit ocapi/scapi and auto with OCAPI
fallback) that the TS suite doesn't exercise directly since equivalent behaviour
is covered by the shared dual-backend-factory / fallback-backend tests there.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError
from b2c_tooling_sdk.clients.ocapi import DEFAULT_API_VERSION, create_ocapi_client
from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiRequestError
from b2c_tooling_sdk.operations.bm_roles import (
    CreateRoleInput,
    ListRolesOptions,
    OcapiRolesBackend,
    RolesBackendConfig,
    ScapiRolesBackend,
    ScapiRolesBackendConfig,
    create_roles_backend,
)

HOSTNAME = "example.demandware.net"
SHORT_CODE = "abcd1234"
TENANT_ID = "zzxy_prd"
ORGANIZATION_ID = "f_ecom_zzxy_prd"
ROLES_URL = f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/roles"
SCAPI_ROLES_URL = (
    f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/merchant/roles/v1/organizations/{ORGANIZATION_ID}/roles"
)

_OCAPI_PERMISSIONS = {
    "module": {
        "organization": [
            {
                "application": "bm",
                "name": "Manage_Sites",
                "type": "module",
                "system": True,
                "value": "read",
                "values": {"site": "all"},
            }
        ],
        "site": [],
    },
    "functional": {
        "organization": [
            {"name": "Manage_Users", "type": "functional", "value": "write", "values": {"organization": "all"}}
        ],
        "site": [],
    },
    "locale": {"unscoped": [{"locale_id": "en_US", "type": "locale", "value": "read", "values": {"fallback": "en"}}]},
    "webdav": {"unscoped": [{"folder": "/Impex", "type": "webdav", "value": "write", "values": {"recursive": "true"}}]},
}


class _FakeOcapiAuth:
    """Minimal auth strategy for the OCAPI auth middleware (header injection only)."""

    def __init__(self, header: str = "Bearer ocapi-token") -> None:
        self._header = header
        self.invalidated = False

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated = True

    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:  # pragma: no cover - unused by HttpClient
        raise NotImplementedError


class _FakeCascadeAuth:
    """Fake ``ScopedAuthStrategy`` for the SCAPI scope-cascade auth path."""

    def __init__(self, header: str = "scapi-token") -> None:
        self._header = header
        self.requested_scopes: list[str] = []
        self.cascades: list[list[list[str]]] = []
        self.invalidated = 0

    def with_additional_scopes(self, scopes: list[str]) -> _FakeCascadeAuth:
        self.requested_scopes = list(scopes)
        return self

    async def get_authorization_header(self) -> str:
        return f"Bearer {self._header}"

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        self.cascades.append(candidates)
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated += 1


@dataclass
class _FakeScapiClientConfig:
    """Duck-typed stand-in for ``ScapiClientConfig`` (short_code/tenant_id/auth)."""

    short_code: str
    tenant_id: str
    auth: Any


class _FakeInstance:
    """Duck-typed stand-in for ``B2CInstance`` exposing only what the dual-backend
    factory and the two roles backends need: ``api_backend``, ``scapi_client_config``,
    and a pre-built ``ocapi`` client."""

    def __init__(
        self,
        *,
        api_backend: str = "auto",
        scapi_client_config: _FakeScapiClientConfig | None = None,
        ocapi_client: Any = None,
    ) -> None:
        self.api_backend = api_backend
        self.scapi_client_config = scapi_client_config
        self.ocapi = ocapi_client


def _scapi_backend(auth: _FakeCascadeAuth) -> ScapiRolesBackend:
    config = ScapiRolesBackendConfig(
        short_code=SHORT_CODE,
        tenant_id=TENANT_ID,
        auth=auth,  # type: ignore[arg-type]
        instance=_FakeInstance(),  # type: ignore[arg-type]
    )
    return ScapiRolesBackend(config)


# --- OcapiRolesBackend: listing / getting roles -----------------------------------


@respx.mock
async def test_ocapi_list_roles_happy_path() -> None:
    route = respx.get(ROLES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {"id": "Administrator", "description": "Full access", "user_count": 3},
                    {"id": "Support", "description": "Support access", "user_count": 1},
                ],
                "total": 2,
                "start": 0,
                "count": 2,
            },
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    result = await backend.list_roles()

    assert backend.name == "ocapi"
    assert result.total == 2
    assert result.start == 0
    assert result.count == 2
    assert [r.id for r in result.hits] == ["Administrator", "Support"]
    assert result.hits[0].description == "Full access"
    assert result.hits[0].user_count == 3
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer ocapi-token"


@respx.mock
async def test_ocapi_list_roles_defaults_count_to_items_length_when_absent() -> None:
    respx.get(ROLES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [{"id": "Administrator"}],
                "total": 1,
                "start": 0,
                # no "count" field in the response
            },
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    result = await backend.list_roles()

    assert result.count == 1


@respx.mock
async def test_ocapi_get_role_maps_permissions() -> None:
    respx.get(f"{ROLES_URL}/developer").mock(
        return_value=httpx.Response(
            200, json={"id": "developer", "description": "Dev role", "permissions": _OCAPI_PERMISSIONS}
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    role = await backend.get_role("developer", expand=["permissions"])

    assert role.id == "developer"
    assert role.permissions is not None
    assert role.permissions["locale"]["unscoped"][0]["localeId"] == "en_US"
    assert role.raw == {"id": "developer", "description": "Dev role", "permissions": _OCAPI_PERMISSIONS}


# --- OcapiRolesBackend: permission mapping (mirrors ocapi-backend.test.ts) --------


@respx.mock
async def test_ocapi_get_permissions_preserves_fields_and_converts_locale_id() -> None:
    respx.get(f"{ROLES_URL}/developer/permissions").mock(return_value=httpx.Response(200, json=_OCAPI_PERMISSIONS))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    permissions = await backend.get_permissions("developer")

    assert permissions["module"]["organization"][0] == {
        "application": "bm",
        "name": "Manage_Sites",
        "type": "module",
        "system": True,
        "value": "read",
        "values": {"site": "all"},
    }
    assert permissions["functional"]["organization"][0] == {
        "name": "Manage_Users",
        "type": "functional",
        "value": "write",
        "values": {"organization": "all"},
    }
    assert permissions["locale"]["unscoped"][0] == {
        "localeId": "en_US",
        "type": "locale",
        "value": "read",
        "values": {"fallback": "en"},
    }
    assert permissions["webdav"]["unscoped"][0] == {
        "folder": "/Impex",
        "type": "webdav",
        "value": "write",
        "values": {"recursive": "true"},
    }


@respx.mock
async def test_ocapi_set_permissions_round_trips_without_dropping_metadata() -> None:
    received: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal received
        received = json.loads(request.content)
        return httpx.Response(200, json=received)

    respx.put(f"{ROLES_URL}/developer/permissions").mock(side_effect=handler)
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    canonical = {
        **_OCAPI_PERMISSIONS,
        "locale": {
            "unscoped": [{"localeId": "en_US", "type": "locale", "value": "read", "values": {"fallback": "en"}}]
        },
    }

    result = await backend.set_permissions("developer", canonical)

    assert received == _OCAPI_PERMISSIONS
    assert result["locale"]["unscoped"][0] == {
        "localeId": "en_US",
        "type": "locale",
        "value": "read",
        "values": {"fallback": "en"},
    }


# --- OcapiRolesBackend: create / delete / grant / revoke --------------------------


@respx.mock
async def test_ocapi_create_role() -> None:
    respx.put(f"{ROLES_URL}/MyRole").mock(
        return_value=httpx.Response(200, json={"id": "MyRole", "description": "A custom role"})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    role = await backend.create_role("MyRole", CreateRoleInput(description="A custom role"))

    assert role.id == "MyRole"
    assert role.description == "A custom role"


@respx.mock
async def test_ocapi_delete_role() -> None:
    route = respx.delete(f"{ROLES_URL}/MyRole").mock(return_value=httpx.Response(200, json={}))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    await backend.delete_role("MyRole")

    assert route.called


@respx.mock
async def test_ocapi_grant_and_revoke_role() -> None:
    grant_route = respx.put(f"{ROLES_URL}/Administrator/users/user@example.com").mock(
        return_value=httpx.Response(200, json={"login": "user@example.com"})
    )
    revoke_route = respx.delete(f"{ROLES_URL}/Administrator/users/user@example.com").mock(
        return_value=httpx.Response(200, json={})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    await backend.grant_role("Administrator", "user@example.com")
    await backend.revoke_role("Administrator", "user@example.com")

    assert grant_route.called
    assert revoke_route.called


# --- OcapiRolesBackend: error handling ---------------------------------------------


@respx.mock
async def test_ocapi_list_roles_raises_runtime_error_on_generic_failure() -> None:
    respx.get(ROLES_URL).mock(
        return_value=httpx.Response(500, json={"fault": {"type": "SomeOtherFault", "message": "boom"}})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    with pytest.raises(RuntimeError) as exc_info:
        await backend.list_roles()

    assert "Failed to list roles" in str(exc_info.value)
    assert "boom" in str(exc_info.value)


@respx.mock
async def test_ocapi_list_roles_raises_deprecated_error_on_ocapi_disabled() -> None:
    respx.get(ROLES_URL).mock(
        return_value=httpx.Response(
            403, json={"fault": {"type": "OcapiDeprecatedException", "message": "OCAPI is deprecated"}}
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiRolesBackend(instance)  # type: ignore[arg-type]

    with pytest.raises(OcapiDeprecatedError):
        await backend.list_roles()


# --- ScapiRolesBackend --------------------------------------------------------------


@respx.mock
async def test_scapi_list_roles_happy_path() -> None:
    respx.get(SCAPI_ROLES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {"id": "Administrator", "description": "Full access", "userCount": 3},
                    {"id": "Support", "description": "Support access", "userCount": 1},
                ],
                "total": 2,
                "offset": 0,
                "limit": 25,
            },
        )
    )
    auth = _FakeCascadeAuth()
    backend = _scapi_backend(auth)

    result = await backend.list_roles()

    assert backend.name == "scapi"
    assert result.total == 2
    assert result.start == 0
    assert result.count == 25
    assert [r.id for r in result.hits] == ["Administrator", "Support"]
    assert result.hits[0].user_count == 3
    # Merchant Roles uses a single static rw scope (no scope cascade); the
    # scope-tier manager optimistically requests it for reads too.
    assert auth.requested_scopes[0] == "sfcc.roles.rw"


@respx.mock
async def test_scapi_list_roles_honors_pagination_options() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        from urllib.parse import parse_qs, urlparse

        query = parse_qs(urlparse(str(request.url)).query)
        offset = int(query["offset"][0])
        limit = int(query["limit"][0])
        return httpx.Response(200, json={"data": [], "total": 0, "offset": offset, "limit": limit})

    respx.get(SCAPI_ROLES_URL).mock(side_effect=handler)
    backend = _scapi_backend(_FakeCascadeAuth())

    result = await backend.list_roles(ListRolesOptions(start=10, count=5))

    assert result.start == 10
    assert result.count == 5


@respx.mock
async def test_scapi_get_role() -> None:
    respx.get(f"{SCAPI_ROLES_URL}/developer").mock(
        return_value=httpx.Response(200, json={"id": "developer", "description": "Dev role", "userManager": True})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    role = await backend.get_role("developer")

    assert role.id == "developer"
    assert role.user_manager is True


@respx.mock
async def test_scapi_create_role() -> None:
    respx.put(f"{SCAPI_ROLES_URL}/MyRole").mock(
        return_value=httpx.Response(200, json={"id": "MyRole", "description": "A custom role"})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    role = await backend.create_role("MyRole", CreateRoleInput(description="A custom role"))

    assert role.id == "MyRole"
    assert role.description == "A custom role"


@respx.mock
async def test_scapi_delete_role() -> None:
    route = respx.delete(f"{SCAPI_ROLES_URL}/MyRole").mock(return_value=httpx.Response(204))
    backend = _scapi_backend(_FakeCascadeAuth())

    await backend.delete_role("MyRole")

    assert route.called


@respx.mock
async def test_scapi_get_and_set_permissions() -> None:
    permissions_payload = {"module": {"organization": [], "site": []}}
    respx.get(f"{SCAPI_ROLES_URL}/developer/permissions").mock(
        return_value=httpx.Response(200, json=permissions_payload)
    )
    respx.put(f"{SCAPI_ROLES_URL}/developer/permissions").mock(
        return_value=httpx.Response(200, json=permissions_payload)
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    fetched = await backend.get_permissions("developer")
    updated = await backend.set_permissions("developer", permissions_payload)

    assert fetched == permissions_payload
    assert updated == permissions_payload


@respx.mock
async def test_scapi_grant_and_revoke_role() -> None:
    grant_route = respx.put(f"{SCAPI_ROLES_URL}/Administrator/users/user@example.com").mock(
        return_value=httpx.Response(204)
    )
    revoke_route = respx.delete(f"{SCAPI_ROLES_URL}/Administrator/users/user@example.com").mock(
        return_value=httpx.Response(204)
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    await backend.grant_role("Administrator", "user@example.com")
    await backend.revoke_role("Administrator", "user@example.com")

    assert grant_route.called
    assert revoke_route.called


@respx.mock
async def test_scapi_list_roles_raises_scapi_request_error_on_failure() -> None:
    respx.get(SCAPI_ROLES_URL).mock(
        return_value=httpx.Response(404, json={"title": "Not Found", "type": "not-found", "detail": "no roles"})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    with pytest.raises(ScapiRequestError) as exc_info:
        await backend.list_roles()

    assert exc_info.value.status == 404
    assert "no roles" in str(exc_info.value)


@respx.mock
async def test_scapi_delete_role_raises_scapi_request_error_on_failure() -> None:
    respx.delete(f"{SCAPI_ROLES_URL}/MyRole").mock(
        return_value=httpx.Response(403, json={"title": "Forbidden", "type": "forbidden", "detail": "nope"})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    with pytest.raises(ScapiRequestError) as exc_info:
        await backend.delete_role("MyRole")

    assert exc_info.value.status == 403


# --- create_roles_backend (backend selection) --------------------------------------


def test_create_roles_backend_explicit_ocapi_returns_ocapi_backend() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_roles_backend(
        RolesBackendConfig(instance=instance, preference="ocapi")  # type: ignore[arg-type]
    )
    assert isinstance(backend, OcapiRolesBackend)
    assert backend.name == "ocapi"


def test_create_roles_backend_explicit_scapi_returns_scapi_backend() -> None:
    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeCascadeAuth())
    instance = _FakeInstance(scapi_client_config=scapi_config)
    backend = create_roles_backend(
        RolesBackendConfig(instance=instance, preference="scapi")  # type: ignore[arg-type]
    )
    assert isinstance(backend, ScapiRolesBackend)
    assert backend.name == "scapi"


def test_create_roles_backend_explicit_scapi_without_config_raises() -> None:
    instance = _FakeInstance(scapi_client_config=None)
    with pytest.raises(ValueError):
        create_roles_backend(
            RolesBackendConfig(instance=instance, preference="scapi")  # type: ignore[arg-type]
        )


def test_create_roles_backend_auto_without_scapi_config_uses_ocapi() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_roles_backend(
        RolesBackendConfig(instance=instance, preference=None)  # type: ignore[arg-type]
    )
    assert isinstance(backend, OcapiRolesBackend)


@respx.mock
async def test_create_roles_backend_auto_falls_back_to_ocapi_on_safe_rejection() -> None:
    # SCAPI rejects (404 -> a safe fallback trigger); OCAPI then serves the request.
    respx.get(SCAPI_ROLES_URL).mock(return_value=httpx.Response(404, json={"title": "gone", "type": "x"}))
    respx.get(ROLES_URL).mock(
        return_value=httpx.Response(200, json={"data": [{"id": "Administrator"}], "total": 1, "start": 0, "count": 1})
    )

    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeCascadeAuth())
    instance = _FakeInstance(
        api_backend="auto",
        scapi_client_config=scapi_config,
        ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()),
    )

    backend = create_roles_backend(
        RolesBackendConfig(instance=instance, preference=None)  # type: ignore[arg-type]
    )
    assert backend.name == "scapi"  # unresolved yet -- reports the primary backend

    result = await backend.list_roles()

    assert [r.id for r in result.hits] == ["Administrator"]
    assert backend.name == "ocapi"  # pinned to OCAPI after the fallback
