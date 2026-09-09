# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Site archive import/export operations for B2C Commerce.

Mirrors ``src/operations/jobs/site-archive.ts``. Provides functions for
importing and exporting site archives using the ``sfcc-site-archive-import`` and
``sfcc-site-archive-export`` system jobs.

Node/TS mappings used here:

* ``Buffer`` -> :class:`bytes`
* ``JSZip`` -> :mod:`zipfile` (over an in-memory :class:`io.BytesIO`)
* ``glob``/``hasMagic`` -> :mod:`glob` + a small magic-character check
* ``zlib.deflateRawSync`` -> :mod:`zlib` raw DEFLATE via ``compressobj``
"""

from __future__ import annotations

import glob as globmod
import io
import json
import os
import zipfile
import zlib
from collections.abc import Callable, Mapping
from dataclasses import dataclass, replace
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, TypeVar

from b2c_tooling_sdk.clients.scapi_jobs import SCAPI_JOBS_CASCADE
from b2c_tooling_sdk.operations.jobs.run import JobExecution, WaitForJobOptions
from b2c_tooling_sdk.operations.jobs.run_system_job import SystemJobSpec, run_system_job
from b2c_tooling_sdk.operations.util.zip import add_directory_to_zip

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

# Import/export trigger system jobs via the job-execution write surface.
JOBS_RW_SCOPES = list(dict.fromkeys(scope for group in SCAPI_JOBS_CASCADE.write for scope in group))

IMPORT_JOB_ID = "sfcc-site-archive-import"
EXPORT_JOB_ID = "sfcc-site-archive-export"

_ZIP_COMPRESSLEVEL = 9

_OptionsT = TypeVar("_OptionsT")


def _resolve_options(cls: type[_OptionsT], options: _OptionsT | None, overrides: dict[str, Any]) -> _OptionsT:
    """Merge an optional options object with keyword overrides.

    Supports both the options-object call style (``options=SiteArchive...Options(...)``)
    and the keyword-argument style used by other SDK modules
    (``site_archive_import(instance, target, wait_options=...)``).
    """
    if options is None:
        return cls(**overrides)
    if overrides:
        return replace(options, **overrides)  # type: ignore[type-var]
    return options


@dataclass
class SiteArchiveImportOptions:
    """Options for :func:`site_archive_import`."""

    #: Keep archive on instance after import (default: ``False``).
    keep_archive: bool = False
    #: Whether to wait for job completion (default: ``True``).
    wait: bool = True
    #: Wait options for job completion.
    wait_options: WaitForJobOptions | None = None
    #: Optional list of paths or glob patterns to include when importing from a
    #: directory. Each entry may be an absolute path under the root, a path
    #: relative to the root, or a glob pattern (relative to the root). When
    #: omitted, the entire root directory is archived.
    paths: list[str] | None = None
    #: Optional soft size ceiling (in bytes) for the assembled archive.
    max_bytes: int | None = None
    #: Called before upload when the assembled archive exceeds ``max_bytes``.
    #: Receives ``{"bytes": int, "max_bytes": int}``.
    on_oversize: Callable[[dict[str, int]], None] | None = None
    #: Explicit archive name. For directories, controls the top-level directory
    #: name; for buffers, signals the buffer is already correctly structured.
    archive_name: str | None = None


@dataclass
class SiteArchiveImportResult:
    """Result of a site archive import."""

    #: Job execution details.
    execution: JobExecution
    #: Archive filename on instance.
    archive_filename: str
    #: Whether archive was kept on instance.
    archive_kept: bool


@dataclass
class RemoteArchiveTarget:
    """A target that is already present on the instance (in ``Impex/src/instance/``)."""

    remote_filename: str
    archive_name: str | None = None


def _coerce_remote_target(target: Any) -> RemoteArchiveTarget | None:
    """Return a :class:`RemoteArchiveTarget` when ``target`` describes a remote file."""
    if isinstance(target, RemoteArchiveTarget):
        return target
    if isinstance(target, Mapping) and "remote_filename" in target:
        return RemoteArchiveTarget(
            remote_filename=str(target["remote_filename"]),
            archive_name=target.get("archive_name"),
        )
    return None


async def site_archive_import(
    instance: B2CInstance,
    target: str | bytes | Mapping[str, Any] | RemoteArchiveTarget,
    options: SiteArchiveImportOptions | None = None,
    **overrides: Any,
) -> SiteArchiveImportResult:
    """Import a site archive to a B2C Commerce instance.

    Supports importing from a local directory (zipped automatically), a local
    zip file, a ``bytes`` buffer containing zip data, or a filename already on
    the instance (via a :class:`RemoteArchiveTarget` or a mapping with a
    ``remote_filename`` key).

    Options may be passed as a :class:`SiteArchiveImportOptions` object or as
    keyword overrides (e.g. ``wait_options=...``).

    :raises JobExecutionError: if the import job fails.
    """
    opts = _resolve_options(SiteArchiveImportOptions, options, overrides)
    keep_archive = opts.keep_archive
    wait = opts.wait
    archive_name = opts.archive_name
    paths = opts.paths

    remote_target = _coerce_remote_target(target)

    zip_filename: str
    needs_upload = True
    archive_content: bytes | None = None

    if paths and (isinstance(target, bytes) or remote_target is not None):
        raise ValueError("paths option is only supported when target is a directory")

    if remote_target is not None:
        # Remote filename - no upload needed.
        zip_filename = remote_target.remote_filename
        needs_upload = False
    elif isinstance(target, bytes):
        if archive_name:
            # Caller provides name - buffer must already contain the correct
            # top-level directory structure (archive_name/...).
            base_name = archive_name[:-4] if archive_name.endswith(".zip") else archive_name
            zip_filename = f"{base_name}.zip"
            archive_content = target
        else:
            # No name - SDK generates one and wraps the buffer contents under it.
            archive_dir_name = f"import-{_now_millis()}"
            zip_filename = f"{archive_dir_name}.zip"
            archive_content = _wrap_archive_contents(target, archive_dir_name)
    else:
        target_path = str(target)
        if not os.path.exists(target_path):
            raise ValueError(f"Target not found: {target_path}")

        if os.path.isfile(target_path):
            if paths:
                raise ValueError("paths option is only supported when target is a directory")
            with open(target_path, "rb") as handle:
                archive_content = handle.read()
            zip_filename = os.path.basename(target_path)
        elif os.path.isdir(target_path):
            archive_dir_name = archive_name or f"import-{_now_millis()}"
            zip_filename = f"{archive_dir_name}.zip"
            if paths:
                resolved = _resolve_subset_paths(target_path, paths)
                archive_content = _create_archive_from_paths(target_path, resolved, archive_dir_name)
            else:
                archive_content = _create_archive_from_directory(target_path, archive_dir_name)
        else:
            raise ValueError(f"Target must be a file or directory: {target_path}")

    upload_path = f"Impex/src/instance/{zip_filename}"

    # Bubble (do not block, do not warn) when the assembled archive exceeds the
    # configured ceiling so the caller can advise the user.
    if (
        opts.max_bytes is not None
        and opts.on_oversize is not None
        and archive_content is not None
        and len(archive_content) > opts.max_bytes
    ):
        opts.on_oversize({"bytes": len(archive_content), "max_bytes": opts.max_bytes})

    if needs_upload and archive_content is not None:
        await instance.webdav.put(upload_path, archive_content, "application/zip")

    execution: JobExecution = await run_system_job(
        instance,
        SystemJobSpec(
            job_id=IMPORT_JOB_ID,
            ocapi_body={"file_name": zip_filename},
            parameters=[{"name": "ImportFile", "value": zip_filename}],
            deprecated_scopes=JOBS_RW_SCOPES,
            wait=wait,
            wait_options=opts.wait_options,
            fail_verb="execute import job",
        ),
    )

    # Clean up archive if not keeping (only when we waited for completion).
    if wait and not keep_archive and needs_upload:
        await instance.webdav.delete(upload_path)

    return SiteArchiveImportResult(
        execution=execution,
        archive_filename=zip_filename,
        archive_kept=keep_archive if wait else True,
    )


def _resolve_subset_paths(root_dir: str, entries: list[str]) -> list[str]:
    """Resolve a list of user-provided paths/globs against a root directory.

    Each entry is matched in this order: (1) literal path (absolute or
    cwd-relative), (2) resolved against the root directory, (3) glob expansion
    (relative to the root). All resolved paths must live under the root.
    """
    root_abs = os.path.abspath(root_dir)
    matched: list[str] = []
    seen: set[str] = set()

    for entry in entries:
        candidates: list[str] = []

        as_given = os.path.abspath(entry)
        as_root_relative = os.path.abspath(os.path.join(root_abs, entry))
        if os.path.exists(as_given):
            candidates.append(as_given)
        elif as_given != as_root_relative and os.path.exists(as_root_relative):
            candidates.append(as_root_relative)
        elif _has_magic(entry):
            matches = [
                os.path.abspath(os.path.join(root_abs, match))
                for match in globmod.glob(entry, root_dir=root_abs, recursive=True)
            ]
            if not matches:
                raise ValueError(f"No files matched pattern: {entry}")
            candidates.extend(matches)
        else:
            raise ValueError(f"Path not found: {entry}")

        for candidate in candidates:
            rel = os.path.relpath(candidate, root_abs)
            if rel.startswith("..") or os.path.isabs(rel):
                raise ValueError(f"Path is outside import root ({root_abs}): {candidate}")
            if candidate not in seen:
                seen.add(candidate)
                matched.append(candidate)

    return matched


def _create_archive_from_paths(root_dir: str, entries: list[str], archive_dir_name: str) -> bytes:
    """Create a zip archive from a specific set of files/directories under a root.

    Each entry's path inside the archive is its location relative to ``root_dir``,
    preserved under ``archive_dir_name/``.
    """
    root_abs = os.path.abspath(root_dir)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=_ZIP_COMPRESSLEVEL) as archive:
        for entry in entries:
            rel = os.path.relpath(entry, root_abs)
            rel_posix = rel.replace(os.sep, "/")
            arc_prefix = f"{archive_dir_name}/{rel_posix}" if rel_posix and rel_posix != "." else archive_dir_name
            if os.path.isdir(entry):
                add_directory_to_zip(archive, entry, arc_prefix)
            elif os.path.isfile(entry):
                archive.write(entry, arc_prefix)
        _assert_archive_has_files(archive, root_dir)
    return buffer.getvalue()


def _create_archive_from_directory(dir_path: str, archive_dir_name: str) -> bytes:
    """Create a zip archive from a directory, nesting its contents under ``archive_dir_name``."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=_ZIP_COMPRESSLEVEL) as archive:
        add_directory_to_zip(archive, dir_path, archive_dir_name)
        _assert_archive_has_files(archive, dir_path)
    return buffer.getvalue()


def _wrap_archive_contents(buffer: bytes, archive_dir_name: str) -> bytes:
    """Wrap the contents of a zip buffer under a new top-level directory.

    The input buffer should contain archive entries without a root directory
    (e.g. ``libraries/mylib/library.xml``). The output nests all entries under
    ``archive_dir_name/``.
    """
    out = io.BytesIO()
    with (
        zipfile.ZipFile(io.BytesIO(buffer)) as source,
        zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=_ZIP_COMPRESSLEVEL) as archive,
    ):
        for info in source.infolist():
            if info.is_dir():
                continue
            archive.writestr(f"{archive_dir_name}/{info.filename}", source.read(info.filename))
        _assert_archive_has_files(archive, "the supplied archive buffer")
    return out.getvalue()


def _assert_archive_has_files(archive: zipfile.ZipFile, source: str) -> None:
    if not any(not name.endswith("/") for name in archive.namelist()):
        raise ValueError(f"No files found to import under: {source}")


def _now_millis() -> int:
    return int(datetime.now(tz=timezone.utc).timestamp() * 1000)


@dataclass
class _SplitFileEntry:
    """A file discovered under the import root, with on-disk and estimated packed sizes."""

    abs: str
    rel: str
    size: int
    packed_size: int


@dataclass
class SiteArchiveImportSplitOptions:
    """Options for :func:`site_archive_import_split`."""

    #: Maximum size in bytes for each archive part (default: 190 MiB).
    max_bytes: int = 190 * 1024 * 1024
    #: Keep archive parts on the instance after import (default: ``False``).
    keep_archive: bool = False
    #: Wait options applied to each part's import job.
    wait_options: WaitForJobOptions | None = None
    #: Base archive name; parts are suffixed (e.g. ``<name>-xml``, ``<name>-assets-1``).
    archive_name: str | None = None
    #: Called when the overall plan is known, before any upload.
    on_plan: Callable[[SplitImportPlanInfo], None] | None = None
    #: Called before each part begins uploading.
    on_part: Callable[[SplitImportPartInfo], None] | None = None


@dataclass
class SplitImportPlanInfo:
    """Summary of the computed split plan."""

    part_count: int
    xml_part_count: int
    asset_part_count: int
    max_bytes: int


@dataclass
class SplitImportPartInfo:
    """Per-part progress info."""

    index: int
    total: int
    kind: str
    filename: str
    file_count: int
    bytes: int


#: Known-incompressible file extensions - packed/estimated as stored (size ~= on-disk).
INCOMPRESSIBLE_EXTENSIONS = frozenset(
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".avif",
        ".ico",
        ".bmp",
        ".tif",
        ".tiff",
        ".zip",
        ".gz",
        ".tgz",
        ".bz2",
        ".xz",
        ".7z",
        ".rar",
        ".mp4",
        ".m4v",
        ".mov",
        ".avi",
        ".webm",
        ".mkv",
        ".mp3",
        ".m4a",
        ".aac",
        ".ogg",
        ".wav",
        ".flac",
        ".pdf",
        ".woff",
        ".woff2",
        ".jar",
        ".swf",
    }
)

#: Per-entry zip overhead estimate (local + central headers + descriptor), plus 2x name.
ZIP_ENTRY_OVERHEAD = 100

#: Dependency-ordered priority of top-level data-unit directories.
UNIT_PRIORITY: dict[str, int] = {
    "meta": 0,
    "catalogs": 1,
    "pricebooks": 2,
    "price-books": 2,
    "inventory-lists": 3,
    "inventory": 3,
    "libraries": 4,
    "sites": 5,
}

_MAX_SAFE_INTEGER = 2**53 - 1


def _format_bytes(num_bytes: int) -> str:
    """Human-readable byte size (MiB/KiB/B)."""
    if num_bytes >= 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):.1f} MiB"
    if num_bytes >= 1024:
        return f"{num_bytes / 1024:.1f} KiB"
    return f"{num_bytes} B"


def _estimate_compressed_size(abs_path: str, rel: str, size: int) -> int:
    """Estimate the in-archive size of a file: on-disk size for incompressible types
    (stored), or the exact raw-DEFLATE size otherwise, plus a small per-entry overhead."""
    ext = os.path.splitext(abs_path)[1].lower()
    overhead = ZIP_ENTRY_OVERHEAD + len(rel.encode("utf-8")) * 2

    if ext in INCOMPRESSIBLE_EXTENSIONS:
        return size + overhead

    with open(abs_path, "rb") as handle:
        content = handle.read()
    compressor = zlib.compressobj(9, zlib.DEFLATED, -zlib.MAX_WBITS)
    deflated = compressor.compress(content) + compressor.flush()
    return len(deflated) + overhead


def _classify_files(root_dir: str) -> tuple[list[_SplitFileEntry], list[_SplitFileEntry]]:
    """Walk the import root and classify every file into the XML (order-sensitive) or
    asset (deferrable static resource) tier, estimating each file's packed size."""
    root_abs = os.path.abspath(root_dir)
    xml: list[_SplitFileEntry] = []
    assets: list[_SplitFileEntry] = []

    def walk(directory: str) -> None:
        for name in sorted(os.listdir(directory)):
            full = os.path.join(directory, name)
            if os.path.isdir(full):
                walk(full)
            elif os.path.isfile(full):
                size = os.path.getsize(full)
                rel = os.path.relpath(full, root_abs).replace(os.sep, "/")
                packed_size = _estimate_compressed_size(full, rel, size)
                file_entry = _SplitFileEntry(abs=full, rel=rel, size=size, packed_size=packed_size)
                if "static" in rel.split("/"):
                    assets.append(file_entry)
                else:
                    xml.append(file_entry)

    walk(root_abs)
    return xml, assets


def _pack_by_size(entries: list[_SplitFileEntry], budget: int) -> list[list[_SplitFileEntry]]:
    """Bin-pack files into groups whose total packed size stays under ``budget`` using
    first-fit-decreasing. Raises if any single file exceeds the budget on its own."""
    sorted_entries = sorted(entries, key=lambda e: e.packed_size, reverse=True)
    bins: list[dict[str, Any]] = []

    for entry in sorted_entries:
        if entry.packed_size > budget:
            raise ValueError(
                f"File too large to fit in a single archive part: {entry.rel} "
                f"({_format_bytes(entry.packed_size)} compressed exceeds {_format_bytes(budget)} budget). "
                "A single file cannot be split across archives."
            )
        placed = None
        for candidate in bins:
            if candidate["used"] + entry.packed_size <= budget:
                placed = candidate
                break
        if placed is not None:
            placed["entries"].append(entry)
            placed["used"] += entry.packed_size
        else:
            bins.append({"entries": [entry], "used": entry.packed_size})

    return [b["entries"] for b in bins]


def _pack_xml(entries: list[_SplitFileEntry], budget: int) -> list[list[_SplitFileEntry]]:
    """Pack order-sensitive XML files into archive parts. Returns a single part when
    everything fits; otherwise splits at top-level data-unit boundaries in dependency
    order, keeping each unit's files together. Raises if a single unit exceeds the budget."""
    total = sum(e.packed_size for e in entries)
    if total <= budget:
        return [entries]

    groups: dict[str, list[_SplitFileEntry]] = {}
    for entry in entries:
        top = entry.rel.split("/")[0]
        groups.setdefault(top, []).append(entry)

    ordered_keys = sorted(
        groups.keys(),
        key=lambda key: (UNIT_PRIORITY.get(key, _MAX_SAFE_INTEGER), key),
    )

    parts: list[list[_SplitFileEntry]] = []
    current: list[_SplitFileEntry] = []
    current_size = 0

    for key in ordered_keys:
        group = groups[key]
        group_size = sum(e.packed_size for e in group)

        if group_size > budget:
            raise ValueError(
                f'Data unit "{key}" is too large to fit in a single archive part '
                f"({_format_bytes(group_size)} compressed exceeds {_format_bytes(budget)} budget). "
                "Its XML cannot be split without risking broken internal references; "
                "reduce the export scope for this unit or raise --max-size."
            )

        if current_size + group_size > budget and current:
            parts.append(current)
            current = []
            current_size = 0
        current.extend(group)
        current_size += group_size

    if current:
        parts.append(current)

    return parts


async def site_archive_import_split(
    instance: B2CInstance,
    directory: str,
    options: SiteArchiveImportSplitOptions | None = None,
    **overrides: Any,
) -> list[SiteArchiveImportResult]:
    """Import a large site archive by splitting it into multiple size-bounded parts,
    imported sequentially. Order-sensitive XML/metadata is imported first; static
    assets are deferred to subsequent parts.

    :raises ValueError: if a single file or data unit cannot fit under ``max_bytes``.
    :raises JobExecutionError: if any part's import job fails.
    """
    opts = _resolve_options(SiteArchiveImportSplitOptions, options, overrides)
    max_bytes = opts.max_bytes

    if not os.path.exists(directory):
        raise ValueError(f"Target not found: {directory}")
    if not os.path.isdir(directory):
        raise ValueError("site_archive_import_split requires a directory target")

    # Pack with a safety margin below the ceiling; the post-build assertion is the
    # real guard against estimation drift.
    budget = int(max_bytes * 0.95)

    xml, assets = _classify_files(directory)

    xml_parts = _pack_xml(xml, budget) if xml else []
    asset_parts = _pack_by_size(assets, budget) if assets else []

    base_name = opts.archive_name or f"import-{_now_millis()}"

    planned: list[dict[str, Any]] = []
    for i, entries in enumerate(xml_parts):
        suffix = f"-xml-{i + 1}" if len(xml_parts) > 1 else "-xml"
        planned.append({"kind": "xml", "entries": entries, "dir_name": f"{base_name}{suffix}"})
    for i, entries in enumerate(asset_parts):
        planned.append({"kind": "assets", "entries": entries, "dir_name": f"{base_name}-assets-{i + 1}"})

    if not planned:
        raise ValueError(f"No files found to import under: {directory}")

    if opts.on_plan is not None:
        opts.on_plan(
            SplitImportPlanInfo(
                part_count=len(planned),
                xml_part_count=len(xml_parts),
                asset_part_count=len(asset_parts),
                max_bytes=max_bytes,
            )
        )

    results: list[SiteArchiveImportResult] = []
    root_abs = os.path.abspath(directory)

    for i, part in enumerate(planned):
        entries = part["entries"]
        buffer = _create_archive_from_paths(root_abs, [e.abs for e in entries], part["dir_name"])

        if len(buffer) > max_bytes:
            raise ValueError(
                f"Archive part {part['dir_name']} assembled to {_format_bytes(len(buffer))}, "
                f"which exceeds the {_format_bytes(max_bytes)} limit. "
                "This can happen when incompressible data was under-estimated; try a lower --max-size."
            )

        if opts.on_part is not None:
            opts.on_part(
                SplitImportPartInfo(
                    index=i + 1,
                    total=len(planned),
                    kind=part["kind"],
                    filename=f"{part['dir_name']}.zip",
                    file_count=len(entries),
                    bytes=len(buffer),
                )
            )

        result = await site_archive_import(
            instance,
            buffer,
            SiteArchiveImportOptions(
                archive_name=part["dir_name"],
                keep_archive=opts.keep_archive,
                wait=True,
                wait_options=opts.wait_options,
            ),
        )
        results.append(result)

    return results


# --- Export configuration shapes --------------------------------------------
#
# The TS interfaces are flat bags of optional booleans. In Python we accept the
# equivalent ``dict[str, Any]`` payloads directly; these dataclasses document
# the accepted keys and are provided for typed construction convenience.


@dataclass
class ExportSitesConfiguration:
    """Configuration for a single site in an export (all fields optional)."""

    ab_tests: bool | None = None
    active_data_feeds: bool | None = None
    all: bool | None = None
    cache_settings: bool | None = None
    campaigns_and_promotions: bool | None = None
    commerce_feature_states: bool | None = None
    content: bool | None = None
    coupons: bool | None = None
    custom_objects: bool | None = None
    customer_cdn_settings: bool | None = None
    customer_groups: bool | None = None
    distributed_commerce_extensions: bool | None = None
    dynamic_file_resources: bool | None = None
    gift_certificates: bool | None = None
    ocapi_settings: bool | None = None
    payment_methods: bool | None = None
    payment_processors: bool | None = None
    redirect_urls: bool | None = None
    search_settings: bool | None = None
    shipping: bool | None = None
    site_descriptor: bool | None = None
    site_preferences: bool | None = None
    sitemap_settings: bool | None = None
    slots: bool | None = None
    sorting_rules: bool | None = None
    source_codes: bool | None = None
    static_dynamic_alias_mappings: bool | None = None
    stores: bool | None = None
    tax: bool | None = None
    url_rules: bool | None = None


@dataclass
class ExportGlobalDataConfiguration:
    """Configuration for global data in an export (all fields optional)."""

    access_roles: bool | None = None
    all: bool | None = None
    csc_settings: bool | None = None
    csrf_whitelists: bool | None = None
    custom_preference_groups: bool | None = None
    custom_quota_settings: bool | None = None
    custom_types: bool | None = None
    geolocations: bool | None = None
    global_custom_objects: bool | None = None
    job_schedules: bool | None = None
    job_schedules_deprecated: bool | None = None
    locales: bool | None = None
    meta_data: bool | None = None
    oauth_providers: bool | None = None
    ocapi_settings: bool | None = None
    page_meta_tags: bool | None = None
    preferences: bool | None = None
    price_adjustment_limits: bool | None = None
    services: bool | None = None
    sorting_rules: bool | None = None
    static_resources: bool | None = None
    system_type_definitions: bool | None = None
    users: bool | None = None
    webdav_client_permissions: bool | None = None


@dataclass
class ExportDataUnitsConfiguration:
    """Data units configuration for an export (all fields optional)."""

    catalog_static_resources: dict[str, bool] | None = None
    catalogs: dict[str, bool] | None = None
    customer_lists: dict[str, bool] | None = None
    inventory_lists: dict[str, bool] | None = None
    library_static_resources: dict[str, bool] | None = None
    libraries: dict[str, bool] | None = None
    price_books: dict[str, bool] | None = None
    sites: dict[str, Any] | None = None
    global_data: dict[str, Any] | None = None


@dataclass
class SiteArchiveExportOptions:
    """Options for site archive export."""

    #: Wait options for job completion.
    wait_options: WaitForJobOptions | None = None
    #: Keep archive on instance after download (used by download variants).
    keep_archive: bool = False
    #: Extract the downloaded zip when saving to a directory (used by the path variant).
    extract_zip: bool = True


@dataclass
class SiteArchiveExportResult:
    """Result of a site archive export."""

    #: Job execution details.
    execution: JobExecution
    #: Archive filename on instance.
    archive_filename: str


@dataclass
class SiteArchiveExportToBufferResult:
    """Result of an export downloaded into memory."""

    execution: JobExecution
    archive_filename: str
    #: The downloaded archive bytes.
    data: bytes
    archive_kept: bool


@dataclass
class SiteArchiveExportToPathResult:
    """Result of an export downloaded and saved to a local path."""

    execution: JobExecution
    archive_filename: str
    #: Local path where the archive (or its extracted contents) was written.
    local_path: str
    archive_kept: bool


def _coerce_data_units(data_units: Mapping[str, Any] | ExportDataUnitsConfiguration) -> dict[str, Any]:
    """Return a plain ``dict`` payload from either a mapping or a config dataclass."""
    if isinstance(data_units, ExportDataUnitsConfiguration):
        return {key: value for key, value in vars(data_units).items() if value is not None}
    return dict(data_units)


async def site_archive_export(
    instance: B2CInstance,
    data_units: Mapping[str, Any] | ExportDataUnitsConfiguration,
    options: SiteArchiveExportOptions | None = None,
    **overrides: Any,
) -> SiteArchiveExportResult:
    """Export a site archive from a B2C Commerce instance.

    :raises JobExecutionError: if the export job fails.
    """
    opts = _resolve_options(SiteArchiveExportOptions, options, overrides)
    payload = _coerce_data_units(data_units)

    # Generate archive filename (strip ``:``, ``.``, ``-`` from the ISO timestamp).
    timestamp = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S%f")[:-3] + "Z"
    archive_dir_name = f"{timestamp}_export"
    zip_filename = f"{archive_dir_name}.zip"

    execution: JobExecution = await run_system_job(
        instance,
        SystemJobSpec(
            job_id=EXPORT_JOB_ID,
            ocapi_body={"export_file": zip_filename, "data_units": payload},
            parameters=[
                {"name": "ExportFile", "value": zip_filename},
                {"name": "DataUnits", "value": json.dumps(payload, separators=(",", ":"))},
            ],
            deprecated_scopes=JOBS_RW_SCOPES,
            wait_options=opts.wait_options,
            fail_verb="execute export job",
        ),
    )

    return SiteArchiveExportResult(execution=execution, archive_filename=zip_filename)


async def site_archive_export_to_buffer(
    instance: B2CInstance,
    data_units: Mapping[str, Any] | ExportDataUnitsConfiguration,
    options: SiteArchiveExportOptions | None = None,
    **overrides: Any,
) -> SiteArchiveExportToBufferResult:
    """Export a site archive and download it into memory (``.data`` bytes)."""
    opts = _resolve_options(SiteArchiveExportOptions, options, overrides)
    keep_archive = opts.keep_archive

    result = await site_archive_export(instance, data_units, opts)

    webdav_path = f"Impex/src/instance/{result.archive_filename}"
    data = await instance.webdav.get(webdav_path)

    if not keep_archive:
        await instance.webdav.delete(webdav_path)

    return SiteArchiveExportToBufferResult(
        execution=result.execution,
        archive_filename=result.archive_filename,
        data=data,
        archive_kept=keep_archive,
    )


async def site_archive_export_to_path(
    instance: B2CInstance,
    data_units: Mapping[str, Any] | ExportDataUnitsConfiguration,
    output_path: str,
    options: SiteArchiveExportOptions | None = None,
    **overrides: Any,
) -> SiteArchiveExportToPathResult:
    """Export a site archive, download it, and save it to a local path.

    When ``output_path`` ends in ``.zip`` (or ``extract_zip`` is ``False``) the
    archive is written as a zip file; otherwise it is extracted into the
    directory at ``output_path``.
    """
    opts = _resolve_options(SiteArchiveExportOptions, options, overrides)
    extract_zip = opts.extract_zip

    result = await site_archive_export_to_buffer(instance, data_units, opts)

    is_zip_path = output_path.endswith(".zip")

    if is_zip_path or not extract_zip:
        zip_path = output_path if is_zip_path else os.path.join(output_path, result.archive_filename)
        os.makedirs(os.path.dirname(zip_path) or ".", exist_ok=True)
        with open(zip_path, "wb") as handle:
            handle.write(result.data)
        local_path = zip_path
    else:
        os.makedirs(output_path, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(result.data)) as archive:
            for info in archive.infolist():
                full_path = os.path.join(output_path, info.filename)
                if info.is_dir():
                    os.makedirs(full_path, exist_ok=True)
                else:
                    os.makedirs(os.path.dirname(full_path) or ".", exist_ok=True)
                    with open(full_path, "wb") as handle:
                        handle.write(archive.read(info.filename))
        local_path = output_path

    return SiteArchiveExportToPathResult(
        execution=result.execution,
        archive_filename=result.archive_filename,
        local_path=local_path,
        archive_kept=result.archive_kept,
    )


def _has_magic(pattern: str) -> bool:
    """Return ``True`` if ``pattern`` contains glob magic characters (``* ? [ ] { }``)."""
    return any(char in pattern for char in "*?[]{}")


__all__ = [
    "EXPORT_JOB_ID",
    "IMPORT_JOB_ID",
    "INCOMPRESSIBLE_EXTENSIONS",
    "JOBS_RW_SCOPES",
    "UNIT_PRIORITY",
    "ZIP_ENTRY_OVERHEAD",
    "ExportDataUnitsConfiguration",
    "ExportGlobalDataConfiguration",
    "ExportSitesConfiguration",
    "RemoteArchiveTarget",
    "SiteArchiveExportOptions",
    "SiteArchiveExportResult",
    "SiteArchiveExportToBufferResult",
    "SiteArchiveExportToPathResult",
    "SiteArchiveImportOptions",
    "SiteArchiveImportResult",
    "SiteArchiveImportSplitOptions",
    "SplitImportPartInfo",
    "SplitImportPlanInfo",
    "site_archive_export",
    "site_archive_export_to_buffer",
    "site_archive_export_to_path",
    "site_archive_import",
    "site_archive_import_split",
]
