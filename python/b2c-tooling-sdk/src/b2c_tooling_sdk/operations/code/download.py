# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Cartridge download (server-side ZIP + WebDAV GET) operations.

Mirrors ``src/operations/code/download.ts``.
"""

from __future__ import annotations

import asyncio
import contextlib
import io
import os
import time
import zipfile
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Literal
from urllib.parse import urlencode

from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.code.constants import LONG_OPERATION_TIMEOUT_SECONDS
from b2c_tooling_sdk.operations.code.ocapi_scripts_backend import OcapiScriptsBackend

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance
    from b2c_tooling_sdk.operations.code.scripts_types import ScriptsBackend

_ZIP_BODY = urlencode({"method": "ZIP"})
_ZIP_HEADERS = {"Content-Type": "application/x-www-form-urlencoded"}
_PROGRESS_INTERVAL_SECONDS = 5.0

DownloadPhase = Literal["zipping", "downloading", "cleanup", "extracting"]


@dataclass
class DownloadProgressInfo:
    """Progress info passed to the download ``on_progress`` callback."""

    #: Current operation phase.
    phase: DownloadPhase
    #: Seconds elapsed since the current phase started.
    elapsed_seconds: int


@dataclass
class DownloadOptions:
    """Options for downloading cartridges."""

    #: Explicit code-version backend. Defaults to OCAPI for SDK compatibility.
    scripts_backend: ScriptsBackend | None = None
    #: Cartridge names to include (if empty/``None``, all are included).
    include: list[str] = field(default_factory=list)
    #: Cartridge names to exclude.
    exclude: list[str] = field(default_factory=list)
    #: When provided, maps cartridge names to local paths for mirror extraction.
    mirror: dict[str, str] | None = None
    #: Callback for progress updates. Called when a phase starts
    #: (``elapsed_seconds=0``) and periodically thereafter.
    on_progress: Callable[[DownloadProgressInfo], None] | None = None


@dataclass
class DownloadResult:
    """Result of a cartridge download."""

    #: Cartridge names that were extracted.
    cartridges: list[str]
    #: Code version downloaded from.
    code_version: str
    #: Output directory where cartridges were extracted (empty string if mirror-only).
    output_directory: str


async def _noop_stop() -> None:
    return None


def _start_progress(
    on_progress: Callable[[DownloadProgressInfo], None] | None, phase: DownloadPhase
) -> Callable[[], Awaitable[None]]:
    """Fire ``on_progress`` immediately, then every 5s until the returned stop function is awaited."""
    if on_progress is None:
        return _noop_stop

    on_progress(DownloadProgressInfo(phase=phase, elapsed_seconds=0))
    start = time.monotonic()

    async def _tick() -> None:
        while True:
            await asyncio.sleep(_PROGRESS_INTERVAL_SECONDS)
            on_progress(DownloadProgressInfo(phase=phase, elapsed_seconds=round(time.monotonic() - start)))

    task = asyncio.ensure_future(_tick())

    async def _stop() -> None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    return _stop


def _extract_zip(
    zip_file: zipfile.ZipFile,
    *,
    strip_prefix: int,
    output_directory: str,
    cartridge_name: str | None = None,
    mirror: dict[str, str] | None = None,
    include: list[str] | None = None,
    exclude: list[str] | None = None,
) -> set[str]:
    """Extract files from a ZIP archive to disk.

    :param strip_prefix: Number of path segments to strip from ZIP entry paths
        (e.g. 1 to remove the code version, before the cartridge-name segment).
    :param cartridge_name: When set, used as the cartridge name for every entry
        instead of reading the next path segment (single-cartridge archives).
    :returns: Set of extracted cartridge names.
    """
    extracted_cartridges: set[str] = set()

    for entry in zip_file.infolist():
        if entry.is_dir():
            continue

        parts = entry.filename.split("/")
        if len(parts) < strip_prefix + 1:
            continue

        parts = parts[strip_prefix:]

        entry_cartridge_name = cartridge_name if cartridge_name is not None else parts.pop(0)
        relative_path = "/".join(parts)

        if include and entry_cartridge_name not in include:
            continue
        if exclude and entry_cartridge_name in exclude:
            continue

        if mirror and entry_cartridge_name in mirror:
            target_path = os.path.join(mirror[entry_cartridge_name], relative_path)
        else:
            target_path = os.path.join(output_directory, entry_cartridge_name, relative_path)

        # Preserve existing file permissions.
        existing_mode: int | None = None
        with contextlib.suppress(OSError):
            existing_mode = os.stat(target_path).st_mode

        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, "wb") as fh:
            fh.write(zip_file.read(entry))

        if existing_mode is not None:
            os.chmod(target_path, existing_mode)

        extracted_cartridges.add(entry_cartridge_name)

    return extracted_cartridges


async def _resolve_code_version(instance: B2CInstance, scripts_backend: ScriptsBackend) -> str:
    """Resolve the code version from instance config or the selected backend."""
    logger = get_logger("operations.code")
    code_version = instance.config.code_version

    if not code_version:
        logger.debug("No code version configured, attempting to discover active version...")
        try:
            active_version = await scripts_backend.get_active_code_version()
            if active_version and active_version.id:
                code_version = active_version.id
                instance.config.code_version = code_version
        except Exception as error:  # noqa: BLE001 - auto-discovery is best-effort
            logger.debug("Failed to discover active code version: %s", error)

        if not code_version:
            raise RuntimeError(
                "Code version required for download. Configure --code-version or ensure OAuth "
                "credentials are available for auto-discovery."
            )

    return code_version


async def download_single_cartridge(
    instance: B2CInstance,
    code_version: str,
    cartridge_name: str,
    output_path: str,
    on_progress: Callable[[DownloadProgressInfo], None] | None = None,
) -> None:
    """Download a single cartridge from an instance via WebDAV.

    More efficient than downloading the entire code version when only one
    cartridge is needed, since it ZIPs only the cartridge subdirectory
    server-side.
    """
    logger = get_logger("operations.code")
    webdav = instance.webdav
    cartridge_path = f"Cartridges/{code_version}/{cartridge_name}"
    zip_path = f"{cartridge_path}.zip"

    stop_progress = _start_progress(on_progress, "zipping")
    logger.debug("Requesting server-side zip for cartridge %s (code version %s)...", cartridge_name, code_version)
    try:
        zip_response = await asyncio.wait_for(
            webdav.request(cartridge_path, method="POST", content=_ZIP_BODY, headers=_ZIP_HEADERS),
            timeout=LONG_OPERATION_TIMEOUT_SECONDS,
        )
    finally:
        await stop_progress()

    if not zip_response.is_success:
        text = zip_response.text
        raise RuntimeError(
            f"Failed to create server-side zip: {zip_response.status_code} {zip_response.reason_phrase} - {text}"
        )

    stop_progress = _start_progress(on_progress, "downloading")
    try:
        dl_response = await asyncio.wait_for(
            webdav.request(zip_path, method="GET"), timeout=LONG_OPERATION_TIMEOUT_SECONDS
        )
        if not dl_response.is_success:
            raise RuntimeError(f"Failed to download zip: {dl_response.status_code} {dl_response.reason_phrase}")
        archive_bytes = dl_response.content
    finally:
        await stop_progress()
    logger.debug("Archive downloaded: %d bytes", len(archive_bytes))

    # Cleanup server-side zip (best effort).
    if on_progress:
        on_progress(DownloadProgressInfo(phase="cleanup", elapsed_seconds=0))
    try:
        await webdav.delete(zip_path)
    except Exception as error:  # noqa: BLE001 - cleanup is best-effort
        logger.warning("Failed to clean up server-side zip %s (non-fatal): %s", zip_path, error)

    # Extract.
    if on_progress:
        on_progress(DownloadProgressInfo(phase="extracting", elapsed_seconds=0))
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zip_file:
        # Single cartridge ZIP contains: cartridgeName/relative/path...
        _extract_zip(
            zip_file,
            strip_prefix=1,
            output_directory=os.path.dirname(output_path),
            cartridge_name=cartridge_name,
        )

    logger.debug("Downloaded cartridge %s (code version %s)", cartridge_name, code_version)


_ZIP_HEADERS = {"Content-Type": "application/x-www-form-urlencoded"}


async def download_cartridges(
    instance: B2CInstance, output_directory: str, options: DownloadOptions | None = None
) -> DownloadResult:
    """Download cartridges from an instance via WebDAV.

    When ``include`` specifies cartridges, each is downloaded individually
    using per-cartridge server-side zipping for efficiency. When downloading
    all cartridges (no include filter), the entire code version is zipped at
    once.

    If ``instance.config.code_version`` is not set, attempts to discover the
    active code version via the scripts backend. If that also fails, raises.
    """
    logger = get_logger("operations.code")
    opts = options or DownloadOptions()
    scripts_backend = opts.scripts_backend or OcapiScriptsBackend(instance)
    code_version = await _resolve_code_version(instance, scripts_backend)
    resolved_output = os.path.abspath(output_directory)

    # When specific cartridges are requested, download each individually.
    if opts.include:
        all_extracted: set[str] = set()

        for cartridge_name in opts.include:
            if opts.exclude and cartridge_name in opts.exclude:
                continue

            output_path = (
                opts.mirror[cartridge_name]
                if opts.mirror and cartridge_name in opts.mirror
                else os.path.join(resolved_output, cartridge_name)
            )

            await download_single_cartridge(instance, code_version, cartridge_name, output_path, opts.on_progress)
            all_extracted.add(cartridge_name)

        return DownloadResult(
            cartridges=sorted(all_extracted), code_version=code_version, output_directory=resolved_output
        )

    # Full code version download.
    webdav = instance.webdav
    zip_path = f"Cartridges/{code_version}.zip"

    stop_progress = _start_progress(opts.on_progress, "zipping")
    logger.debug("Requesting server-side zip for code version %s...", code_version)
    try:
        zip_response = await asyncio.wait_for(
            webdav.request(f"Cartridges/{code_version}", method="POST", content=_ZIP_BODY, headers=_ZIP_HEADERS),
            timeout=LONG_OPERATION_TIMEOUT_SECONDS,
        )
    finally:
        await stop_progress()

    if not zip_response.is_success:
        text = zip_response.text
        raise RuntimeError(
            f"Failed to create server-side zip: {zip_response.status_code} {zip_response.reason_phrase} - {text}"
        )
    logger.debug("Server-side zip created")

    stop_progress = _start_progress(opts.on_progress, "downloading")
    logger.debug("Downloading zip archive %s...", zip_path)
    try:
        download_response = await asyncio.wait_for(
            webdav.request(zip_path, method="GET"), timeout=LONG_OPERATION_TIMEOUT_SECONDS
        )
        if not download_response.is_success:
            raise RuntimeError(
                f"Failed to download zip: {download_response.status_code} {download_response.reason_phrase}"
            )
        archive_bytes = download_response.content
    finally:
        await stop_progress()
    logger.debug("Archive downloaded: %d bytes", len(archive_bytes))

    # Cleanup server-side zip (best-effort).
    if opts.on_progress:
        opts.on_progress(DownloadProgressInfo(phase="cleanup", elapsed_seconds=0))
    try:
        await webdav.delete(zip_path)
        logger.debug("Server-side zip cleaned up")
    except Exception as error:  # noqa: BLE001 - cleanup is best-effort
        logger.warning("Failed to clean up server-side zip %s (non-fatal): %s", zip_path, error)

    # Extract.
    if opts.on_progress:
        opts.on_progress(DownloadProgressInfo(phase="extracting", elapsed_seconds=0))
    logger.debug("Extracting archive...")
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zip_file:
        # Full code version ZIP: {codeVersion}/{cartridgeName}/{relativePath...}
        extracted_cartridges = _extract_zip(
            zip_file,
            strip_prefix=1,
            output_directory=resolved_output,
            mirror=opts.mirror,
            exclude=opts.exclude,
        )

    cartridge_list = sorted(extracted_cartridges)
    logger.debug(
        "Downloaded %d cartridge(s) from %s (code version %s)",
        len(cartridge_list),
        instance.config.hostname,
        code_version,
    )

    return DownloadResult(cartridges=cartridge_list, code_version=code_version, output_directory=resolved_output)


__all__ = [
    "DownloadOptions",
    "DownloadProgressInfo",
    "DownloadResult",
    "download_cartridges",
    "download_single_cartridge",
]
