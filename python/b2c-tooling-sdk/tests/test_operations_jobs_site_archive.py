# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the site-archive import/export operations."""

from __future__ import annotations

import io
import json
import os
import zipfile
from pathlib import Path
from typing import Any

import pytest

from b2c_tooling_sdk.operations.jobs import site_archive as sa_module
from b2c_tooling_sdk.operations.jobs.site_archive import (
    RemoteArchiveTarget,
    SiteArchiveExportOptions,
    SiteArchiveImportSplitOptions,
    SplitImportPlanInfo,
    site_archive_export,
    site_archive_export_to_buffer,
    site_archive_export_to_path,
    site_archive_import,
    site_archive_import_split,
)
from tests._jobs_test_helpers import FakeInstance, FakeWebDav, zip_bytes


class _RecordedJob:
    """Captures the specs passed to the patched ``run_system_job``."""

    def __init__(self, execution: dict[str, Any] | None = None) -> None:
        self.specs: list[Any] = []
        self._execution = execution or {"id": "exec-1", "execution_status": "finished"}

    async def __call__(self, instance: Any, spec: Any) -> dict[str, Any]:
        self.specs.append(spec)
        return self._execution


@pytest.fixture
def recorded_job(monkeypatch: pytest.MonkeyPatch) -> _RecordedJob:
    job = _RecordedJob()
    monkeypatch.setattr(sa_module, "run_system_job", job)
    return job


def _names(content: bytes) -> list[str]:
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        return [n for n in archive.namelist() if not n.endswith("/")]


# --- import ------------------------------------------------------------------


async def test_import_from_directory_zips_and_uploads(recorded_job: _RecordedJob, tmp_path: Path) -> None:
    source = tmp_path / "archive"
    (source / "meta").mkdir(parents=True)
    (source / "meta" / "a.xml").write_text("<x/>")
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, str(source), archive_name="mydata")  # type: ignore[arg-type]

    assert result.archive_filename == "mydata.zip"
    assert result.archive_kept is False
    assert webdav.put_calls[0][0] == "Impex/src/instance/mydata.zip"
    assert "mydata/meta/a.xml" in _names(webdav.put_calls[0][1])
    # keep_archive defaults to False and wait defaults to True -> archive deleted.
    assert "Impex/src/instance/mydata.zip" in webdav.deleted
    spec = recorded_job.specs[0]
    assert spec.job_id == sa_module.IMPORT_JOB_ID
    assert spec.ocapi_body == {"file_name": "mydata.zip"}


async def test_import_from_bytes_wraps_under_generated_dir(recorded_job: _RecordedJob) -> None:
    raw = zip_bytes({"libraries/mylib/library.xml": b"<x/>"})
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, raw)  # type: ignore[arg-type]

    uploaded = webdav.put_calls[0][1]
    names = _names(uploaded)
    assert len(names) == 1
    assert names[0].endswith("/libraries/mylib/library.xml")
    assert names[0].startswith("import-")
    assert result.archive_filename.startswith("import-")


async def test_import_from_bytes_with_archive_name_uploads_verbatim(recorded_job: _RecordedJob) -> None:
    raw = zip_bytes({"meta/x.xml": b"<x/>"})
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, raw, archive_name="prebuilt.zip")  # type: ignore[arg-type]

    assert result.archive_filename == "prebuilt.zip"
    assert webdav.put_calls[0][1] == raw


async def test_import_from_zip_file_uploads_file_bytes(recorded_job: _RecordedJob, tmp_path: Path) -> None:
    raw = zip_bytes({"meta/x.xml": b"<x/>"})
    zip_path = tmp_path / "foo.zip"
    zip_path.write_bytes(raw)
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, str(zip_path))  # type: ignore[arg-type]

    assert result.archive_filename == "foo.zip"
    assert webdav.put_calls[0][1] == raw


async def test_import_remote_target_skips_upload(recorded_job: _RecordedJob) -> None:
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, RemoteArchiveTarget(remote_filename="already.zip"))  # type: ignore[arg-type]

    assert result.archive_filename == "already.zip"
    assert webdav.put_calls == []
    assert webdav.deleted == []


async def test_import_remote_target_from_mapping(recorded_job: _RecordedJob) -> None:
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, {"remote_filename": "remote.zip"})  # type: ignore[arg-type]

    assert result.archive_filename == "remote.zip"
    assert webdav.put_calls == []


async def test_import_keep_archive_does_not_delete(recorded_job: _RecordedJob) -> None:
    raw = zip_bytes({"meta/x.xml": b"<x/>"})
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, raw, keep_archive=True)  # type: ignore[arg-type]

    assert result.archive_kept is True
    assert webdav.deleted == []


async def test_import_no_wait_keeps_archive(recorded_job: _RecordedJob) -> None:
    raw = zip_bytes({"meta/x.xml": b"<x/>"})
    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_import(instance, raw, wait=False)  # type: ignore[arg-type]

    assert result.archive_kept is True
    assert webdav.deleted == []


async def test_import_paths_option_rejected_for_bytes(recorded_job: _RecordedJob) -> None:
    with pytest.raises(ValueError, match="paths option is only supported"):
        await site_archive_import(FakeInstance(webdav=FakeWebDav()), b"data", paths=["meta"])  # type: ignore[arg-type]


# --- split -------------------------------------------------------------------


async def test_import_split_produces_xml_and_asset_parts(recorded_job: _RecordedJob, tmp_path: Path) -> None:
    source = tmp_path / "big"
    # XML tier: three dependency-ordered units, each ~1.5 KiB of incompressible data.
    for unit, name in (("meta", "a.xml"), ("catalogs", "b.xml"), ("libraries", "c.xml")):
        unit_dir = source / unit
        unit_dir.mkdir(parents=True)
        (unit_dir / name).write_bytes(os.urandom(1500))
    # Asset tier: two static files that must live in separate parts.
    static_dir = source / "sites" / "SiteA" / "static"
    static_dir.mkdir(parents=True)
    (static_dir / "x.bin").write_bytes(os.urandom(2500))
    (static_dir / "y.bin").write_bytes(os.urandom(2500))

    webdav = FakeWebDav()
    instance = FakeInstance(webdav=webdav)
    plans: list[SplitImportPlanInfo] = []

    results = await site_archive_import_split(
        instance,  # type: ignore[arg-type]
        str(source),
        SiteArchiveImportSplitOptions(max_bytes=4096, archive_name="job", on_plan=plans.append),
    )

    assert plans and plans[0].xml_part_count >= 2
    assert plans[0].asset_part_count == 2
    assert plans[0].part_count == len(results)
    assert len(webdav.put_calls) == len(results)


async def test_import_split_requires_directory(recorded_job: _RecordedJob, tmp_path: Path) -> None:
    zip_path = tmp_path / "foo.zip"
    zip_path.write_bytes(zip_bytes({"meta/x.xml": b"<x/>"}))

    with pytest.raises(ValueError, match="requires a directory"):
        await site_archive_import_split(FakeInstance(webdav=FakeWebDav()), str(zip_path))  # type: ignore[arg-type]


# --- export ------------------------------------------------------------------


async def test_export_builds_data_units_parameters(recorded_job: _RecordedJob) -> None:
    instance = FakeInstance(webdav=FakeWebDav())
    data_units = {"sites": {"SiteA": {"all": True}}}

    result = await site_archive_export(instance, data_units)  # type: ignore[arg-type]

    assert result.archive_filename.endswith("_export.zip")
    spec = recorded_job.specs[0]
    assert spec.job_id == sa_module.EXPORT_JOB_ID
    data_units_param = next(p for p in spec.parameters if p["name"] == "DataUnits")
    assert json.loads(data_units_param["value"]) == data_units


async def test_export_to_buffer_downloads_and_deletes(recorded_job: _RecordedJob) -> None:
    archive = zip_bytes({"meta/x.txt": b"hi"})
    webdav = FakeWebDav(default_get_content=archive)
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_export_to_buffer(instance, {"sites": {}})  # type: ignore[arg-type]

    assert result.data == archive
    assert result.archive_kept is False
    assert webdav.deleted  # archive removed after download


async def test_export_to_buffer_keep_archive(recorded_job: _RecordedJob) -> None:
    webdav = FakeWebDav(default_get_content=b"zipdata")
    instance = FakeInstance(webdav=webdav)

    result = await site_archive_export_to_buffer(
        instance,  # type: ignore[arg-type]
        {"sites": {}},
        SiteArchiveExportOptions(keep_archive=True),
    )

    assert result.archive_kept is True
    assert webdav.deleted == []


async def test_export_to_path_writes_zip(recorded_job: _RecordedJob, tmp_path: Path) -> None:
    archive = zip_bytes({"meta/x.txt": b"hi"})
    instance = FakeInstance(webdav=FakeWebDav(default_get_content=archive))
    out = tmp_path / "out.zip"

    result = await site_archive_export_to_path(instance, {"sites": {}}, str(out))  # type: ignore[arg-type]

    assert result.local_path == str(out)
    assert out.read_bytes() == archive


async def test_export_to_path_extracts_directory(recorded_job: _RecordedJob, tmp_path: Path) -> None:
    archive = zip_bytes({"meta/x.txt": b"hi", "libraries/y.txt": b"yo"})
    instance = FakeInstance(webdav=FakeWebDav(default_get_content=archive))
    out = tmp_path / "extracted"

    result = await site_archive_export_to_path(instance, {"sites": {}}, str(out))  # type: ignore[arg-type]

    assert result.local_path == str(out)
    assert (out / "meta" / "x.txt").read_text() == "hi"
    assert (out / "libraries" / "y.txt").read_text() == "yo"
