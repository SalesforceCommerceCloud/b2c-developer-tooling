# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the SCAPI/OCAPI catalogs dual backend.

Mirrors ``packages/b2c-tooling-sdk/test/operations/catalogs/catalogs-backend.test.ts``
(pagination + localized-name mapping for the SCAPI backend) plus additional
coverage for the OCAPI backend, error handling, and backend selection
(explicit ocapi/scapi and auto with OCAPI fallback) that the TS suite doesn't
exercise directly since equivalent behaviour is covered by the shared
dual-backend-factory / fallback-backend tests there.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError
from b2c_tooling_sdk.clients.ocapi import DEFAULT_API_VERSION, create_ocapi_client
from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiRequestError
from b2c_tooling_sdk.operations.catalogs import (
    CatalogsBackendConfig,
    ListCatalogsOptions,
    OcapiCatalogsBackend,
    ScapiCatalogsBackend,
    ScapiCatalogsBackendConfig,
    create_catalogs_backend,
)

HOSTNAME = "example.demandware.net"
SHORT_CODE = "abcd1234"
TENANT_ID = "zzxy_prd"
ORGANIZATION_ID = "f_ecom_zzxy_prd"
CATALOGS_URL = f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/catalogs"
SCAPI_CATALOGS_URL = (
    f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/product/catalogs/v1"
    f"/organizations/{ORGANIZATION_ID}/catalogs"
)


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
    factory and the two catalogs backends need: ``api_backend``,
    ``scapi_client_config``, and a pre-built ``ocapi`` client."""

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


def _ocapi_page(offset: int, count: int, total: int) -> dict[str, Any]:
    length = max(0, min(count, total - offset))
    return {
        "data": [
            {"id": f"catalog-{offset + i}", "name": {"default": f"Catalog {offset + i}"}, "online": True}
            for i in range(length)
        ],
        "total": total,
        "start": offset,
        "count": length,
    }


def _query_int(url: httpx.URL, key: str) -> int:
    return int(parse_qs(urlparse(str(url)).query)[key][0])


# --- OcapiCatalogsBackend ---------------------------------------------------------


@respx.mock
async def test_ocapi_list_catalogs_happy_path() -> None:
    route = respx.get(CATALOGS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {"id": "catalog-a", "name": {"default": "Catalog A"}, "online": True},
                    {"id": "catalog-b", "online": False},
                ],
                "total": 2,
                "start": 0,
                "count": 2,
            },
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiCatalogsBackend(instance)  # type: ignore[arg-type]

    catalogs = await backend.list_catalogs()

    assert backend.name == "ocapi"
    assert [c.id for c in catalogs] == ["catalog-a", "catalog-b"]
    assert catalogs[0].name == "Catalog A"
    assert catalogs[0].online is True
    assert catalogs[0].raw == {"id": "catalog-a", "name": {"default": "Catalog A"}, "online": True}
    assert catalogs[1].name is None
    assert catalogs[1].online is False
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer ocapi-token"


@respx.mock
async def test_ocapi_list_catalogs_paginates() -> None:
    total = 250

    def handler(request: httpx.Request) -> httpx.Response:
        offset = _query_int(request.url, "start")
        count = _query_int(request.url, "count")
        return httpx.Response(200, json=_ocapi_page(offset, count, total))

    respx.get(CATALOGS_URL).mock(side_effect=handler)
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiCatalogsBackend(instance)  # type: ignore[arg-type]

    catalogs = await backend.list_catalogs()

    assert len(catalogs) == total
    assert catalogs[0].id == "catalog-0"
    assert catalogs[-1].id == f"catalog-{total - 1}"


@respx.mock
async def test_ocapi_list_catalogs_honors_count_option() -> None:
    total = 500

    def handler(request: httpx.Request) -> httpx.Response:
        offset = _query_int(request.url, "start")
        count = _query_int(request.url, "count")
        return httpx.Response(200, json=_ocapi_page(offset, count, total))

    respx.get(CATALOGS_URL).mock(side_effect=handler)
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiCatalogsBackend(instance)  # type: ignore[arg-type]

    catalogs = await backend.list_catalogs(ListCatalogsOptions(count=30))

    assert len(catalogs) == 30


@respx.mock
async def test_ocapi_list_catalogs_raises_runtime_error_on_generic_failure() -> None:
    respx.get(CATALOGS_URL).mock(
        return_value=httpx.Response(500, json={"fault": {"type": "SomeOtherFault", "message": "boom"}})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiCatalogsBackend(instance)  # type: ignore[arg-type]

    with pytest.raises(RuntimeError) as exc_info:
        await backend.list_catalogs()

    assert "Failed to list catalogs" in str(exc_info.value)
    assert "boom" in str(exc_info.value)


@respx.mock
async def test_ocapi_list_catalogs_raises_deprecated_error_on_ocapi_disabled() -> None:
    respx.get(CATALOGS_URL).mock(
        return_value=httpx.Response(
            403, json={"fault": {"type": "OcapiDeprecatedException", "message": "OCAPI is deprecated"}}
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiCatalogsBackend(instance)  # type: ignore[arg-type]

    with pytest.raises(OcapiDeprecatedError):
        await backend.list_catalogs()


# --- ScapiCatalogsBackend ----------------------------------------------------------


def _scapi_backend(auth: _FakeCascadeAuth) -> ScapiCatalogsBackend:
    config = ScapiCatalogsBackendConfig(
        short_code=SHORT_CODE,
        tenant_id=TENANT_ID,
        auth=auth,  # type: ignore[arg-type]
        instance=_FakeInstance(),  # type: ignore[arg-type]
    )
    return ScapiCatalogsBackend(config)


@respx.mock
async def test_scapi_list_catalogs_paginates_and_maps_localized_names() -> None:
    total = 75

    def handler(request: httpx.Request) -> httpx.Response:
        offset = _query_int(request.url, "offset")
        limit = _query_int(request.url, "limit")
        length = max(0, min(limit, total - offset))
        data = [
            {"id": f"catalog-{offset + i}", "name": {"default": f"Catalog {offset + i}"}, "online": True}
            for i in range(length)
        ]
        return httpx.Response(200, json={"data": data, "offset": offset, "limit": limit, "total": total})

    respx.get(SCAPI_CATALOGS_URL).mock(side_effect=handler)
    auth = _FakeCascadeAuth()
    backend = _scapi_backend(auth)

    catalogs = await backend.list_catalogs()

    assert backend.name == "scapi"
    assert len(catalogs) == 75
    assert catalogs[0].id == "catalog-0"
    assert catalogs[0].name == "Catalog 0"
    assert catalogs[0].online is True
    # Cascade requested the read tier (rw first, then ro fallback candidate list).
    assert auth.cascades and auth.cascades[0] == [["sfcc.catalogs.rw"], ["sfcc.catalogs"]]


@respx.mock
async def test_scapi_list_catalogs_falls_back_to_first_localized_name() -> None:
    respx.get(SCAPI_CATALOGS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [{"id": "catalog-x", "name": {"fr-FR": "Catalogue X"}, "online": False}],
                "offset": 0,
                "limit": 50,
                "total": 1,
            },
        )
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    catalogs = await backend.list_catalogs()

    assert catalogs[0].name == "Catalogue X"
    assert catalogs[0].online is False


@respx.mock
async def test_scapi_list_catalogs_honors_count_option() -> None:
    total = 200

    def handler(request: httpx.Request) -> httpx.Response:
        offset = _query_int(request.url, "offset")
        limit = _query_int(request.url, "limit")
        length = max(0, min(limit, total - offset))
        data = [{"id": f"catalog-{offset + i}", "name": {"default": "x"}, "online": True} for i in range(length)]
        return httpx.Response(200, json={"data": data, "offset": offset, "limit": limit, "total": total})

    respx.get(SCAPI_CATALOGS_URL).mock(side_effect=handler)
    backend = _scapi_backend(_FakeCascadeAuth())

    catalogs = await backend.list_catalogs(ListCatalogsOptions(count=10))

    assert len(catalogs) == 10


@respx.mock
async def test_scapi_list_catalogs_raises_scapi_request_error_on_failure() -> None:
    respx.get(SCAPI_CATALOGS_URL).mock(
        return_value=httpx.Response(404, json={"title": "Not Found", "type": "not-found", "detail": "no catalogs"})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    with pytest.raises(ScapiRequestError) as exc_info:
        await backend.list_catalogs()

    assert exc_info.value.status == 404
    assert "no catalogs" in str(exc_info.value)


# --- create_catalogs_backend (backend selection) -----------------------------------


def test_create_catalogs_backend_explicit_ocapi_returns_ocapi_backend() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_catalogs_backend(
        CatalogsBackendConfig(instance=instance, preference="ocapi")  # type: ignore[arg-type]
    )
    assert isinstance(backend, OcapiCatalogsBackend)
    assert backend.name == "ocapi"


def test_create_catalogs_backend_explicit_scapi_returns_scapi_backend() -> None:
    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeCascadeAuth())
    instance = _FakeInstance(scapi_client_config=scapi_config)
    backend = create_catalogs_backend(
        CatalogsBackendConfig(instance=instance, preference="scapi")  # type: ignore[arg-type]
    )
    assert isinstance(backend, ScapiCatalogsBackend)
    assert backend.name == "scapi"


def test_create_catalogs_backend_explicit_scapi_without_config_raises() -> None:
    instance = _FakeInstance(scapi_client_config=None)
    with pytest.raises(ValueError):
        create_catalogs_backend(
            CatalogsBackendConfig(instance=instance, preference="scapi")  # type: ignore[arg-type]
        )


def test_create_catalogs_backend_auto_without_scapi_config_uses_ocapi() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_catalogs_backend(
        CatalogsBackendConfig(instance=instance, preference=None)  # type: ignore[arg-type]
    )
    assert isinstance(backend, OcapiCatalogsBackend)


@respx.mock
async def test_create_catalogs_backend_auto_falls_back_to_ocapi_on_safe_rejection() -> None:
    # SCAPI rejects (404 -> a safe fallback trigger); OCAPI then serves the request.
    respx.get(SCAPI_CATALOGS_URL).mock(return_value=httpx.Response(404, json={"title": "gone", "type": "x"}))
    respx.get(CATALOGS_URL).mock(
        return_value=httpx.Response(
            200, json={"data": [{"id": "catalog-a", "name": {"default": "A"}, "online": True}], "total": 1}
        )
    )

    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeCascadeAuth())
    instance = _FakeInstance(
        api_backend="auto",
        scapi_client_config=scapi_config,
        ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()),
    )

    backend = create_catalogs_backend(
        CatalogsBackendConfig(instance=instance, preference=None)  # type: ignore[arg-type]
    )
    assert backend.name == "scapi"  # unresolved yet -- reports the primary backend

    catalogs = await backend.list_catalogs()

    assert [c.id for c in catalogs] == ["catalog-a"]
    assert backend.name == "ocapi"  # pinned to OCAPI after the fallback
