# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the Custom APIs client + shared tenant/scope helpers (``clients/custom_apis.py``).

Mirrors ``packages/b2c-tooling-sdk/test/clients/custom-apis.test.ts``: the
``to_organization_id`` / ``normalize_tenant_id`` / ``build_tenant_scope`` helpers
(used by every SCAPI domain) and the Custom APIs client factory.
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.custom_apis import (
    CUSTOM_APIS_DEFAULT_SCOPES,
    ORGANIZATION_ID_PREFIX,
    SCAPI_TENANT_SCOPE_PREFIX,
    CustomApisClientConfig,
    build_tenant_scope,
    create_custom_apis_client,
    normalize_tenant_id,
    to_organization_id,
)

SHORT_CODE = "kv7kzm78"


# --- normalize_tenant_id --------------------------------------------------------


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("zzxy_prd", "zzxy_prd"),
        ("zzxy-prd", "zzxy_prd"),
        ("f_ecom_zzxy_prd", "zzxy_prd"),
        ("f_ecom_zzxy-prd", "zzxy_prd"),
        ("zzxy-prd.dx.commercecloud.salesforce.com", "zzxy_prd"),
        ("  zzxy_prd  ", "zzxy_prd"),
    ],
)
def test_normalize_tenant_id(value: str, expected: str) -> None:
    assert normalize_tenant_id(value) == expected


def test_to_organization_id_adds_prefix() -> None:
    assert to_organization_id("zzxy_prd") == "f_ecom_zzxy_prd"


def test_to_organization_id_is_idempotent() -> None:
    assert to_organization_id("f_ecom_zzxy_prd") == "f_ecom_zzxy_prd"


def test_build_tenant_scope() -> None:
    assert build_tenant_scope("zzxy_prd") == "SALESFORCE_COMMERCE_API:zzxy_prd"
    assert build_tenant_scope("f_ecom_zzxy_prd") == "SALESFORCE_COMMERCE_API:zzxy_prd"


def test_prefix_constants() -> None:
    assert ORGANIZATION_ID_PREFIX == "f_ecom_"
    assert SCAPI_TENANT_SCOPE_PREFIX == "SALESFORCE_COMMERCE_API:"
    assert CUSTOM_APIS_DEFAULT_SCOPES == ["sfcc.custom-apis"]


# --- create_custom_apis_client --------------------------------------------------


class _FakeAuth:
    def __init__(self) -> None:
        self.merged: list[str] | None = None

    def with_additional_scopes(self, scopes: list[str]) -> _FakeAuth:
        self.merged = scopes
        return self

    async def get_authorization_header(self) -> str:
        return "Bearer custom-apis-token"

    def invalidate_token(self) -> None:  # pragma: no cover - not exercised here
        pass


def test_custom_apis_client_base_url_and_client_type() -> None:
    client = create_custom_apis_client(
        CustomApisClientConfig(short_code=SHORT_CODE, tenant_id="zzxy_prd"),
        _FakeAuth(),  # type: ignore[arg-type]
    )
    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/dx/custom-apis/v1"
    assert client.client_type == "custom-apis"


def test_custom_apis_client_merges_domain_and_tenant_scopes() -> None:
    auth = _FakeAuth()
    create_custom_apis_client(
        CustomApisClientConfig(short_code=SHORT_CODE, tenant_id="zzxy_prd"),
        auth,  # type: ignore[arg-type]
    )
    assert auth.merged == ["sfcc.custom-apis", "SALESFORCE_COMMERCE_API:zzxy_prd"]


def test_custom_apis_client_scopes_override() -> None:
    auth = _FakeAuth()
    create_custom_apis_client(
        CustomApisClientConfig(short_code=SHORT_CODE, tenant_id="zzxy_prd", scopes=["custom.only"]),
        auth,  # type: ignore[arg-type]
    )
    assert auth.merged == ["custom.only"]


@respx.mock
async def test_custom_apis_request_carries_authorization_header() -> None:
    client = create_custom_apis_client(
        CustomApisClientConfig(short_code=SHORT_CODE, tenant_id="zzxy_prd"),
        _FakeAuth(),  # type: ignore[arg-type]
    )
    org = to_organization_id("zzxy_prd")
    route = respx.get(f"{client.base_url}/organizations/{org}/endpoints").mock(
        return_value=httpx.Response(200, json={"data": []})
    )

    result = await client.get(
        "/organizations/{organizationId}/endpoints",
        {"params": {"path": {"organizationId": org}}},
    )

    assert route.called
    assert route.calls.last.request.headers["Authorization"] == "Bearer custom-apis-token"
    assert result.data == {"data": []}
