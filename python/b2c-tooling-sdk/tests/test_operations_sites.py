# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for ``operations/sites``.

Mirrors ``packages/b2c-tooling-sdk/test/operations/sites/*.test.ts``: cartridge
path get/add/remove/set for both the SCAPI and OCAPI backends, Business
Manager (Sites-Site) handling via the site-archive import/export fallback,
sites read-backend list/get, and backend selection (ocapi/scapi/auto-fallback).

The site-archive import/export fallback is exercised via a monkeypatch of
``cartridges._import_jobs_site_archive`` — see the module docstring in
``operations/sites/cartridges.py`` for why this indirection exists (breaking
the sites<->jobs import cycle). These tests never need ``operations.jobs`` to
be importable.
"""

from __future__ import annotations

import io
import zipfile
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError
from b2c_tooling_sdk.clients.ocapi import DEFAULT_API_VERSION, create_ocapi_client
from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiRequestError
from b2c_tooling_sdk.operations.sites import (
    BM_SITE_ID,
    AddCartridgeOptions,
    ListSitesOptions,
    OcapiSitesBackend,
    ScapiSitesBackend,
    SitesBackendConfig,
    add_cartridge,
    cartridges,
    create_sites_backend,
    get_cartridge_path,
    remove_cartridge,
    set_cartridge_path,
)
from b2c_tooling_sdk.operations.sites.scapi_sites_backend import ScapiSitesBackendConfig

HOSTNAME = "example.demandware.net"
SHORT_CODE = "abcd1234"
TENANT_ID = "zzxy_prd"
ORGANIZATION_ID = "f_ecom_zzxy_prd"
SITES_URL = f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/sites"
SCAPI_SITES_URL = (
    f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/site/sites/v1/organizations/{ORGANIZATION_ID}/sites"
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
    factory and the two sites backends need: ``api_backend``, ``scapi_client_config``,
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


def _query_int(url: httpx.URL, key: str) -> int:
    return int(parse_qs(urlparse(str(url)).query)[key][0])


def _ocapi_instance(**kwargs: Any) -> _FakeInstance:
    return _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()), **kwargs)


def _scapi_backend(auth: _FakeCascadeAuth | None = None) -> ScapiSitesBackend:
    config = ScapiSitesBackendConfig(
        short_code=SHORT_CODE,
        tenant_id=TENANT_ID,
        auth=auth or _FakeCascadeAuth(),  # type: ignore[arg-type]
        instance=_FakeInstance(),  # type: ignore[arg-type]
    )
    return ScapiSitesBackend(config)


def _scapi_instance(auth: _FakeCascadeAuth | None = None, **kwargs: Any) -> _FakeInstance:
    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=auth or _FakeCascadeAuth())
    return _FakeInstance(scapi_client_config=scapi_config, **kwargs)


# --- OcapiSitesBackend -------------------------------------------------------------


@respx.mock
async def test_ocapi_list_sites_happy_path() -> None:
    respx.get(SITES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {"id": "RefArch", "display_name": {"default": "RefArch"}, "cartridges": "app_storefront_base"},
                    {"id": "Sites-Site", "cartridges": "bm_ext"},
                ],
                "total": 2,
            },
        )
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    sites = await backend.list_sites()

    assert backend.name == "ocapi"
    assert [s.id for s in sites] == ["RefArch", "Sites-Site"]
    assert sites[0].display_name == "RefArch"
    assert sites[0].cartridges == "app_storefront_base"
    assert sites[1].display_name == "Sites-Site"  # falls back to id


@respx.mock
async def test_ocapi_list_sites_paginates_when_unbounded() -> None:
    total = 450

    def handler(request: httpx.Request) -> httpx.Response:
        start = _query_int(request.url, "start")
        length = max(0, min(200, total - start))
        data = [{"id": f"site-{start + i}"} for i in range(length)]
        return httpx.Response(200, json={"data": data, "total": total})

    respx.get(SITES_URL).mock(side_effect=handler)
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    sites = await backend.list_sites()

    assert len(sites) == total
    assert sites[0].id == "site-0"
    assert sites[-1].id == f"site-{total - 1}"


@respx.mock
async def test_ocapi_list_sites_honors_bounded_options_as_single_page() -> None:
    respx.get(SITES_URL).mock(return_value=httpx.Response(200, json={"data": [{"id": "a"}, {"id": "b"}], "total": 100}))
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    sites = await backend.list_sites(ListSitesOptions(start=0, count=2))

    assert [s.id for s in sites] == ["a", "b"]


@respx.mock
async def test_ocapi_get_site() -> None:
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(
            200, json={"id": "RefArch", "display_name": {"default": "Ref Arch"}, "cartridges": "app_storefront_base"}
        )
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    site = await backend.get_site("RefArch")

    assert site.id == "RefArch"
    assert site.display_name == "Ref Arch"
    assert site.cartridges == "app_storefront_base"
    assert site.raw == {"id": "RefArch", "display_name": {"default": "Ref Arch"}, "cartridges": "app_storefront_base"}


@respx.mock
async def test_ocapi_get_cartridge_path() -> None:
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(200, json={"id": "RefArch", "cartridges": "app_storefront_base:plugin_x"})
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    assert await backend.get_cartridge_path("RefArch") == "app_storefront_base:plugin_x"


@respx.mock
async def test_ocapi_set_cartridge_path() -> None:
    route = respx.put(f"{SITES_URL}/RefArch/cartridges").mock(
        return_value=httpx.Response(200, json={"cartridges": "a:b"})
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    result = await backend.set_cartridge_path("RefArch", "a:b")

    assert result == "a:b"
    assert route.calls.last.request.content == b'{"cartridges": "a:b"}'


@respx.mock
async def test_ocapi_add_cartridge() -> None:
    respx.post(f"{SITES_URL}/RefArch/cartridges").mock(
        return_value=httpx.Response(200, json={"cartridges": "new_cartridge:app_storefront_base"})
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    result = await backend.add_cartridge("RefArch", "new_cartridge", "first")

    assert result == "new_cartridge:app_storefront_base"


@respx.mock
async def test_ocapi_remove_cartridge() -> None:
    respx.delete(f"{SITES_URL}/RefArch/cartridges/old_cartridge").mock(
        return_value=httpx.Response(200, json={"cartridges": "app_storefront_base"})
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    result = await backend.remove_cartridge("RefArch", "old_cartridge")

    assert result == "app_storefront_base"


@respx.mock
async def test_ocapi_list_sites_raises_runtime_error_on_generic_failure() -> None:
    respx.get(SITES_URL).mock(
        return_value=httpx.Response(500, json={"fault": {"type": "SomeOtherFault", "message": "boom"}})
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    with pytest.raises(RuntimeError) as exc_info:
        await backend.list_sites()

    assert "Failed to list sites" in str(exc_info.value)
    assert "boom" in str(exc_info.value)


@respx.mock
async def test_ocapi_get_site_raises_deprecated_error_on_ocapi_disabled() -> None:
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(
            403, json={"fault": {"type": "OcapiDeprecatedException", "message": "OCAPI is deprecated"}}
        )
    )
    backend = OcapiSitesBackend(_ocapi_instance())  # type: ignore[arg-type]

    with pytest.raises(OcapiDeprecatedError):
        await backend.get_site("RefArch")


# --- ScapiSitesBackend --------------------------------------------------------------


@respx.mock
async def test_scapi_list_sites_paginates_and_enriches_sparse_items() -> None:
    total = 60

    def handler(request: httpx.Request) -> httpx.Response:
        offset = _query_int(request.url, "offset")
        limit = _query_int(request.url, "limit")
        length = max(0, min(limit, total - offset))
        data = [{"id": f"site-{offset + i}"} for i in range(length)]
        return httpx.Response(200, json={"data": data, "offset": offset, "limit": limit, "total": total})

    respx.get(SCAPI_SITES_URL).mock(side_effect=handler)
    for i in range(total):
        respx.get(f"{SCAPI_SITES_URL}/site-{i}").mock(
            return_value=httpx.Response(
                200, json={"id": f"site-{i}", "displayName": {"default": f"Site {i}"}, "storefrontStatus": "online"}
            )
        )
    backend = _scapi_backend()

    sites = await backend.list_sites()

    assert backend.name == "scapi"
    assert len(sites) == total
    assert sites[0].id == "site-0"
    assert sites[0].display_name == "Site 0"
    assert sites[0].storefront_status == "online"


@respx.mock
async def test_scapi_list_sites_skips_enrichment_for_rich_items() -> None:
    respx.get(SCAPI_SITES_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [{"id": "RefArch", "displayName": {"default": "Ref Arch"}, "storefrontStatus": "online"}],
                "offset": 0,
                "limit": 50,
                "total": 1,
            },
        )
    )
    # No per-site detail route registered; a call to it would 404 via respx.
    backend = _scapi_backend()

    sites = await backend.list_sites()

    assert sites[0].display_name == "Ref Arch"
    assert sites[0].storefront_status == "online"


@respx.mock
async def test_scapi_list_sites_honors_count_option() -> None:
    total = 200

    def handler(request: httpx.Request) -> httpx.Response:
        offset = _query_int(request.url, "offset")
        limit = _query_int(request.url, "limit")
        length = max(0, min(limit, total - offset))
        data = [{"id": f"site-{offset + i}", "displayName": {"default": "x"}} for i in range(length)]
        return httpx.Response(200, json={"data": data, "offset": offset, "limit": limit, "total": total})

    respx.get(SCAPI_SITES_URL).mock(side_effect=handler)
    backend = _scapi_backend()

    sites = await backend.list_sites(ListSitesOptions(count=10))

    assert len(sites) == 10


@respx.mock
async def test_scapi_get_cartridge_path() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base:plugin_x"})
    )
    backend = _scapi_backend()

    assert await backend.get_cartridge_path("RefArch") == "app_storefront_base:plugin_x"


@respx.mock
async def test_scapi_set_cartridge_path_requests_write_cascade() -> None:
    respx.put(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "a:b"})
    )
    auth = _FakeCascadeAuth()
    backend = _scapi_backend(auth)

    result = await backend.set_cartridge_path("RefArch", "a:b")

    assert result == "a:b"
    assert auth.cascades[-1] == [["sfcc.sites.rw"]]


@respx.mock
async def test_scapi_add_cartridge_first() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base"})
    )
    put_route = respx.put(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "new_cartridge:app_storefront_base"})
    )
    backend = _scapi_backend()

    result = await backend.add_cartridge("RefArch", "new_cartridge", "first")

    assert result == "new_cartridge:app_storefront_base"
    assert b"new_cartridge:app_storefront_base" in put_route.calls.last.request.content


@respx.mock
async def test_scapi_add_cartridge_before_target() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base:plugin_x"})
    )
    respx.put(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base:new_cartridge:plugin_x"})
    )
    backend = _scapi_backend()

    result = await backend.add_cartridge("RefArch", "new_cartridge", "before", "plugin_x")

    assert result == "app_storefront_base:new_cartridge:plugin_x"


@respx.mock
async def test_scapi_add_cartridge_already_exists_raises() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base"})
    )
    backend = _scapi_backend()

    with pytest.raises(RuntimeError, match="already exists"):
        await backend.add_cartridge("RefArch", "app_storefront_base", "first")


@respx.mock
async def test_scapi_add_cartridge_missing_target_raises() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base"})
    )
    backend = _scapi_backend()

    with pytest.raises(RuntimeError, match="not found in cartridge path"):
        await backend.add_cartridge("RefArch", "new_cartridge", "before", "does_not_exist")


@respx.mock
async def test_scapi_remove_cartridge() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base:plugin_x"})
    )
    respx.put(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base"})
    )
    backend = _scapi_backend()

    result = await backend.remove_cartridge("RefArch", "plugin_x")

    assert result == "app_storefront_base"


@respx.mock
async def test_scapi_remove_cartridge_not_found_raises() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base"})
    )
    backend = _scapi_backend()

    with pytest.raises(RuntimeError, match="not found in the cartridge path"):
        await backend.remove_cartridge("RefArch", "missing")


@respx.mock
async def test_scapi_get_cartridge_path_raises_scapi_request_error_on_failure() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(404, json={"title": "Not Found", "type": "not-found", "detail": "no site"})
    )
    backend = _scapi_backend()

    with pytest.raises(ScapiRequestError) as exc_info:
        await backend.get_cartridge_path("RefArch")

    assert exc_info.value.status == 404
    assert "no site" in str(exc_info.value)


# --- create_sites_backend (backend selection) --------------------------------------


def test_create_sites_backend_explicit_ocapi_returns_ocapi_backend() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_sites_backend(SitesBackendConfig(instance=instance, preference="ocapi"))  # type: ignore[arg-type]
    assert isinstance(backend, OcapiSitesBackend)
    assert backend.name == "ocapi"


def test_create_sites_backend_explicit_scapi_returns_scapi_backend() -> None:
    instance = _scapi_instance()
    backend = create_sites_backend(SitesBackendConfig(instance=instance, preference="scapi"))  # type: ignore[arg-type]
    assert isinstance(backend, ScapiSitesBackend)
    assert backend.name == "scapi"


def test_create_sites_backend_explicit_scapi_without_config_raises() -> None:
    instance = _FakeInstance(scapi_client_config=None)
    with pytest.raises(ValueError):
        create_sites_backend(SitesBackendConfig(instance=instance, preference="scapi"))  # type: ignore[arg-type]


def test_create_sites_backend_auto_without_scapi_config_uses_ocapi() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_sites_backend(SitesBackendConfig(instance=instance, preference=None))  # type: ignore[arg-type]
    assert isinstance(backend, OcapiSitesBackend)


@respx.mock
async def test_create_sites_backend_auto_falls_back_to_ocapi_on_safe_rejection() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(404, json={"title": "gone", "type": "x"})
    )
    respx.get(f"{SITES_URL}/RefArch").mock(return_value=httpx.Response(200, json={"id": "RefArch", "cartridges": "a"}))

    instance = _scapi_instance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = create_sites_backend(SitesBackendConfig(instance=instance, preference=None))  # type: ignore[arg-type]
    assert backend.name == "scapi"

    cartridges_path = await backend.get_cartridge_path("RefArch")

    assert cartridges_path == "a"
    assert backend.name == "ocapi"  # pinned to OCAPI after the fallback


# --- cartridges: get/add/remove/set (direct backends) ------------------------------


@respx.mock
async def test_get_cartridge_path_via_scapi_backend() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base:plugin_x"})
    )
    instance = _scapi_instance()

    result = await get_cartridge_path(instance, "RefArch")  # type: ignore[arg-type]

    assert result.site_id == "RefArch"
    assert result.cartridges == "app_storefront_base:plugin_x"
    assert result.cartridge_list == ["app_storefront_base", "plugin_x"]


@respx.mock
async def test_get_cartridge_path_via_ocapi_backend() -> None:
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(200, json={"id": "RefArch", "cartridges": "app_storefront_base"})
    )
    instance = _ocapi_instance()

    result = await get_cartridge_path(instance, "RefArch")  # type: ignore[arg-type]

    assert result.cartridges == "app_storefront_base"
    assert result.cartridge_list == ["app_storefront_base"]


@respx.mock
async def test_get_cartridge_path_wraps_backend_error() -> None:
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(500, json={"fault": {"type": "X", "message": "server exploded"}})
    )
    instance = _ocapi_instance()

    with pytest.raises(RuntimeError) as exc_info:
        await get_cartridge_path(instance, "RefArch")  # type: ignore[arg-type]

    assert 'Failed to get cartridge path for site "RefArch"' in str(exc_info.value)
    assert "server exploded" in str(exc_info.value)


@respx.mock
async def test_add_cartridge_via_scapi_backend() -> None:
    respx.get(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "app_storefront_base"})
    )
    respx.put(f"{SCAPI_SITES_URL}/RefArch/custom-cartridges").mock(
        return_value=httpx.Response(200, json={"customCartridges": "new_cartridge:app_storefront_base"})
    )
    instance = _scapi_instance()

    result = await add_cartridge(  # type: ignore[arg-type]
        instance, "RefArch", AddCartridgeOptions(name="new_cartridge", position="first")
    )

    assert result.cartridges == "new_cartridge:app_storefront_base"


@respx.mock
async def test_remove_cartridge_via_ocapi_backend() -> None:
    respx.delete(f"{SITES_URL}/RefArch/cartridges/old_cartridge").mock(
        return_value=httpx.Response(200, json={"cartridges": "app_storefront_base"})
    )
    instance = _ocapi_instance()

    result = await remove_cartridge(instance, "RefArch", "old_cartridge")  # type: ignore[arg-type]

    assert result.cartridges == "app_storefront_base"


@respx.mock
async def test_set_cartridge_path_via_ocapi_backend() -> None:
    respx.put(f"{SITES_URL}/RefArch/cartridges").mock(return_value=httpx.Response(200, json={"cartridges": "a:b"}))
    instance = _ocapi_instance()

    result = await set_cartridge_path(instance, "RefArch", "a:b")  # type: ignore[arg-type]

    assert result.cartridges == "a:b"
    assert result.cartridge_list == ["a", "b"]


# --- cartridges: BM_SITE_ID + site-archive fallback (monkeypatched jobs) -----------


def _zip_with(path: str, content: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(path, content)
    return buffer.getvalue()


@dataclass
class _FakeExportResult:
    data: bytes


class _FakeJobsSiteArchive:
    """Records calls and lets tests script import/export outcomes."""

    def __init__(self) -> None:
        self.import_calls: list[dict[str, Any]] = []
        self.export_calls: list[dict[str, Any]] = []
        self.import_side_effect: Exception | None = None
        self.export_side_effect: Exception | None = None
        self.export_data: bytes | None = None

    async def site_archive_import(self, instance: Any, target: bytes, wait_options: Any = None) -> Any:
        self.import_calls.append({"target": target, "wait_options": wait_options})
        if self.import_side_effect:
            raise self.import_side_effect
        return object()

    async def site_archive_export_to_buffer(
        self, instance: Any, data_units: dict[str, Any], wait_options: Any = None
    ) -> _FakeExportResult:
        self.export_calls.append({"data_units": data_units, "wait_options": wait_options})
        if self.export_side_effect:
            raise self.export_side_effect
        assert self.export_data is not None
        return _FakeExportResult(data=self.export_data)


def _install_fake_jobs(monkeypatch: pytest.MonkeyPatch, fake: _FakeJobsSiteArchive) -> None:
    monkeypatch.setattr(
        cartridges,
        "_import_jobs_site_archive",
        lambda: (fake.site_archive_import, fake.site_archive_export_to_buffer),
    )


def test_bm_site_id_constant() -> None:
    assert BM_SITE_ID == "Sites-Site"


async def test_add_cartridge_bm_always_uses_import(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeJobsSiteArchive()
    fake.export_data = _zip_with("20240101_export/preferences.xml", "irrelevant")
    _install_fake_jobs(monkeypatch, fake)
    instance = _FakeInstance()  # no OCAPI/SCAPI configured at all -- BM never touches the backend

    result = await add_cartridge(  # type: ignore[arg-type]
        instance, BM_SITE_ID, AddCartridgeOptions(name="bm_ext", position="first")
    )

    assert result.site_id == BM_SITE_ID
    assert result.cartridges == "bm_ext"
    assert len(fake.import_calls) == 1
    with zipfile.ZipFile(io.BytesIO(fake.import_calls[0]["target"])) as zf:
        assert zf.namelist() == ["preferences.xml"]
        assert "CustomCartridges" in zf.read("preferences.xml").decode()
        assert "bm_ext" in zf.read("preferences.xml").decode()


async def test_set_cartridge_path_bm_uses_import(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeJobsSiteArchive()
    _install_fake_jobs(monkeypatch, fake)
    instance = _FakeInstance()

    result = await set_cartridge_path(instance, BM_SITE_ID, "a:b")  # type: ignore[arg-type]

    assert result.cartridges == "a:b"
    assert len(fake.import_calls) == 1


async def test_remove_cartridge_bm_uses_import_and_reads_export_when_get_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    fake = _FakeJobsSiteArchive()
    fake.export_data = _zip_with(
        "20240101_export/preferences.xml",
        '<preference preference-id="CustomCartridges">bm_ext:app_storefront_base</preference>',
    )
    _install_fake_jobs(monkeypatch, fake)
    instance = _FakeInstance()  # get_cartridge_path has no backend -> falls to export read

    result = await remove_cartridge(instance, BM_SITE_ID, "bm_ext")  # type: ignore[arg-type]

    assert result.cartridges == "app_storefront_base"
    assert len(fake.export_calls) == 1
    assert fake.export_calls[0]["data_units"] == {"global_data": {"preferences": True}}
    assert len(fake.import_calls) == 1


@respx.mock
async def test_add_cartridge_falls_back_to_import_when_direct_backend_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Direct OCAPI add fails; the read (get_cartridge_path) used to compute the
    # updated list also fails (same backend), so the fallback path reads via
    # site-archive export before importing the new path.
    respx.post(f"{SITES_URL}/RefArch/cartridges").mock(
        return_value=httpx.Response(500, json={"fault": {"type": "X", "message": "add failed"}})
    )
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(500, json={"fault": {"type": "X", "message": "get failed"}})
    )
    fake = _FakeJobsSiteArchive()
    fake.export_data = _zip_with("export/site.xml", "<cartridges>app_storefront_base</cartridges>")
    _install_fake_jobs(monkeypatch, fake)
    instance = _ocapi_instance()

    result = await add_cartridge(  # type: ignore[arg-type]
        instance, "RefArch", AddCartridgeOptions(name="new_cartridge", position="first")
    )

    assert result.cartridges == "new_cartridge:app_storefront_base"
    assert fake.export_calls[0]["data_units"] == {"sites": {"RefArch": {"site_descriptor": True}}}


@respx.mock
async def test_add_cartridge_raises_combined_error_when_both_backend_and_import_fail(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    respx.post(f"{SITES_URL}/RefArch/cartridges").mock(
        return_value=httpx.Response(500, json={"fault": {"type": "X", "message": "add failed"}})
    )
    respx.get(f"{SITES_URL}/RefArch").mock(
        return_value=httpx.Response(500, json={"fault": {"type": "X", "message": "get failed"}})
    )
    fake = _FakeJobsSiteArchive()
    fake.export_side_effect = RuntimeError("export also failed")
    _install_fake_jobs(monkeypatch, fake)
    instance = _ocapi_instance()

    with pytest.raises(RuntimeError) as exc_info:
        await add_cartridge(  # type: ignore[arg-type]
            instance, "RefArch", AddCartridgeOptions(name="new_cartridge", position="first")
        )

    message = str(exc_info.value)
    assert 'Failed to add cartridge path for site "RefArch"' in message
    assert "add failed" in message
    assert "export also failed" in message
    assert "sfcc.sites.rw" in message


async def test_add_cartridge_via_import_rejects_duplicate(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeJobsSiteArchive()
    fake.export_data = _zip_with(
        "export/preferences.xml",
        '<preference preference-id="CustomCartridges">existing_cartridge</preference>',
    )
    _install_fake_jobs(monkeypatch, fake)
    instance = _FakeInstance()  # no backend configured -> add falls back to export-based read

    with pytest.raises(RuntimeError, match="already exists"):
        await add_cartridge(  # type: ignore[arg-type]
            instance, BM_SITE_ID, AddCartridgeOptions(name="existing_cartridge", position="first")
        )


async def test_remove_cartridge_via_import_not_found_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = _FakeJobsSiteArchive()
    fake.export_data = _zip_with(
        "export/preferences.xml", '<preference preference-id="CustomCartridges">a:b</preference>'
    )
    _install_fake_jobs(monkeypatch, fake)
    instance = _FakeInstance()

    with pytest.raises(RuntimeError, match="not found in the cartridge path"):
        await remove_cartridge(instance, BM_SITE_ID, "missing")  # type: ignore[arg-type]


# --- cartridges: XML + zip helpers (white-box) -------------------------------------


def test_generate_and_parse_bm_preferences_xml_roundtrip() -> None:
    # Parsing extracts the raw preference text without unescaping XML entities,
    # so this roundtrips only for values with no XML-special characters; escaping
    # itself is covered separately by test_escape_xml.
    xml = cartridges._generate_bm_preferences_xml("app_storefront_base:plugin_x")
    assert cartridges._parse_bm_cartridges_from_preferences_xml(xml) == "app_storefront_base:plugin_x"


def test_generate_and_parse_site_descriptor_xml_roundtrip() -> None:
    xml = cartridges._generate_site_descriptor_xml("RefArch", "app_storefront_base:plugin_x")
    assert cartridges._parse_site_cartridges_from_descriptor_xml(xml) == "app_storefront_base:plugin_x"
    assert 'site-id="RefArch"' in xml


def test_parse_missing_preference_returns_empty_string() -> None:
    assert cartridges._parse_bm_cartridges_from_preferences_xml("<preferences></preferences>") == ""


def test_escape_xml() -> None:
    assert cartridges._escape_xml('a&b<c>d"e') == "a&amp;b&lt;c&gt;d&quot;e"


def test_find_file_in_zip_matches_nested_path_only() -> None:
    data = _zip_with("dir/site.xml", "content")
    assert cartridges._find_file_in_zip(data, "site.xml") == "content"
    assert cartridges._find_file_in_zip(data, "missing.xml") is None


def test_apply_cartridge_position_last() -> None:
    result = cartridges._apply_cartridge_position(["a", "b"], AddCartridgeOptions(name="c", position="last"))
    assert result == ["a", "b", "c"]


def test_apply_cartridge_position_after() -> None:
    result = cartridges._apply_cartridge_position(
        ["a", "b"], AddCartridgeOptions(name="c", position="after", target="a")
    )
    assert result == ["a", "c", "b"]


def test_apply_cartridge_position_target_not_found_raises() -> None:
    with pytest.raises(RuntimeError, match="not found in the cartridge path"):
        cartridges._apply_cartridge_position(
            ["a", "b"], AddCartridgeOptions(name="c", position="after", target="missing")
        )
