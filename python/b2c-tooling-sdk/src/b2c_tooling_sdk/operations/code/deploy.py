# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Cartridge deployment (upload/delete) via WebDAV.

Mirrors ``src/operations/code/deploy.ts``.
"""

from __future__ import annotations

import asyncio
import contextlib
import io
import time
import zipfile
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal
from urllib.parse import urlencode

from b2c_tooling_sdk.errors import NetworkError, NetworkErrorKind, describe_network_error_kind
from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.code.cartridges import CartridgeMapping, FindCartridgesOptions, find_cartridges
from b2c_tooling_sdk.operations.code.constants import UNZIP_TIMEOUT_SECONDS
from b2c_tooling_sdk.operations.code.ocapi_scripts_backend import OcapiScriptsBackend
from b2c_tooling_sdk.operations.code.scripts_backend import reload_code_version
from b2c_tooling_sdk.operations.util.zip import add_directory_to_zip

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance
    from b2c_tooling_sdk.operations.code.scripts_types import ScriptsBackend

_UNZIP_BODY = urlencode({"method": "UNZIP"})
_PROGRESS_INTERVAL_SECONDS = 5.0

UploadPhase = Literal["archiving", "uploading", "unzipping", "cleanup"]


@dataclass
class UploadProgressInfo:
    """Progress info passed to the upload ``on_progress`` callback."""

    #: Current operation phase.
    phase: UploadPhase
    #: Seconds elapsed since the current phase started.
    elapsed_seconds: int


@dataclass
class UploadOptions:
    """Options for upload progress reporting."""

    #: Callback for progress updates. Called when a phase starts
    #: (``elapsed_seconds=0``) and periodically thereafter.
    on_progress: Callable[[UploadProgressInfo], None] | None = None


@dataclass
class DeployOptions(FindCartridgesOptions):
    """Options for deploying cartridges."""

    #: Explicit code-version backend. Defaults to OCAPI for SDK compatibility.
    scripts_backend: ScriptsBackend | None = None
    #: Activate the code version after deploy.
    activate: bool = False
    #: Reload (toggle activation to force reload) the code version after deploy.
    reload: bool = False
    #: Delete existing cartridges before uploading.
    delete: bool = False
    #: Callback for progress updates during long-running operations.
    on_progress: Callable[[UploadProgressInfo], None] | None = None


@dataclass
class DeployResult:
    """Result of a cartridge deployment."""

    #: Cartridges that were deployed.
    cartridges: list[CartridgeMapping]
    #: Code version deployed to.
    code_version: str
    #: Whether the code version was activated after deploy.
    activated: bool
    #: Whether the code version was reloaded after deploy.
    reloaded: bool


def _start_progress(
    on_progress: Callable[[UploadProgressInfo], None] | None, phase: UploadPhase
) -> Callable[[], Awaitable[None]]:
    """Fire ``on_progress`` immediately, then every 5s until the returned stop function is awaited."""
    if on_progress is None:
        return _noop_stop

    on_progress(UploadProgressInfo(phase=phase, elapsed_seconds=0))
    start = time.monotonic()

    async def _tick() -> None:
        while True:
            await asyncio.sleep(_PROGRESS_INTERVAL_SECONDS)
            on_progress(UploadProgressInfo(phase=phase, elapsed_seconds=round(time.monotonic() - start)))

    task = asyncio.ensure_future(_tick())

    async def _stop() -> None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    return _stop


async def _noop_stop() -> None:
    return None


async def delete_cartridges(instance: B2CInstance, cartridges: list[CartridgeMapping]) -> None:
    """Delete cartridges from an instance via WebDAV.

    Low-level function that deletes cartridge directories from the specified
    code version. Errors are silently ignored for cartridges that don't exist.

    Requires ``instance.config.code_version`` to be set.

    :raises RuntimeError: if the instance has no code version configured.
    """
    logger = get_logger("operations.code")
    code_version = instance.config.code_version

    if not code_version:
        raise RuntimeError("Code version required for cartridge deletion")

    if not cartridges:
        return

    webdav = instance.webdav

    logger.debug("Deleting %d cartridge(s)...", len(cartridges))
    for c in cartridges:
        cartridge_path = f"Cartridges/{code_version}/{c.dest}"
        try:
            await webdav.delete(cartridge_path)
            logger.debug("Deleted %s", cartridge_path)
        except Exception:  # noqa: BLE001 - cartridge may not exist; deletion is best-effort
            logger.debug("Could not delete %s (may not exist)", cartridge_path)


async def upload_cartridges(
    instance: B2CInstance, cartridges: list[CartridgeMapping], options: UploadOptions | None = None
) -> None:
    """Upload cartridges to an instance via WebDAV.

    Low-level upload function that:

    1. Creates a zip archive of the cartridges.
    2. Uploads it to WebDAV.
    3. Unzips on the server.
    4. Cleans up the temporary zip file.

    Requires ``instance.config.code_version`` to be set.

    :raises RuntimeError: if code version is not set or no cartridges are given.
    """
    logger = get_logger("operations.code")
    code_version = instance.config.code_version

    if not code_version:
        raise RuntimeError("Code version required for cartridge upload")

    if not cartridges:
        raise RuntimeError("No cartridges to upload")

    webdav = instance.webdav
    now_ms = round(time.time() * 1000)
    upload_path = f"Cartridges/_sync-{now_ms}.zip"
    on_progress = options.on_progress if options else None

    # Create zip archive.
    if on_progress:
        on_progress(UploadProgressInfo(phase="archiving", elapsed_seconds=0))
    logger.debug("Creating cartridge archive...")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zip_file:
        for c in cartridges:
            add_directory_to_zip(zip_file, c.src, f"{code_version}/{c.dest}")
    archive_bytes = buffer.getvalue()
    logger.debug("Archive created: %d bytes", len(archive_bytes))

    # Upload archive.
    stop_progress = _start_progress(on_progress, "uploading")
    logger.debug("Uploading archive to %s...", upload_path)
    try:
        await webdav.put(upload_path, archive_bytes, "application/zip")
    finally:
        await stop_progress()
    logger.debug("Archive uploaded")

    # Unzip on server. Single attempt — deliberately NOT retried on a dropped
    # connection.
    #
    # The unzip is a synchronous WebDAV POST with no server-side job handle, so
    # a dropped connection is only a client-side observation: it tells us our
    # socket died, not whether the backend is still extracting the archive.
    # Re-issuing UNZIP could start a SECOND extraction concurrently with one
    # still in progress, racing writes into the same Cartridges/<version>/
    # directory and corrupting the code version. So on a drop we surface a
    # clear, actionable error that warns the extraction may still be running,
    # and we leave the uploaded archive in place so the user can verify and
    # decide — we never silently re-run.
    stop_progress = _start_progress(on_progress, "unzipping")
    logger.debug("Unzipping archive on server...")
    try:
        response = await asyncio.wait_for(
            webdav.request(
                upload_path,
                method="POST",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                content=_UNZIP_BODY,
            ),
            timeout=UNZIP_TIMEOUT_SECONDS,
        )
        await stop_progress()
    except Exception as error:
        await stop_progress()
        # Enrich network failures (including a client-side timeout, which is not
        # itself a NetworkError) with deploy-specific context and an explicit
        # warning that the server-side extraction may still be in progress.
        kind: NetworkErrorKind | None = None
        cause: BaseException | None = None
        if isinstance(error, NetworkError):
            kind = error.kind
            cause = error.__cause__
        elif isinstance(error, TimeoutError):
            kind = "timeout"
            cause = error

        if kind is not None:
            summary, hint = describe_network_error_kind(kind)
            raise NetworkError(
                f"Server-side unzip of cartridge archive failed: {summary}. {hint} "
                "Note: the connection dropped, but the server may still be extracting the archive — "
                f'do not assume the deploy failed. The uploaded archive remains at "{upload_path}". '
                "Wait for any in-progress extraction to finish and verify the code version before re-deploying.",
                kind=kind,
                operation="server-side unzip of cartridge archive",
                host=instance.config.hostname,
                cause=cause,
            ) from error
        raise

    # Check response status (non-throwing error from server).
    if not response.is_success:
        text = response.text
        raise RuntimeError(f"Failed to unzip archive: {response.status_code} {response.reason_phrase} - {text}")
    logger.debug("Archive unzipped")

    # Delete temporary archive (best-effort cleanup).
    if on_progress:
        on_progress(UploadProgressInfo(phase="cleanup", elapsed_seconds=0))
    try:
        await webdav.delete(upload_path)
        logger.debug("Temporary archive deleted")
    except Exception as error:  # noqa: BLE001 - cleanup is best-effort; deploy already succeeded
        logger.warning("Failed to clean up temporary archive %s (non-fatal): %s", upload_path, error)

    logger.debug(
        "Uploaded %d cartridges to %s (code version %s)",
        len(cartridges),
        instance.config.hostname,
        code_version,
    )


async def find_and_deploy_cartridges(
    instance: B2CInstance, directory: str, options: DeployOptions | None = None
) -> DeployResult:
    """Find and deploy cartridges from a directory to an instance.

    High-level function that orchestrates the deployment process:

    1. Finds cartridges in the specified directory (by ``.project`` files).
    2. Applies include/exclude filters.
    3. Optionally deletes existing cartridges first.
    4. Creates a zip archive and uploads via WebDAV.
    5. Optionally activates or reloads the code version.

    Requires ``instance.config.code_version`` to be set.

    :raises RuntimeError: if code version is not set, no cartridges are found,
        or deployment fails.
    """
    logger = get_logger("operations.code")
    opts = options or DeployOptions()
    code_version = instance.config.code_version
    scripts_backend: ScriptsBackend = opts.scripts_backend or OcapiScriptsBackend(instance)

    if not code_version:
        raise RuntimeError("Code version required for deployment")

    logger.debug("Finding cartridges in %s...", directory)
    cartridges = find_cartridges(directory, FindCartridgesOptions(include=opts.include, exclude=opts.exclude))

    if not cartridges:
        raise RuntimeError(f"No cartridges found in {directory}")

    logger.debug("Found %d cartridge(s)", len(cartridges))
    for c in cartridges:
        logger.debug("  %s (%s)", c.name, c.src)

    # Optionally delete existing cartridges first.
    if opts.delete:
        await delete_cartridges(instance, cartridges)

    # Upload cartridges.
    await upload_cartridges(instance, cartridges, UploadOptions(on_progress=opts.on_progress))

    # Optionally activate or reload.
    activated = False
    reloaded = False
    if opts.activate:
        logger.debug("Activating code version...")
        await scripts_backend.activate_code_version(code_version)
        activated = True
    elif opts.reload:
        logger.debug("Reloading code version...")
        await reload_code_version(scripts_backend, code_version)
        activated = True
        reloaded = True

    return DeployResult(cartridges=cartridges, code_version=code_version, activated=activated, reloaded=reloaded)


__all__ = [
    "DeployOptions",
    "DeployResult",
    "UploadOptions",
    "UploadProgressInfo",
    "delete_cartridges",
    "find_and_deploy_cartridges",
    "upload_cartridges",
]
