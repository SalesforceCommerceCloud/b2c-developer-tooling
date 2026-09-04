# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Watch cartridge directories and sync changes to an instance.

Mirrors ``src/operations/code/watch.ts``.

**Deviation from the TypeScript SDK**: the TS version uses ``chokidar`` for
native OS-level filesystem watching. Adding a native/OS-watch dependency to
this port was out of scope, so this module instead polls each cartridge
directory on an interval, comparing file mtimes between snapshots to detect
adds/changes (upload) and removals (delete). :attr:`WatchOptions.poll_interval_seconds`
(not present in the TS API) controls that interval and defaults to 1 second;
tests inject a tiny value so polling is effectively instant. Everything
downstream of change-detection (debouncing, batching, rate-limited retry on
upload failure, serialized processing) mirrors the TS implementation exactly.
"""

from __future__ import annotations

import asyncio
import contextlib
import os
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING

from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.code.cartridges import CartridgeMapping, FindCartridgesOptions, find_cartridges
from b2c_tooling_sdk.operations.code.ocapi_scripts_backend import OcapiScriptsBackend
from b2c_tooling_sdk.operations.code.upload_files import UploadFilesOptions, file_to_cartridge_path, upload_files

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance
    from b2c_tooling_sdk.operations.code.scripts_types import ScriptsBackend

#: Default debounce time in ms for batching file uploads.
_DEFAULT_DEBOUNCE_MS = int(os.environ.get("SFCC_UPLOAD_DEBOUNCE_TIME", "100"))

#: Default filesystem poll interval, in seconds (see module docstring).
_DEFAULT_POLL_INTERVAL_SECONDS = 1.0

#: How long to back off after an upload/delete batch fails before retrying.
_ERROR_RATE_LIMIT_SECONDS = 5.0


@dataclass
class WatchOptions(FindCartridgesOptions):
    """Options for watching cartridges."""

    #: Explicit code-version backend. Defaults to OCAPI for SDK compatibility.
    scripts_backend: ScriptsBackend | None = None
    #: Debounce time in ms for batching file changes.
    debounce_time_ms: int = _DEFAULT_DEBOUNCE_MS
    #: Callback when files are uploaded.
    on_upload: Callable[[list[str]], None] | None = None
    #: Callback when files are deleted.
    on_delete: Callable[[list[str]], None] | None = None
    #: Callback on error.
    on_error: Callable[[Exception], None] | None = None
    #: Filesystem poll interval, in seconds. Python-only (see module docstring).
    poll_interval_seconds: float = _DEFAULT_POLL_INTERVAL_SECONDS


@dataclass
class WatchResult:
    """Result of starting a watcher."""

    #: Cartridges being watched.
    cartridges: list[CartridgeMapping]
    #: Code version being deployed to.
    code_version: str
    #: Stop watching. Cancels the poll loop and lets any in-flight (already
    #: debounced/scheduled) upload batch finish before returning.
    stop: Callable[[], Awaitable[None]]


def _snapshot(cartridges: list[CartridgeMapping]) -> dict[str, float]:
    """Collect ``{absolute_path: mtime}`` for every file under the watched cartridges."""
    mtimes: dict[str, float] = {}
    for cartridge in cartridges:
        for root, _dirnames, filenames in os.walk(cartridge.src):
            for name in filenames:
                full_path = os.path.join(root, name)
                try:
                    mtimes[full_path] = os.stat(full_path).st_mtime
                except OSError:
                    # Removed between listing and stat; treat as absent.
                    continue
    return mtimes


async def watch_cartridges(instance: B2CInstance, directory: str, options: WatchOptions | None = None) -> WatchResult:
    """Watch cartridge directories and sync changes to an instance.

    1. Finds cartridges in the specified directory.
    2. Polls those directories for changes (see module docstring for why
       polling rather than native OS watching is used).
    3. Batches file changes (debounced) and uploads them via WebDAV.
    4. Handles file deletions.

    :raises RuntimeError: if no code version is configured and none is
        active, or if no cartridges are found in ``directory``.
    """
    logger = get_logger("operations.code")
    opts = options or WatchOptions()
    code_version = instance.config.code_version
    scripts_backend = opts.scripts_backend or OcapiScriptsBackend(instance)

    # If no code version specified, get the active one.
    if not code_version:
        logger.debug("No code version specified, getting active version...")
        active = await scripts_backend.get_active_code_version()
        if not active or not active.id:
            raise RuntimeError("No code version specified and no active code version found")
        code_version = active.id
        instance.config.code_version = code_version

    logger.debug("Finding cartridges to watch in %s...", directory)
    cartridges = find_cartridges(directory, FindCartridgesOptions(include=opts.include, exclude=opts.exclude))

    if not cartridges:
        raise RuntimeError(f"No cartridges found in {directory}")

    logger.debug("Watching %d cartridge(s)", len(cartridges))
    for c in cartridges:
        logger.info("  %s (%s)", c.name, c.src)

    # Sets for batching file changes.
    files_to_upload: set[str] = set()
    files_to_delete: set[str] = set()
    state = {"last_error_time": 0.0, "is_processing": False}
    debounce_handle: asyncio.TimerHandle | None = None
    processing_task: asyncio.Task[None] | None = None

    async def run_processing() -> None:
        """Process all pending file changes, serializing WebDAV operations.

        Only one instance runs at a time — if new changes accumulate during
        processing, the while loop picks them up in the next iteration.
        """
        if state["is_processing"]:
            return
        state["is_processing"] = True

        try:
            while files_to_upload or files_to_delete:
                # Rate limit on errors — wait instead of dropping items.
                time_since_error = time.monotonic() - state["last_error_time"]
                if state["last_error_time"] and time_since_error < _ERROR_RATE_LIMIT_SECONDS:
                    wait_time = _ERROR_RATE_LIMIT_SECONDS - time_since_error
                    logger.debug("Rate limiting after recent error, waiting %.1fs...", wait_time)
                    await asyncio.sleep(wait_time)

                upload_changes = [
                    fc for fc in (file_to_cartridge_path(f, cartridges) for f in files_to_upload) if fc is not None
                ]
                delete_changes = [
                    fc for fc in (file_to_cartridge_path(f, cartridges) for f in files_to_delete) if fc is not None
                ]

                files_to_upload.clear()
                files_to_delete.clear()

                try:
                    await upload_files(
                        instance,
                        code_version,
                        upload_changes,
                        delete_changes,
                        UploadFilesOptions(on_upload=opts.on_upload, on_delete=opts.on_delete, on_error=opts.on_error),
                    )
                except Exception:  # noqa: BLE001 - re-queued for retry after rate-limit wait
                    state["last_error_time"] = time.monotonic()
                    # Re-queue so the while loop retries after the rate-limit wait.
                    for fc in upload_changes:
                        files_to_upload.add(fc.src)
        finally:
            state["is_processing"] = False

    def schedule_processing() -> None:
        nonlocal debounce_handle, processing_task

        if debounce_handle is not None:
            debounce_handle.cancel()

        def _fire() -> None:
            nonlocal processing_task
            processing_task = asyncio.ensure_future(run_processing())

        loop = asyncio.get_running_loop()
        debounce_handle = loop.call_later(opts.debounce_time_ms / 1000, _fire)

    async def poll_loop() -> None:
        previous = _snapshot(cartridges)
        while True:
            await asyncio.sleep(opts.poll_interval_seconds)
            current = _snapshot(cartridges)

            changed = False
            for path, mtime in current.items():
                previous_mtime = previous.get(path)
                if previous_mtime is None or previous_mtime != mtime:
                    event = "add" if previous_mtime is None else "change"
                    logger.info("File event: %s %s", event, path)
                    files_to_upload.add(path)
                    files_to_delete.discard(path)
                    changed = True
            for path in previous:
                if path not in current:
                    logger.info("File event: unlink %s", path)
                    files_to_delete.add(path)
                    files_to_upload.discard(path)
                    changed = True

            previous = current
            if changed:
                schedule_processing()

    poll_task = asyncio.ensure_future(poll_loop())

    def _on_poll_error(task: asyncio.Task[None]) -> None:
        if task.cancelled():
            return
        error = task.exception()
        if error is None:
            return
        wrapped = error if isinstance(error, Exception) else RuntimeError(str(error))
        logger.error("Watcher error: %s", wrapped)
        if opts.on_error:
            opts.on_error(wrapped)

    poll_task.add_done_callback(_on_poll_error)

    logger.debug("Watching for changes on %s (code version %s)...", instance.config.hostname, code_version)

    async def stop() -> None:
        poll_task.remove_done_callback(_on_poll_error)
        poll_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await poll_task

        if debounce_handle is not None:
            debounce_handle.cancel()

        if processing_task is not None:
            with contextlib.suppress(asyncio.CancelledError):
                await processing_task

        logger.debug("Watcher stopped")

    return WatchResult(cartridges=cartridges, code_version=code_version, stop=stop)


__all__ = ["WatchOptions", "WatchResult", "watch_cartridges"]
