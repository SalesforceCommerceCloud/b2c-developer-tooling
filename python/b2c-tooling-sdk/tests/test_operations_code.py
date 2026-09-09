# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for cartridge discovery, code-version management, deploy/upload/download,
watch, and the SCAPI/OCAPI dual scripts backend.

Mirrors ``packages/b2c-tooling-sdk/test/operations/code/*.test.ts``. WebDAV-based
operations (deploy, upload, download, watch) stub a fake auth strategy directly
(mirroring ``test_clients_webdav.py``), since :class:`WebDavClient` dispatches
through ``auth.fetch`` rather than a plain ``httpx`` transport. OCAPI/SCAPI
code-version operations use ``respx`` (mirroring ``test_operations_bm_roles.py``).
"""

from __future__ import annotations

import asyncio
import io
import os
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError
from b2c_tooling_sdk.clients.ocapi import DEFAULT_API_VERSION, create_ocapi_client
from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiRequestError
from b2c_tooling_sdk.errors import HttpError, NetworkError
from b2c_tooling_sdk.operations.code import (
    CartridgeMapping,
    CodeVersionInfo,
    DeployOptions,
    DownloadOptions,
    FileChange,
    FindCartridgesOptions,
    OcapiScriptsBackend,
    ScapiScriptsBackend,
    ScapiScriptsBackendConfig,
    ScriptsBackendConfig,
    UploadFilesOptions,
    UploadOptions,
    WatchOptions,
    create_scripts_backend,
    delete_cartridges,
    download_cartridges,
    download_single_cartridge,
    file_to_cartridge_path,
    find_and_deploy_cartridges,
    find_cartridges,
    reload_code_version,
    upload_cartridges,
    upload_files,
    watch_cartridges,
)
from b2c_tooling_sdk.operations.code.versions import CodeVersionActivationResult
from b2c_tooling_sdk.operations.util.zip import add_directory_to_zip

HOSTNAME = "example.demandware.net"
SHORT_CODE = "abcd1234"
TENANT_ID = "zzxy_prd"
ORGANIZATION_ID = "f_ecom_zzxy_prd"
CODE_VERSIONS_URL = f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}/code_versions"
SCAPI_CODE_VERSIONS_URL = (
    f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/dx/scripts/v1/organizations/{ORGANIZATION_ID}/code-versions"
)


# --- Fakes shared across tests -----------------------------------------------------


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
        self.cascades: list[list[list[str]]] = []
        self.invalidated = 0

    def with_additional_scopes(self, scopes: list[str]) -> _FakeCascadeAuth:
        return self

    async def get_authorization_header(self) -> str:
        return f"Bearer {self._header}"

    async def get_access_token_for_cascade(self, candidates: list[list[str]]) -> str:
        self.cascades.append(candidates)
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated += 1


class _FakeWebDavAuth:
    """Fake WebDAV auth strategy: records calls and returns/raises queued items in order."""

    def __init__(self, *items: httpx.Response | BaseException) -> None:
        self._items = list(items)
        self.calls: list[dict[str, Any]] = []

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        content: Any = None,
        **kwargs: Any,
    ) -> httpx.Response:
        self.calls.append({"url": url, "method": method, "headers": headers or {}, "content": content})
        if not self._items:
            raise AssertionError("FakeWebDavAuth.fetch called more times than items provided")
        item = self._items.pop(0)
        if isinstance(item, BaseException):
            raise item
        return item


@dataclass
class _FakeConfig:
    hostname: str = HOSTNAME
    code_version: str | None = "version1"


@dataclass
class _FakeScapiClientConfig:
    short_code: str
    tenant_id: str
    auth: Any


class _FakeInstance:
    """Duck-typed stand-in for ``B2CInstance``: config + webdav + ocapi + backend selection."""

    def __init__(
        self,
        *,
        config: _FakeConfig | None = None,
        webdav_auth: _FakeWebDavAuth | None = None,
        ocapi_client: Any = None,
        api_backend: str = "auto",
        scapi_client_config: _FakeScapiClientConfig | None = None,
    ) -> None:
        from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry
        from b2c_tooling_sdk.clients.webdav import WebDavClient

        self.config = config or _FakeConfig()
        self._webdav_auth = webdav_auth or _FakeWebDavAuth()
        self.webdav = WebDavClient(self.config.hostname, self._webdav_auth, middleware_registry=MiddlewareRegistry())
        self.ocapi = ocapi_client
        self.api_backend = api_backend
        self.scapi_client_config = scapi_client_config


def _scapi_backend(auth: _FakeCascadeAuth) -> ScapiScriptsBackend:
    config = ScapiScriptsBackendConfig(
        short_code=SHORT_CODE,
        tenant_id=TENANT_ID,
        auth=auth,  # type: ignore[arg-type]
        instance=_FakeInstance(),  # type: ignore[arg-type]
    )
    return ScapiScriptsBackend(config)


def _make_cartridge(tmp_path: Path, name: str, sub_dir: str | None = None) -> Path:
    """Create a minimal cartridge (a directory with a ``.project`` marker file)."""
    base = tmp_path / sub_dir if sub_dir else tmp_path
    cartridge_dir = base / name
    cartridge_dir.mkdir(parents=True, exist_ok=True)
    (cartridge_dir / ".project").write_text("")
    return cartridge_dir


# --- util/zip.add_directory_to_zip --------------------------------------------------


def test_add_directory_to_zip_writes_nested_entries(tmp_path: Path) -> None:
    (tmp_path / "b.txt").write_text("b")
    (tmp_path / "a.txt").write_text("a")
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "c.txt").write_text("c")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zip_file:
        add_directory_to_zip(zip_file, str(tmp_path), "prefix")

    with zipfile.ZipFile(io.BytesIO(buffer.getvalue())) as zip_file:
        names = sorted(zip_file.namelist())
        assert names == ["prefix/a.txt", "prefix/b.txt", "prefix/sub/c.txt"]
        assert zip_file.read("prefix/a.txt") == b"a"


def test_add_directory_to_zip_default_prefix_is_empty(tmp_path: Path) -> None:
    (tmp_path / "file.txt").write_text("x")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zip_file:
        add_directory_to_zip(zip_file, str(tmp_path))
    with zipfile.ZipFile(io.BytesIO(buffer.getvalue())) as zip_file:
        assert zip_file.namelist() == ["file.txt"]


# --- cartridges.find_cartridges -----------------------------------------------------


def test_find_cartridges_discovers_project_dirs(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "app_storefront_base")
    _make_cartridge(tmp_path, "app_custom", sub_dir="cartridges")

    result = find_cartridges(str(tmp_path))

    names = sorted(c.name for c in result)
    assert names == ["app_custom", "app_storefront_base"]
    for c in result:
        assert c.dest == c.name
        assert os.path.isabs(c.src)


def test_find_cartridges_include_filter(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "cart_a")
    _make_cartridge(tmp_path, "cart_b")

    result = find_cartridges(str(tmp_path), FindCartridgesOptions(include=["cart_a"]))

    assert [c.name for c in result] == ["cart_a"]


def test_find_cartridges_exclude_filter(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "cart_a")
    _make_cartridge(tmp_path, "cart_b")

    result = find_cartridges(str(tmp_path), FindCartridgesOptions(exclude=["cart_b"]))

    assert [c.name for c in result] == ["cart_a"]


def test_find_cartridges_first_match_only_stops_early(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "cart_a")
    _make_cartridge(tmp_path, "cart_b")

    result = find_cartridges(str(tmp_path), FindCartridgesOptions(first_match_only=True))

    assert len(result) == 1


def test_find_cartridges_ignores_node_modules(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "real_cartridge")
    _make_cartridge(tmp_path, "should_be_ignored", sub_dir="node_modules")

    result = find_cartridges(str(tmp_path))

    assert [c.name for c in result] == ["real_cartridge"]


def test_find_cartridges_max_depth_prunes_deep_dirs(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "shallow")
    _make_cartridge(tmp_path, "deep", sub_dir="a/b/c/d/e")

    # Depth is counted in path segments relative to the search dir, including the
    # ``.project`` marker itself, so a top-level cartridge's ``.project`` is depth 2.
    result = find_cartridges(str(tmp_path), FindCartridgesOptions(max_depth=2))

    assert [c.name for c in result] == ["shallow"]


def test_find_cartridges_no_directory_uses_cwd(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    _make_cartridge(tmp_path, "cwd_cartridge")
    monkeypatch.chdir(tmp_path)

    result = find_cartridges()

    assert [c.name for c in result] == ["cwd_cartridge"]


# --- versions.py (OCAPI code-version primitives, via OcapiScriptsBackend) ----------


def _ocapi_backend(auth: _FakeOcapiAuth | None = None) -> OcapiScriptsBackend:
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, auth or _FakeOcapiAuth()))
    return OcapiScriptsBackend(instance)  # type: ignore[arg-type]


@respx.mock
async def test_ocapi_list_code_versions_maps_fields() -> None:
    respx.get(CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {
                        "id": "version1",
                        "active": True,
                        "cartridges": ["app_storefront_base"],
                        "compatibility_mode": "21.2",
                        "activation_time": "2024-01-01T00:00:00.000Z",
                        "rollback": False,
                        "total_size": 1024,
                        "web_dav_url": "https://example/webdav/version1",
                    },
                    {"id": "version2", "active": False},
                ],
                "total": 2,
                "count": 2,
                "start": 0,
            },
        )
    )
    backend = _ocapi_backend()

    versions = await backend.list_code_versions()

    assert backend.name == "ocapi"
    assert [v.id for v in versions] == ["version1", "version2"]
    assert versions[0].active is True
    assert versions[0].cartridges == ["app_storefront_base"]
    assert versions[0].compatibility_mode == "21.2"
    assert versions[0].activation_time == "2024-01-01T00:00:00+00:00"
    assert versions[0].total_size == 1024
    assert versions[0].web_dav_url == "https://example/webdav/version1"
    assert isinstance(versions[0], CodeVersionInfo)


@respx.mock
async def test_ocapi_get_active_code_version_returns_none_when_none_active() -> None:
    respx.get(CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(
            200, json={"data": [{"id": "v1", "active": False}], "total": 1, "count": 1, "start": 0}
        )
    )
    backend = _ocapi_backend()

    active = await backend.get_active_code_version()

    assert active is None


@respx.mock
async def test_ocapi_activate_code_version() -> None:
    route = respx.patch(f"{CODE_VERSIONS_URL}/version2").mock(return_value=httpx.Response(200, json={}))
    backend = _ocapi_backend()

    result = await backend.activate_code_version("version2")

    assert result.already_active is False
    assert route.called


@respx.mock
async def test_ocapi_activate_code_version_already_active_is_idempotent() -> None:
    respx.patch(f"{CODE_VERSIONS_URL}/version2").mock(
        return_value=httpx.Response(
            400,
            json={
                "fault": {
                    "type": "CodeVersionModificationException",
                    "message": "already active",
                    "arguments": {"codeVersionId": "version2"},
                }
            },
        )
    )
    backend = _ocapi_backend()

    result = await backend.activate_code_version("version2")

    assert result.already_active is True


@respx.mock
async def test_ocapi_activate_code_version_other_fault_raises() -> None:
    respx.patch(f"{CODE_VERSIONS_URL}/version2").mock(
        return_value=httpx.Response(400, json={"fault": {"type": "SomeOtherFault", "message": "nope"}})
    )
    backend = _ocapi_backend()

    with pytest.raises(RuntimeError) as exc_info:
        await backend.activate_code_version("version2")
    assert "nope" in str(exc_info.value)


@respx.mock
async def test_ocapi_delete_code_version() -> None:
    route = respx.delete(f"{CODE_VERSIONS_URL}/version2").mock(return_value=httpx.Response(200, json={}))
    backend = _ocapi_backend()

    await backend.delete_code_version("version2")

    assert route.called


@respx.mock
async def test_ocapi_create_code_version() -> None:
    route = respx.put(f"{CODE_VERSIONS_URL}/version3").mock(return_value=httpx.Response(200, json={}))
    backend = _ocapi_backend()

    await backend.create_code_version("version3")

    assert route.called


@respx.mock
async def test_ocapi_list_code_versions_raises_deprecated_error() -> None:
    respx.get(CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(
            403, json={"fault": {"type": "OcapiDeprecatedException", "message": "OCAPI is deprecated"}}
        )
    )
    backend = _ocapi_backend()

    with pytest.raises(OcapiDeprecatedError):
        await backend.list_code_versions()


# --- scapi_scripts_backend.py -------------------------------------------------------


@respx.mock
async def test_scapi_list_code_versions_maps_fields_and_sends_bearer_token() -> None:
    route = respx.get(SCAPI_CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [
                    {
                        "id": "version1",
                        "active": True,
                        "cartridges": ["app_custom"],
                        "compatibilityMode": "22.7",
                        "activationTime": "2024-02-02T00:00:00.000Z",
                        "rollback": False,
                        "totalSize": 2048,
                        "webDavUrl": "https://example/webdav/version1",
                    }
                ],
                "total": 1,
                "limit": 25,
            },
        )
    )
    auth = _FakeCascadeAuth()
    backend = _scapi_backend(auth)

    versions = await backend.list_code_versions()

    assert backend.name == "scapi"
    assert versions[0].id == "version1"
    assert versions[0].cartridges == ["app_custom"]
    assert versions[0].compatibility_mode == "22.7"
    assert versions[0].activation_time == "2024-02-02T00:00:00+00:00"
    assert versions[0].total_size == 2048
    # The scripts client uses the legacy static-scope auth path (not the scope
    # cascade), so it authenticates via a plain bearer token from ``auth``.
    assert route.calls.last.request.headers["Authorization"] == "Bearer scapi-token"


@respx.mock
async def test_scapi_get_active_code_version() -> None:
    respx.get(SCAPI_CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(
            200,
            json={
                "data": [{"id": "v1", "active": False}, {"id": "v2", "active": True}],
                "total": 2,
                "limit": 25,
            },
        )
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    active = await backend.get_active_code_version()

    assert active is not None
    assert active.id == "v2"


@respx.mock
async def test_scapi_activate_code_version() -> None:
    route = respx.patch(f"{SCAPI_CODE_VERSIONS_URL}/version2").mock(return_value=httpx.Response(204))
    backend = _scapi_backend(_FakeCascadeAuth())

    result = await backend.activate_code_version("version2")

    assert result.already_active is False
    assert route.called


@respx.mock
async def test_scapi_delete_code_version() -> None:
    route = respx.delete(f"{SCAPI_CODE_VERSIONS_URL}/version2").mock(return_value=httpx.Response(204))
    backend = _scapi_backend(_FakeCascadeAuth())

    await backend.delete_code_version("version2")

    assert route.called


@respx.mock
async def test_scapi_create_code_version() -> None:
    route = respx.put(f"{SCAPI_CODE_VERSIONS_URL}/version3").mock(return_value=httpx.Response(204))
    backend = _scapi_backend(_FakeCascadeAuth())

    await backend.create_code_version("version3")

    assert route.called


@respx.mock
async def test_scapi_list_code_versions_raises_scapi_request_error() -> None:
    respx.get(SCAPI_CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(404, json={"title": "Not Found", "type": "not-found", "detail": "no versions"})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    with pytest.raises(ScapiRequestError) as exc_info:
        await backend.list_code_versions()
    assert exc_info.value.status == 404
    assert "no versions" in str(exc_info.value)


@respx.mock
async def test_scapi_activate_code_version_raises_scapi_request_error() -> None:
    respx.patch(f"{SCAPI_CODE_VERSIONS_URL}/version2").mock(
        return_value=httpx.Response(403, json={"title": "Forbidden", "type": "forbidden", "detail": "nope"})
    )
    backend = _scapi_backend(_FakeCascadeAuth())

    with pytest.raises(ScapiRequestError):
        await backend.activate_code_version("version2")


# --- scripts_backend.py (create_scripts_backend selection + reload_code_version) --


def test_create_scripts_backend_explicit_ocapi() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_scripts_backend(ScriptsBackendConfig(instance=instance, preference="ocapi"))  # type: ignore[arg-type]
    assert isinstance(backend, OcapiScriptsBackend)
    assert backend.name == "ocapi"


def test_create_scripts_backend_explicit_scapi() -> None:
    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeCascadeAuth())
    instance = _FakeInstance(scapi_client_config=scapi_config)
    backend = create_scripts_backend(ScriptsBackendConfig(instance=instance, preference="scapi"))  # type: ignore[arg-type]
    assert isinstance(backend, ScapiScriptsBackend)
    assert backend.name == "scapi"


def test_create_scripts_backend_explicit_scapi_without_config_raises() -> None:
    instance = _FakeInstance(scapi_client_config=None)
    with pytest.raises(ValueError):
        create_scripts_backend(ScriptsBackendConfig(instance=instance, preference="scapi"))  # type: ignore[arg-type]


@respx.mock
async def test_create_scripts_backend_auto_falls_back_to_ocapi_on_safe_rejection() -> None:
    respx.get(SCAPI_CODE_VERSIONS_URL).mock(return_value=httpx.Response(404, json={"title": "gone", "type": "x"}))
    respx.get(CODE_VERSIONS_URL).mock(
        return_value=httpx.Response(200, json={"data": [{"id": "v1"}], "total": 1, "count": 1, "start": 0})
    )

    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeCascadeAuth())
    instance = _FakeInstance(
        api_backend="auto",
        scapi_client_config=scapi_config,
        ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()),
    )

    backend = create_scripts_backend(ScriptsBackendConfig(instance=instance, preference=None))  # type: ignore[arg-type]
    assert backend.name == "scapi"

    versions = await backend.list_code_versions()

    assert [v.id for v in versions] == ["v1"]
    assert backend.name == "ocapi"  # type: ignore[comparison-overlap]


class _StubBackend:
    """Minimal in-memory :class:`ScriptsBackend` stub for testing ``reload_code_version``."""

    def __init__(self, versions: list[CodeVersionInfo]) -> None:
        self._versions = versions
        self.activated: list[str] = []

    @property
    def name(self) -> str:
        return "ocapi"

    async def list_code_versions(self) -> list[CodeVersionInfo]:
        return list(self._versions)

    async def get_active_code_version(self) -> CodeVersionInfo | None:
        return next((v for v in self._versions if v.active), None)

    async def activate_code_version(self, code_version_id: str) -> CodeVersionActivationResult:
        self.activated.append(code_version_id)
        for v in self._versions:
            v.active = v.id == code_version_id
        return CodeVersionActivationResult(already_active=False)

    async def delete_code_version(self, code_version_id: str) -> None:
        raise NotImplementedError

    async def create_code_version(self, code_version_id: str) -> None:
        raise NotImplementedError


async def test_reload_code_version_toggles_through_alternate_when_target_is_active() -> None:
    backend = _StubBackend([CodeVersionInfo(id="v1", active=True), CodeVersionInfo(id="v2", active=False)])

    await reload_code_version(backend, "v1")  # type: ignore[arg-type]

    assert backend.activated == ["v2", "v1"]


async def test_reload_code_version_defaults_to_active_version() -> None:
    backend = _StubBackend([CodeVersionInfo(id="v1", active=True), CodeVersionInfo(id="v2", active=False)])

    await reload_code_version(backend)  # type: ignore[arg-type]

    assert backend.activated == ["v2", "v1"]


async def test_reload_code_version_no_toggle_needed_for_inactive_target() -> None:
    backend = _StubBackend([CodeVersionInfo(id="v1", active=True), CodeVersionInfo(id="v2", active=False)])

    await reload_code_version(backend, "v2")  # type: ignore[arg-type]

    assert backend.activated == ["v2"]


async def test_reload_code_version_raises_without_target_or_active() -> None:
    backend = _StubBackend([CodeVersionInfo(id="v1", active=False)])

    with pytest.raises(RuntimeError, match="No code version specified"):
        await reload_code_version(backend)  # type: ignore[arg-type]


async def test_reload_code_version_raises_when_no_alternate_available() -> None:
    backend = _StubBackend([CodeVersionInfo(id="v1", active=True)])

    with pytest.raises(RuntimeError, match="no alternate code version"):
        await reload_code_version(backend, "v1")  # type: ignore[arg-type]


# --- deploy.py: delete_cartridges / upload_cartridges / find_and_deploy_cartridges -


async def test_delete_cartridges_requires_code_version() -> None:
    instance = _FakeInstance(config=_FakeConfig(code_version=None))
    with pytest.raises(RuntimeError, match="Code version required"):
        await delete_cartridges(instance, [CartridgeMapping(name="a", src="/a", dest="a")])  # type: ignore[arg-type]


async def test_delete_cartridges_no_op_on_empty_list() -> None:
    instance = _FakeInstance()
    await delete_cartridges(instance, [])  # type: ignore[arg-type]
    assert instance._webdav_auth.calls == []


async def test_delete_cartridges_deletes_each_and_ignores_errors() -> None:
    auth = _FakeWebDavAuth(httpx.Response(204), httpx.Response(404))
    instance = _FakeInstance(webdav_auth=auth)
    cartridges = [
        CartridgeMapping(name="a", src="/a", dest="a"),
        CartridgeMapping(name="b", src="/b", dest="b"),
    ]

    await delete_cartridges(instance, cartridges)  # type: ignore[arg-type]

    assert [c["method"] for c in auth.calls] == ["DELETE", "DELETE"]


async def test_upload_cartridges_requires_code_version() -> None:
    instance = _FakeInstance(config=_FakeConfig(code_version=None))
    with pytest.raises(RuntimeError, match="Code version required"):
        await upload_cartridges(instance, [CartridgeMapping(name="a", src="/a", dest="a")])  # type: ignore[arg-type]


async def test_upload_cartridges_requires_cartridges() -> None:
    instance = _FakeInstance()
    with pytest.raises(RuntimeError, match="No cartridges to upload"):
        await upload_cartridges(instance, [])  # type: ignore[arg-type]


async def test_upload_cartridges_happy_path(tmp_path: Path) -> None:
    cartridge_dir = _make_cartridge(tmp_path, "app_custom")
    (cartridge_dir / "cartridge.js").write_text("module.exports = {};")

    progress_events: list[tuple[str, int]] = []
    auth = _FakeWebDavAuth(httpx.Response(201), httpx.Response(200), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)
    cartridges = [CartridgeMapping(name="app_custom", src=str(cartridge_dir), dest="app_custom")]

    await upload_cartridges(
        instance,  # type: ignore[arg-type]
        cartridges,
        UploadOptions(on_progress=lambda info: progress_events.append((info.phase, info.elapsed_seconds))),
    )

    methods = [c["method"] for c in auth.calls]
    assert methods == ["PUT", "POST", "DELETE"]
    assert auth.calls[0]["url"].endswith(".zip")
    assert auth.calls[1]["content"] == "method=UNZIP"
    phases = [phase for phase, _elapsed in progress_events]
    assert phases == ["archiving", "uploading", "unzipping", "cleanup"]


async def test_upload_cartridges_unzip_failure_raises_runtime_error(tmp_path: Path) -> None:
    cartridge_dir = _make_cartridge(tmp_path, "app_custom")
    auth = _FakeWebDavAuth(httpx.Response(201), httpx.Response(500, text="boom"))
    instance = _FakeInstance(webdav_auth=auth)
    cartridges = [CartridgeMapping(name="app_custom", src=str(cartridge_dir), dest="app_custom")]

    with pytest.raises(RuntimeError, match="Failed to unzip archive"):
        await upload_cartridges(instance, cartridges)  # type: ignore[arg-type]


async def test_upload_cartridges_network_error_during_unzip_is_enriched(tmp_path: Path) -> None:
    cartridge_dir = _make_cartridge(tmp_path, "app_custom")
    auth = _FakeWebDavAuth(httpx.Response(201), ConnectionResetError("connection reset"))
    instance = _FakeInstance(webdav_auth=auth)
    cartridges = [CartridgeMapping(name="app_custom", src=str(cartridge_dir), dest="app_custom")]

    with pytest.raises(NetworkError) as exc_info:
        await upload_cartridges(instance, cartridges)  # type: ignore[arg-type]

    assert exc_info.value.kind == "connection-reset"
    assert "may still be extracting" in str(exc_info.value)


async def test_upload_cartridges_timeout_during_unzip_is_enriched(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import b2c_tooling_sdk.operations.code.deploy as deploy_module

    monkeypatch.setattr(deploy_module, "UNZIP_TIMEOUT_SECONDS", 0.01)

    cartridge_dir = _make_cartridge(tmp_path, "app_custom")

    class _SlowUnzipAuth(_FakeWebDavAuth):
        async def fetch(
            self,
            url: str,
            *,
            method: str = "GET",
            headers: dict[str, str] | None = None,
            content: Any = None,
            **kwargs: Any,
        ) -> httpx.Response:
            if method == "POST":
                await asyncio.sleep(1)
            return await super().fetch(url, method=method, headers=headers, content=content, **kwargs)

    auth = _SlowUnzipAuth(httpx.Response(201))
    instance = _FakeInstance(webdav_auth=auth)
    cartridges = [CartridgeMapping(name="app_custom", src=str(cartridge_dir), dest="app_custom")]

    with pytest.raises(NetworkError) as exc_info:
        await upload_cartridges(instance, cartridges)  # type: ignore[arg-type]

    assert exc_info.value.kind == "timeout"


async def test_find_and_deploy_cartridges_requires_code_version(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "app_custom")
    instance = _FakeInstance(config=_FakeConfig(code_version=None))
    with pytest.raises(RuntimeError, match="Code version required"):
        await find_and_deploy_cartridges(instance, str(tmp_path))  # type: ignore[arg-type]


async def test_find_and_deploy_cartridges_no_cartridges_found(tmp_path: Path) -> None:
    instance = _FakeInstance()
    with pytest.raises(RuntimeError, match="No cartridges found"):
        await find_and_deploy_cartridges(instance, str(tmp_path))  # type: ignore[arg-type]


async def test_find_and_deploy_cartridges_uploads_and_activates(tmp_path: Path) -> None:
    cartridge_dir = _make_cartridge(tmp_path, "app_custom")
    (cartridge_dir / "file.js").write_text("x")

    auth = _FakeWebDavAuth(httpx.Response(201), httpx.Response(200), httpx.Response(204))
    ocapi_auth = _FakeOcapiAuth()
    instance = _FakeInstance(webdav_auth=auth, ocapi_client=create_ocapi_client(HOSTNAME, ocapi_auth))

    with respx.mock:
        respx.patch(f"{CODE_VERSIONS_URL}/version1").mock(return_value=httpx.Response(200, json={}))
        result = await find_and_deploy_cartridges(
            instance,  # type: ignore[arg-type]
            str(tmp_path),
            DeployOptions(activate=True),
        )

    assert result.activated is True
    assert result.reloaded is False
    assert [c.name for c in result.cartridges] == ["app_custom"]
    assert result.code_version == "version1"


async def test_find_and_deploy_cartridges_deletes_before_upload_when_requested(tmp_path: Path) -> None:
    cartridge_dir = _make_cartridge(tmp_path, "app_custom")
    (cartridge_dir / "file.js").write_text("x")

    # delete (1 DELETE) then upload (PUT, POST, DELETE cleanup).
    auth = _FakeWebDavAuth(httpx.Response(204), httpx.Response(201), httpx.Response(200), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)

    result = await find_and_deploy_cartridges(
        instance,  # type: ignore[arg-type]
        str(tmp_path),
        DeployOptions(delete=True),
    )

    methods = [c["method"] for c in auth.calls]
    assert methods == ["DELETE", "PUT", "POST", "DELETE"]
    assert result.activated is False


# --- upload_files.py -----------------------------------------------------------------


def test_file_to_cartridge_path_maps_relative_path() -> None:
    cartridges = [CartridgeMapping(name="app_custom", src="/proj/cartridges/app_custom", dest="app_custom")]

    change = file_to_cartridge_path("/proj/cartridges/app_custom/cartridge/scripts/x.js", cartridges)

    assert change is not None
    assert change.dest == os.path.join("app_custom", "cartridge", "scripts", "x.js")


def test_file_to_cartridge_path_returns_none_when_outside_cartridges() -> None:
    cartridges = [CartridgeMapping(name="app_custom", src="/proj/cartridges/app_custom", dest="app_custom")]

    change = file_to_cartridge_path("/proj/other/file.js", cartridges)

    assert change is None


async def test_upload_files_uploads_and_deletes(tmp_path: Path) -> None:
    upload_src = tmp_path / "file.js"
    upload_src.write_text("content")

    uploaded: list[list[str]] = []
    deleted: list[list[str]] = []
    # PUT (upload) -> POST (unzip) -> DELETE (temp archive cleanup) -> DELETE (other.js).
    auth = _FakeWebDavAuth(httpx.Response(201), httpx.Response(200), httpx.Response(204), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)

    await upload_files(
        instance,  # type: ignore[arg-type]
        "version1",
        [FileChange(src=str(upload_src), dest="app_custom/file.js")],
        [FileChange(src="/missing/other.js", dest="app_custom/other.js")],
        UploadFilesOptions(on_upload=uploaded.append, on_delete=deleted.append),
    )

    methods = [c["method"] for c in auth.calls]
    assert methods == ["PUT", "POST", "DELETE", "DELETE"]
    assert uploaded == [["app_custom/file.js"]]
    assert deleted == [["app_custom/other.js"]]


async def test_upload_files_skips_missing_files(tmp_path: Path) -> None:
    instance = _FakeInstance()

    await upload_files(
        instance,  # type: ignore[arg-type]
        "version1",
        [FileChange(src=str(tmp_path / "missing.js"), dest="app_custom/missing.js")],
        [],
    )

    assert instance._webdav_auth.calls == []


async def test_upload_files_skips_delete_for_files_also_uploaded(tmp_path: Path) -> None:
    src = tmp_path / "file.js"
    src.write_text("x")
    # PUT (upload) -> POST (unzip) -> DELETE (temp archive cleanup). No per-file DELETE
    # for app_custom/file.js since it's also in the uploads list (dedup skip).
    auth = _FakeWebDavAuth(httpx.Response(201), httpx.Response(200), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)

    await upload_files(
        instance,  # type: ignore[arg-type]
        "version1",
        [FileChange(src=str(src), dest="app_custom/file.js")],
        [FileChange(src=str(src), dest="app_custom/file.js")],
    )

    # Exactly one DELETE (temp archive cleanup) -- no separate per-file DELETE since
    # the delete target was also uploaded.
    methods = [c["method"] for c in auth.calls]
    assert methods == ["PUT", "POST", "DELETE"]
    assert methods.count("DELETE") == 1


async def test_upload_files_error_callback_invoked_and_reraised(tmp_path: Path) -> None:
    src = tmp_path / "file.js"
    src.write_text("x")
    errors: list[Exception] = []
    auth = _FakeWebDavAuth(httpx.Response(500, text="fail"))
    instance = _FakeInstance(webdav_auth=auth)

    with pytest.raises(HttpError):
        await upload_files(
            instance,  # type: ignore[arg-type]
            "version1",
            [FileChange(src=str(src), dest="app_custom/file.js")],
            [],
            UploadFilesOptions(on_error=errors.append),
        )

    assert len(errors) == 1


# --- download.py -----------------------------------------------------------------------


def _single_cartridge_zip(cartridge_name: str, file_name: str, content: bytes) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zip_file:
        zip_file.writestr(f"{cartridge_name}/{file_name}", content)
    return buffer.getvalue()


def _full_code_version_zip(code_version: str, cartridge_name: str, file_name: str, content: bytes) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zip_file:
        zip_file.writestr(f"{code_version}/{cartridge_name}/{file_name}", content)
    return buffer.getvalue()


async def test_download_single_cartridge_extracts_files(tmp_path: Path) -> None:
    archive = _single_cartridge_zip("app_custom", "file.js", b"hello")
    auth = _FakeWebDavAuth(httpx.Response(200), httpx.Response(200, content=archive), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)
    output_path = tmp_path / "output" / "app_custom"

    await download_single_cartridge(instance, "version1", "app_custom", str(output_path))  # type: ignore[arg-type]

    assert (output_path / "file.js").read_bytes() == b"hello"
    methods = [c["method"] for c in auth.calls]
    assert methods == ["POST", "GET", "DELETE"]


async def test_download_cartridges_full_code_version(tmp_path: Path) -> None:
    archive = _full_code_version_zip("version1", "app_custom", "file.js", b"world")
    auth = _FakeWebDavAuth(httpx.Response(200), httpx.Response(200, content=archive), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)

    result = await download_cartridges(instance, str(tmp_path))  # type: ignore[arg-type]

    assert result.cartridges == ["app_custom"]
    assert result.code_version == "version1"
    assert (Path(result.output_directory) / "app_custom" / "file.js").read_bytes() == b"world"


async def test_download_cartridges_with_include_downloads_individually(tmp_path: Path) -> None:
    archive = _single_cartridge_zip("app_custom", "file.js", b"data")
    auth = _FakeWebDavAuth(httpx.Response(200), httpx.Response(200, content=archive), httpx.Response(204))
    instance = _FakeInstance(webdav_auth=auth)

    result = await download_cartridges(instance, str(tmp_path), DownloadOptions(include=["app_custom"]))  # type: ignore[arg-type]

    assert result.cartridges == ["app_custom"]


async def test_download_cartridges_raises_without_code_version_or_active_backend() -> None:
    instance = _FakeInstance(config=_FakeConfig(code_version=None))
    ocapi_auth = _FakeOcapiAuth()
    instance.ocapi = create_ocapi_client(HOSTNAME, ocapi_auth)

    with respx.mock:
        respx.get(CODE_VERSIONS_URL).mock(return_value=httpx.Response(500, json={"fault": {"message": "boom"}}))
        with pytest.raises(RuntimeError, match="Code version required for download"):
            await download_cartridges(instance, "/tmp/out")  # type: ignore[arg-type]


async def test_download_single_cartridge_zip_failure_raises() -> None:
    auth = _FakeWebDavAuth(httpx.Response(500, text="zip failed"))
    instance = _FakeInstance(webdav_auth=auth)

    with pytest.raises(RuntimeError, match="Failed to create server-side zip"):
        await download_single_cartridge(instance, "version1", "app_custom", "/tmp/out/app_custom")  # type: ignore[arg-type]


# --- watch.py --------------------------------------------------------------------------


async def test_watch_cartridges_detects_add_and_uploads(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    cartridge_dir = _make_cartridge(tmp_path, "app_custom")

    uploaded: list[list[str]] = []
    auth = _FakeWebDavAuth()
    instance = _FakeInstance(webdav_auth=auth)

    async def _noop_upload_files(*args: Any, **kwargs: Any) -> None:
        options = args[4] if len(args) > 4 else kwargs.get("options")
        upload_changes = args[2]
        if options and options.on_upload:
            options.on_upload([c.dest for c in upload_changes])
        uploaded.append([c.dest for c in upload_changes])

    import b2c_tooling_sdk.operations.code.watch as watch_module

    monkeypatch.setattr(watch_module, "upload_files", _noop_upload_files)

    result = await watch_cartridges(
        instance,  # type: ignore[arg-type]
        str(tmp_path),
        WatchOptions(poll_interval_seconds=0.01, debounce_time_ms=1),
    )
    try:
        # Let the poll loop's task actually start and take its initial (pre-mutation)
        # snapshot before we create the new file -- asyncio.ensure_future() only
        # schedules the task, it doesn't run any of its code until the event loop
        # yields at an await point.
        await asyncio.sleep(0.02)
        (cartridge_dir / "new_file.js").write_text("x")
        for _ in range(50):
            await asyncio.sleep(0.02)
            if uploaded:
                break
    finally:
        await result.stop()

    assert uploaded, "expected the new file to be detected and uploaded"
    assert any("new_file.js" in dest for batch in uploaded for dest in batch)


async def test_watch_cartridges_raises_without_cartridges(tmp_path: Path) -> None:
    instance = _FakeInstance()
    with pytest.raises(RuntimeError, match="No cartridges found"):
        await watch_cartridges(instance, str(tmp_path), WatchOptions(poll_interval_seconds=0.01))  # type: ignore[arg-type]


async def test_watch_cartridges_discovers_active_version_when_unset(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "app_custom")
    instance = _FakeInstance(config=_FakeConfig(code_version=None))
    ocapi_auth = _FakeOcapiAuth()
    instance.ocapi = create_ocapi_client(HOSTNAME, ocapi_auth)

    with respx.mock:
        respx.get(CODE_VERSIONS_URL).mock(
            return_value=httpx.Response(
                200, json={"data": [{"id": "active-version", "active": True}], "total": 1, "count": 1, "start": 0}
            )
        )
        result = await watch_cartridges(instance, str(tmp_path), WatchOptions(poll_interval_seconds=0.01))  # type: ignore[arg-type]

    assert result.code_version == "active-version"
    await result.stop()


async def test_watch_cartridges_stop_is_idempotent_and_stops_polling(tmp_path: Path) -> None:
    _make_cartridge(tmp_path, "app_custom")
    instance = _FakeInstance()

    result = await watch_cartridges(instance, str(tmp_path), WatchOptions(poll_interval_seconds=0.01))  # type: ignore[arg-type]

    await result.stop()
    # Give the loop a moment; no exception should propagate from a cancelled poll task.
    await asyncio.sleep(0.05)
