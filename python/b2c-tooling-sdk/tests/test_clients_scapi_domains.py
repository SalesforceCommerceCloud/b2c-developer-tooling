# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SCAPI Admin domain client factories.

Mirrors the TypeScript ``scapi-jobs.test.ts``, ``scapi-sites.test.ts``,
``scapi-catalogs.test.ts``, ``scapi-scripts.test.ts``,
``scapi-merchant-users.test.ts``, and ``scapi-merchant-roles.test.ts`` suites
(collapsed into one file for the Python port). Covers the three cascade-based
domains (jobs, sites, catalogs) and the three default-scopes domains (scripts,
merchant-users, merchant-roles): base URL construction, scope/cascade
constants, and an end-to-end respx-mocked request proving the Authorization
header reaches the wire for one client of each kind.
"""

from __future__ import annotations

import httpx
import respx

from b2c_tooling_sdk.clients import scapi_catalogs, scapi_scripts
from b2c_tooling_sdk.clients.middleware import SCOPE_MODE_HEADER, ScopeCascade
from b2c_tooling_sdk.clients.scapi_catalogs import SCAPI_CATALOGS_CASCADE, create_scapi_catalogs_client
from b2c_tooling_sdk.clients.scapi_client_factory import ScapiClientConfig
from b2c_tooling_sdk.clients.scapi_jobs import SCAPI_JOBS_CASCADE, create_scapi_jobs_client
from b2c_tooling_sdk.clients.scapi_merchant_roles import (
    SCAPI_MERCHANT_ROLES_READ_SCOPES,
    SCAPI_MERCHANT_ROLES_RW_SCOPES,
    create_scapi_merchant_roles_client,
)
from b2c_tooling_sdk.clients.scapi_merchant_users import (
    SCAPI_MERCHANT_USERS_READ_SCOPES,
    SCAPI_MERCHANT_USERS_RW_SCOPES,
    create_scapi_merchant_users_client,
)
from b2c_tooling_sdk.clients.scapi_scripts import (
    SCAPI_SCRIPTS_READ_SCOPES,
    SCAPI_SCRIPTS_RW_SCOPES,
    create_scapi_scripts_client,
)
from b2c_tooling_sdk.clients.scapi_sites import SCAPI_SITES_CASCADE, create_scapi_sites_client


class _FakeAuth:
    """Fake ``ScopedAuthStrategy`` for the default-scopes (legacy) auth path."""

    def __init__(self) -> None:
        self.header = "Bearer static-token"
        self.requested_scopes: list[str] = []
        self.invalidated = 0

    def with_additional_scopes(self, scopes: list[str]) -> _FakeAuth:
        self.requested_scopes = list(scopes)
        return self

    async def get_authorization_header(self) -> str:
        return self.header

    def invalidate_token(self) -> None:
        self.invalidated += 1


class _FakeCascadeAuth:
    """Fake ``ScopedAuthStrategy`` for the scope-cascade auth path."""

    def __init__(self) -> None:
        self.requested_scopes: list[str] = []
        self.cascades: list[list[list[str]]] = []
        self.invalidated = 0

    def with_additional_scopes(self, scopes: list[str]) -> _FakeCascadeAuth:
        self.requested_scopes = list(scopes)
        return self

    async def get_authorization_header(self) -> str:
        return "Bearer static-token"

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        self.cascades.append(candidates)
        return "cascade-token"

    def invalidate_token(self) -> None:
        self.invalidated += 1


# --- jobs (cascade) --------------------------------------------------------------


def test_scapi_jobs_cascade_shape() -> None:
    assert ScopeCascade(read=[["sfcc.jobs.rw"], ["sfcc.jobs"]], write=[["sfcc.jobs.rw"]]) == SCAPI_JOBS_CASCADE


def test_scapi_jobs_client_base_url() -> None:
    client = create_scapi_jobs_client(
        ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), _FakeCascadeAuth()
    )
    assert client.base_url == "https://abcd1234.api.commercecloud.salesforce.com/operation/jobs/v1"


@respx.mock
async def test_scapi_jobs_client_sends_authorization_header() -> None:
    auth = _FakeCascadeAuth()
    client = create_scapi_jobs_client(ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), auth)
    route = respx.get(
        "https://abcd1234.api.commercecloud.salesforce.com/operation/jobs/v1/jobs/my-job/executions"
    ).mock(return_value=httpx.Response(200, json={"data": []}))

    result = await client.get(
        "/jobs/{jobId}/executions",
        {"params": {"path": {"jobId": "my-job"}}, "headers": {SCOPE_MODE_HEADER: "read"}},
    )

    assert route.called
    sent = route.calls.last.request
    assert sent.headers["Authorization"] == "Bearer cascade-token"
    assert result.error is None
    assert auth.cascades == [[["sfcc.jobs.rw"], ["sfcc.jobs"]]]


# --- sites (cascade) --------------------------------------------------------------


def test_scapi_sites_cascade_shape() -> None:
    assert ScopeCascade(read=[["sfcc.sites.rw"], ["sfcc.sites"]], write=[["sfcc.sites.rw"]]) == SCAPI_SITES_CASCADE


def test_scapi_sites_client_base_url() -> None:
    client = create_scapi_sites_client(
        ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), _FakeCascadeAuth()
    )
    assert client.base_url == "https://abcd1234.api.commercecloud.salesforce.com/site/sites/v1"


# --- catalogs (cascade) -----------------------------------------------------------


def test_scapi_catalogs_cascade_shape() -> None:
    assert (
        ScopeCascade(read=[["sfcc.catalogs.rw"], ["sfcc.catalogs"]], write=[["sfcc.catalogs.rw"]])
        == SCAPI_CATALOGS_CASCADE
    )


def test_scapi_catalogs_client_base_url() -> None:
    client = create_scapi_catalogs_client(
        ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), _FakeCascadeAuth()
    )
    assert client.base_url == "https://abcd1234.api.commercecloud.salesforce.com/product/catalogs/v1"


def test_scapi_catalogs_module_does_not_reexport_tenant_helpers() -> None:
    # scapi-catalogs.ts does not import/re-export the custom-apis tenant helpers.
    assert not hasattr(scapi_catalogs, "build_tenant_scope")
    assert not hasattr(scapi_catalogs, "to_organization_id")
    assert not hasattr(scapi_catalogs, "normalize_tenant_id")


# --- scripts (default scopes) -----------------------------------------------------


def test_scapi_scripts_scope_constants() -> None:
    assert SCAPI_SCRIPTS_READ_SCOPES == ["sfcc.scripts"]
    assert SCAPI_SCRIPTS_RW_SCOPES == ["sfcc.scripts.rw"]


def test_scapi_scripts_client_base_url() -> None:
    client = create_scapi_scripts_client(ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), _FakeAuth())
    assert client.base_url == "https://abcd1234.api.commercecloud.salesforce.com/dx/scripts/v1"


@respx.mock
async def test_scapi_scripts_client_sends_authorization_header() -> None:
    auth = _FakeAuth()
    client = create_scapi_scripts_client(ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), auth)
    route = respx.get("https://abcd1234.api.commercecloud.salesforce.com/dx/scripts/v1/code-versions").mock(
        return_value=httpx.Response(200, json={"data": []})
    )

    result = await client.get("/code-versions")

    assert route.called
    sent = route.calls.last.request
    assert sent.headers["Authorization"] == "Bearer static-token"
    assert result.error is None
    assert auth.requested_scopes == ["sfcc.scripts.rw", "SALESFORCE_COMMERCE_API:zzxy_prd"]


def test_scapi_scripts_module_shape() -> None:
    assert scapi_scripts.ScapiScriptsClientConfig is not None
    assert hasattr(scapi_scripts, "CodeVersion")


# --- merchant users (default scopes) ----------------------------------------------


def test_scapi_merchant_users_scope_constants() -> None:
    assert SCAPI_MERCHANT_USERS_READ_SCOPES == ["sfcc.users"]
    assert SCAPI_MERCHANT_USERS_RW_SCOPES == ["sfcc.users.rw"]


def test_scapi_merchant_users_client_base_url() -> None:
    client = create_scapi_merchant_users_client(
        ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), _FakeAuth()
    )
    assert client.base_url == "https://abcd1234.api.commercecloud.salesforce.com/merchant/users/v1"


# --- merchant roles (default scopes) ----------------------------------------------


def test_scapi_merchant_roles_scope_constants() -> None:
    assert SCAPI_MERCHANT_ROLES_READ_SCOPES == ["sfcc.roles"]
    assert SCAPI_MERCHANT_ROLES_RW_SCOPES == ["sfcc.roles.rw"]


def test_scapi_merchant_roles_client_base_url() -> None:
    client = create_scapi_merchant_roles_client(
        ScapiClientConfig(short_code="abcd1234", tenant_id="zzxy_prd"), _FakeAuth()
    )
    assert client.base_url == "https://abcd1234.api.commercecloud.salesforce.com/merchant/roles/v1"
