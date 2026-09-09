# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for import sets, the dual-backend system-job runner, and unit discovery."""

from __future__ import annotations

import importlib
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import pytest

from b2c_tooling_sdk.operations.jobs import discover as discover_module
from b2c_tooling_sdk.operations.jobs import import_set as import_set_module
from b2c_tooling_sdk.operations.jobs.discover import discover_exportable_units
from b2c_tooling_sdk.operations.jobs.import_set import (
    DiscoverImportSetOptions,
    ImportSetEvent,
    SiteArchiveImportSetOptions,
    discover_import_set,
    site_archive_import_set,
)
from b2c_tooling_sdk.operations.jobs.run import JobExecutionError, WaitForJobOptions
from b2c_tooling_sdk.operations.jobs.run_system_job import SystemJobSpec, run_system_job
from b2c_tooling_sdk.operations.jobs.site_archive import SiteArchiveImportResult
from tests._jobs_test_helpers import (
    FakeHttpClient,
    FakeInstance,
    FakeScapiConfig,
    FakeWebDav,
    err,
    noop_sleep,
    ok,
)

# ``run_system_job`` names both the submodule and the re-exported function; the
# barrel shadows the submodule attribute, so resolve the module via importlib.
rsj_module = importlib.import_module("b2c_tooling_sdk.operations.jobs.run_system_job")

# --- discover_import_set -----------------------------------------------------


async def test_discover_import_set_lists_directories_and_zips(tmp_path: Path) -> None:
    root = tmp_path / "set"
    root.mkdir()
    (root / "catalogs").mkdir()
    libs = root / "libraries"
    libs.mkdir()
    (libs / "README.md").write_text("  library note  ")
    (root / "archive.zip").write_bytes(b"PK")
    (root / ".hidden").mkdir()

    items = await discover_import_set(str(root), DiscoverImportSetOptions(include_cartridge_metadata=False))

    assert [item.id for item in items] == ["archive.zip", "catalogs", "libraries"]
    kinds = {item.id: item.kind for item in items}
    assert kinds == {"archive.zip": "zip", "catalogs": "directory", "libraries": "directory"}
    notes = {item.id: item.note for item in items}
    assert notes["libraries"] == "library note"


async def test_discover_import_set_empty_directory_raises(tmp_path: Path) -> None:
    empty = tmp_path / "empty"
    empty.mkdir()
    with pytest.raises(ValueError, match="No import directories"):
        await discover_import_set(str(empty), DiscoverImportSetOptions(include_cartridge_metadata=False))


async def test_discover_import_set_missing_directory_raises(tmp_path: Path) -> None:
    missing = tmp_path / "nope"
    with pytest.raises(ValueError, match="does not exist"):
        await discover_import_set(str(missing), DiscoverImportSetOptions(include_cartridge_metadata=False))


async def test_discover_import_set_cartridge_metadata(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    cartridge = tmp_path / "app_storefront"
    (cartridge / "metadata" / "meta").mkdir(parents=True)
    monkeypatch.setattr(
        import_set_module,
        "find_cartridges",
        lambda root: [SimpleNamespace(name="app_storefront", src=str(cartridge))],
    )
    empty = tmp_path / "empty"
    empty.mkdir()

    items = await discover_import_set(str(empty))

    assert any(item.id == "cartridge-metadata/app_storefront" for item in items)


# --- site_archive_import_set -------------------------------------------------


def _import_set_dir(tmp_path: Path) -> Path:
    root = tmp_path / "import-set"
    (root / "meta").mkdir(parents=True)
    (root / "meta" / "a.xml").write_text("<x/>")
    (root / "sites").mkdir()
    (root / "sites" / "b.xml").write_text("<y/>")
    return root


def _fake_import_archive() -> Any:
    async def importer(instance: Any, target: str, options: Any) -> SiteArchiveImportResult:
        return SiteArchiveImportResult(execution={"id": "e1"}, archive_filename="a.zip", archive_kept=False)

    return importer


async def test_import_set_applies_pending_items(tmp_path: Path) -> None:
    root = _import_set_dir(tmp_path)
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)
    events: list[ImportSetEvent] = []

    result = await site_archive_import_set(
        instance,  # type: ignore[arg-type]
        str(root),
        SiteArchiveImportSetOptions(
            include_cartridge_metadata=False,
            import_archive=_fake_import_archive(),
            on_event=events.append,
            sleep=noop_sleep,
        ),
    )

    assert result.imported == 2
    assert result.pending == 0
    assert result.skipped == 0
    # Lock acquired and released.
    event_types = [event.type for event in events]
    assert "lock-acquired" in event_types
    assert event_types.count("item-imported") == 2
    lock_path = "Impex/b2c-cli/import-sets/migrations/lock"
    assert lock_path in webdav.deleted


async def test_import_set_idempotent_skip_on_second_run(tmp_path: Path) -> None:
    root = _import_set_dir(tmp_path)
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)
    options = SiteArchiveImportSetOptions(
        include_cartridge_metadata=False,
        import_archive=_fake_import_archive(),
        sleep=noop_sleep,
    )

    first = await site_archive_import_set(instance, str(root), options)  # type: ignore[arg-type]
    assert first.imported == 2

    second = await site_archive_import_set(instance, str(root), options)  # type: ignore[arg-type]
    assert second.skipped == 2
    assert second.imported == 0


async def test_import_set_dry_run_plans_without_state(tmp_path: Path) -> None:
    root = _import_set_dir(tmp_path)
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import_set(
        instance,  # type: ignore[arg-type]
        str(root),
        SiteArchiveImportSetOptions(
            dry_run=True,
            include_cartridge_metadata=False,
            import_archive=_fake_import_archive(),
            sleep=noop_sleep,
        ),
    )

    assert result.dry_run is True
    assert result.pending == 2
    # No lock/receipt writes performed in a dry run.
    assert webdav.requests == []


async def test_import_set_invalid_set_id_raises(tmp_path: Path) -> None:
    root = _import_set_dir(tmp_path)
    with pytest.raises(ValueError, match="Invalid import-set ID"):
        await site_archive_import_set(
            FakeInstance(webdav=FakeWebDav()),  # type: ignore[arg-type]
            str(root),
            SiteArchiveImportSetOptions(set_id="bad id!", include_cartridge_metadata=False),
        )


# --- run_system_job ----------------------------------------------------------


def _spec(**overrides: Any) -> SystemJobSpec:
    base = {
        "job_id": "sfcc-site-archive-import",
        "ocapi_body": {"file_name": "x.zip"},
        "parameters": [{"name": "ImportFile", "value": "x.zip"}],
        "fail_verb": "execute import job",
        "wait": False,
    }
    base.update(overrides)
    return SystemJobSpec(**base)  # type: ignore[arg-type]


async def test_run_system_job_ocapi_path(monkeypatch: pytest.MonkeyPatch) -> None:
    instance = FakeInstance(api_backend="ocapi", ocapi=FakeHttpClient(lambda m, p, o: ok({"id": "ocapi-1"})))

    result = await run_system_job(instance, _spec())  # type: ignore[arg-type]

    assert result["id"] == "ocapi-1"


async def test_run_system_job_ocapi_unknown_property_retry() -> None:
    posts = {"count": 0}

    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        posts["count"] += 1
        if posts["count"] == 1:
            return err(
                400,
                {"fault": {"type": "UnknownPropertyException", "arguments": {"document": "job_execution_request"}}},
            )
        return ok({"id": "retry-1"})

    instance = FakeInstance(api_backend="ocapi", ocapi=FakeHttpClient(handler))

    result = await run_system_job(instance, _spec())  # type: ignore[arg-type]

    assert result["id"] == "retry-1"
    assert instance.ocapi.calls[1][2]["body"] == {"parameters": [{"name": "ImportFile", "value": "x.zip"}]}


async def test_run_system_job_ocapi_failure_raises() -> None:
    instance = FakeInstance(
        api_backend="ocapi", ocapi=FakeHttpClient(lambda m, p, o: err(500, {"fault": {"message": "nope"}}))
    )

    with pytest.raises(RuntimeError, match="nope"):
        await run_system_job(instance, _spec())  # type: ignore[arg-type]


async def test_run_system_job_scapi_path(monkeypatch: pytest.MonkeyPatch) -> None:
    scapi_client = FakeHttpClient(lambda m, p, o: ok({"id": "scapi-1", "jobId": "j", "executionStatus": "pending"}))
    monkeypatch.setattr(rsj_module, "create_scapi_jobs_client", lambda config, auth: scapi_client)
    instance = FakeInstance(api_backend="scapi", scapi_client_config=FakeScapiConfig())

    result = await run_system_job(instance, _spec())  # type: ignore[arg-type]

    assert result["id"] == "scapi-1"
    assert result["execution_status"] == "pending"


async def test_run_system_job_auto_falls_back_to_ocapi_on_safe_rejection(monkeypatch: pytest.MonkeyPatch) -> None:
    scapi_client = FakeHttpClient(lambda m, p, o: err(400, {"detail": "bad request"}))
    monkeypatch.setattr(rsj_module, "create_scapi_jobs_client", lambda config, auth: scapi_client)
    ocapi_client = FakeHttpClient(lambda m, p, o: ok({"id": "ocapi-fallback"}))
    instance = FakeInstance(api_backend="auto", scapi_client_config=FakeScapiConfig(), ocapi=ocapi_client)

    result = await run_system_job(instance, _spec())  # type: ignore[arg-type]

    assert result["id"] == "ocapi-fallback"
    assert scapi_client.calls  # SCAPI start was attempted first


async def test_run_system_job_scapi_failure_raises_job_execution_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(method: str, path: str, options: dict[str, Any]) -> Any:
        if method == "POST":
            return ok({"id": "s1", "jobId": "j", "executionStatus": "pending"})
        return ok({"id": "s1", "jobId": "j", "executionStatus": "aborted"})

    monkeypatch.setattr(rsj_module, "create_scapi_jobs_client", lambda config, auth: FakeHttpClient(handler))
    instance = FakeInstance(api_backend="scapi", scapi_client_config=FakeScapiConfig())

    with pytest.raises(JobExecutionError):
        await run_system_job(
            instance,  # type: ignore[arg-type]
            _spec(wait=True, wait_options=WaitForJobOptions(sleep=noop_sleep)),
        )


# --- discover_exportable_units -----------------------------------------------


class _FakeUnitBackend:
    def __init__(self, items: list[Any]) -> None:
        self._items = items

    async def list_sites(self) -> list[Any]:
        return self._items

    async def list_catalogs(self) -> list[Any]:
        return self._items


async def test_discover_exportable_units_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        discover_module,
        "_create_sites_backend",
        lambda instance: _FakeUnitBackend([SimpleNamespace(id="SiteB"), SimpleNamespace(id="SiteA")]),
    )
    monkeypatch.setattr(
        discover_module,
        "_create_catalogs_backend",
        lambda instance: _FakeUnitBackend([SimpleNamespace(id="cat-2"), SimpleNamespace(id="cat-1")]),
    )
    ocapi = FakeHttpClient(lambda m, p, o: ok({"data": [{"id": "inv-b"}, {"id": "inv-a"}], "total": 2}))
    instance = FakeInstance(api_backend="auto", ocapi=ocapi)

    result = await discover_exportable_units(instance)  # type: ignore[arg-type]

    assert result.sites == ["SiteA", "SiteB"]
    assert result.catalogs == ["cat-1", "cat-2"]
    assert result.inventory_lists == ["inv-a", "inv-b"]
    assert result.warnings == []


async def test_discover_exportable_units_records_warning_on_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise(instance: Any) -> Any:
        raise RuntimeError("no permission")

    monkeypatch.setattr(discover_module, "_create_sites_backend", _raise)
    monkeypatch.setattr(
        discover_module,
        "_create_catalogs_backend",
        lambda instance: _FakeUnitBackend([SimpleNamespace(id="cat-1")]),
    )
    ocapi = FakeHttpClient(lambda m, p, o: ok({"data": [], "total": 0}))
    instance = FakeInstance(api_backend="auto", ocapi=ocapi)

    result = await discover_exportable_units(instance)  # type: ignore[arg-type]

    assert result.sites == []
    assert any("Could not list sites" in warning for warning in result.warnings)
    assert result.catalogs == ["cat-1"]
