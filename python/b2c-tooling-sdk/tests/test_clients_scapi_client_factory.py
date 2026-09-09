# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the generic SCAPI client factory (``clients/scapi_client_factory.py``).

Mirrors ``packages/b2c-tooling-sdk/test/clients/scapi-client-factory.test.ts``:
base-URL construction, the mutually-exclusive ``scope_cascade``/``default_scopes``
guards, tenant-scope baking on the cascade path, and default+tenant scope
merging on the legacy path.
"""

from __future__ import annotations

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.middleware import ScopeCascade
from b2c_tooling_sdk.clients.scapi_client_factory import (
    BuildScapiClientOptions,
    ScapiClientConfig,
    build_scapi_client,
)

SHORT_CODE = "kv7kzm78"
TENANT = "zzxy_prd"


class _FakeAuth:
    """Fake auth supporting both the legacy and cascade middleware paths."""

    def __init__(self) -> None:
        self.merged: list[str] | None = None
        self.cascades: list[list[list[str]]] = []

    def with_additional_scopes(self, scopes: list[str]) -> _FakeAuth:
        self.merged = scopes
        return self

    async def get_authorization_header(self) -> str:
        return "Bearer legacy-token"

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        self.cascades.append(candidates)
        return "cascade-token"

    def invalidate_token(self) -> None:  # pragma: no cover - not exercised here
        pass


def _config(**overrides: object) -> ScapiClientConfig:
    return ScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT, **overrides)  # type: ignore[arg-type]


def test_base_url_is_constructed_from_short_code_and_path_segment() -> None:
    auth = _FakeAuth()
    client = build_scapi_client(
        BuildScapiClientOptions(
            path_segment="operation/jobs/v1",
            domain_key="scapi-jobs",
            log_prefix="SCAPI-JOBS",
            default_scopes=["sfcc.jobs.rw"],
        ),
        _config(),
        auth,  # type: ignore[arg-type]
    )
    assert client.base_url == f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/operation/jobs/v1"
    assert client.client_type == "scapi-jobs"


def test_rejects_both_cascade_and_default_scopes() -> None:
    with pytest.raises(ValueError, match="mutually exclusive"):
        build_scapi_client(
            BuildScapiClientOptions(
                path_segment="operation/jobs/v1",
                domain_key="scapi-jobs",
                log_prefix="SCAPI-JOBS",
                scope_cascade=ScopeCascade(read=[["sfcc.jobs"]], write=[["sfcc.jobs.rw"]]),
                default_scopes=["sfcc.jobs.rw"],
            ),
            _config(),
            _FakeAuth(),  # type: ignore[arg-type]
        )


def test_rejects_neither_cascade_nor_default_scopes() -> None:
    with pytest.raises(ValueError, match="must provide either"):
        build_scapi_client(
            BuildScapiClientOptions(
                path_segment="operation/jobs/v1",
                domain_key="scapi-jobs",
                log_prefix="SCAPI-JOBS",
            ),
            _config(),
            _FakeAuth(),  # type: ignore[arg-type]
        )


def test_cascade_path_bakes_tenant_scope_into_auth() -> None:
    auth = _FakeAuth()
    build_scapi_client(
        BuildScapiClientOptions(
            path_segment="operation/jobs/v1",
            domain_key="scapi-jobs",
            log_prefix="SCAPI-JOBS",
            scope_cascade=ScopeCascade(read=[["sfcc.jobs"]], write=[["sfcc.jobs.rw"]]),
        ),
        _config(),
        auth,  # type: ignore[arg-type]
    )
    assert auth.merged == ["SALESFORCE_COMMERCE_API:zzxy_prd"]


def test_legacy_path_merges_default_and_tenant_scopes() -> None:
    auth = _FakeAuth()
    build_scapi_client(
        BuildScapiClientOptions(
            path_segment="dx/scripts/v1",
            domain_key="scapi-scripts",
            log_prefix="SCAPI-SCRIPTS",
            default_scopes=["sfcc.scripts.rw"],
        ),
        _config(),
        auth,  # type: ignore[arg-type]
    )
    assert auth.merged == ["sfcc.scripts.rw", "SALESFORCE_COMMERCE_API:zzxy_prd"]


def test_scopes_override_replaces_default_and_tenant() -> None:
    auth = _FakeAuth()
    build_scapi_client(
        BuildScapiClientOptions(
            path_segment="dx/scripts/v1",
            domain_key="scapi-scripts",
            log_prefix="SCAPI-SCRIPTS",
            default_scopes=["sfcc.scripts.rw"],
        ),
        _config(scopes=["custom.scope"]),
        auth,  # type: ignore[arg-type]
    )
    assert auth.merged == ["custom.scope"]


@respx.mock
async def test_legacy_client_request_carries_authorization_header() -> None:
    auth = _FakeAuth()
    client = build_scapi_client(
        BuildScapiClientOptions(
            path_segment="dx/scripts/v1",
            domain_key="scapi-scripts",
            log_prefix="SCAPI-SCRIPTS",
            default_scopes=["sfcc.scripts.rw"],
        ),
        _config(),
        auth,  # type: ignore[arg-type]
    )
    route = respx.get(f"{client.base_url}/health").mock(return_value=httpx.Response(200, json={"ok": True}))

    result = await client.get("/health")

    assert route.called
    assert route.calls.last.request.headers["Authorization"] == "Bearer legacy-token"
    assert result.data == {"ok": True}
