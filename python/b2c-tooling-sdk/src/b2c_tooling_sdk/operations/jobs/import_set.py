# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Ordered, idempotent site-archive import sets for B2C Commerce.

Mirrors ``src/operations/jobs/import-set.ts``. Applies an ordered set of site
archives exactly until a verified WebDAV receipt directory exists for each item,
using an exclusive WebDAV directory (``MKCOL``) as a best-effort set-wide lock.

Node/TS mappings used here:

* ``createHash('sha256')`` -> :func:`hashlib.sha256`
* ``randomUUID`` -> :func:`uuid.uuid4`
* ``setInterval``/``clearInterval`` heartbeat -> a cancellable :mod:`asyncio` task
* injectable ``sleep`` -> ``Callable[[float], Awaitable[None]]`` in **seconds**
"""

from __future__ import annotations

import asyncio
import contextlib
import hashlib
import json
import os
import re
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.errors.http_error import HttpError
from b2c_tooling_sdk.operations.code.cartridges import find_cartridges
from b2c_tooling_sdk.operations.jobs.site_archive import (
    SiteArchiveImportOptions,
    SiteArchiveImportResult,
    site_archive_import,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

DEFAULT_STATE_ROOT = "Impex/b2c-cli/import-sets"
DEFAULT_SET_ID = "migrations"
DEFAULT_STALE_LOCK_SECONDS = 30 * 60
DEFAULT_LOCK_POLL_INTERVAL_SECONDS = 3
DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 30

SITE_ARCHIVE_DIRECTORY_NAMES = frozenset(
    {
        "ab-tests",
        "cache-settings",
        "catalogs",
        "coupons",
        "csrf-allowlists",
        "csrf-whitelists",
        "customer-lists",
        "custom-objects",
        "dcext",
        "geolocations",
        "global-data",
        "inventory",
        "inventory-lists",
        "jobs",
        "libraries",
        "locales",
        "meta",
        "oauth-providers",
        "ocapi-settings",
        "payment-methods",
        "payment-processors",
        "preferences",
        "price-books",
        "pricebooks",
        "promotions",
        "redirect-urls",
        "search",
        "services",
        "shipping",
        "sites",
        "slots",
        "sorting-rules",
        "source-codes",
        "sourcecodes",
        "static",
        "static-resources",
        "stores",
        "system-type-definitions",
        "tax",
        "users",
    }
)

#: README filenames checked, in priority order, at the top of a directory item.
README_FILENAMES = ["README.md", "README"]

_SleepFn = Callable[[float], Awaitable[None]]


@dataclass
class ImportSetItem:
    """A local archive in an import set."""

    #: Stable item ID, derived from the source and immediate child name.
    id: str
    #: Absolute local path to the directory or zip archive.
    target: str
    #: Source kind (``"directory"`` or ``"zip"``).
    kind: str
    #: Trimmed contents of a top-level ``README.md``/``README`` for directory
    #: items, else ``None``.
    note: str | None = None


@dataclass
class DiscoverImportSetOptions:
    """Options for discovering import-set items."""

    #: Include items from ``metadata/`` directories in discovered cartridges.
    include_cartridge_metadata: bool = True
    #: Root directory used to discover cartridges. Defaults to the CWD.
    cartridge_root: str | None = None
    #: Directory paths to exclude recursively, resolved relative to ``cartridge_root``.
    exclude_directories: list[str] | None = None


@dataclass
class ImportSetReceipt:
    """Durable directory receipt created after an import completes successfully."""

    set_id: str
    item_id: str
    #: WebDAV directory whose existence records the applied item name.
    receipt_path: str
    version: int = 1


@dataclass
class ImportSetItemResult(ImportSetItem):
    """Result for one item in an import set."""

    status: str = "pending"
    receipt: ImportSetReceipt | None = None
    import_result: SiteArchiveImportResult | None = None


@dataclass
class ImportSetResult:
    """Result of planning or applying an import set."""

    set_id: str
    directory: str
    dry_run: bool
    run_id: str
    items: list[ImportSetItemResult]
    imported: int
    skipped: int
    pending: int


@dataclass
class ImportSetLockOwner:
    """Owner information stored inside the WebDAV lock directory."""

    set_id: str
    run_id: str
    created_at: str
    heartbeat_at: str
    owner: str | None = None
    version: int = 1


@dataclass
class ImportSetEvent:
    """Structured lifecycle event delivered while planning and applying an import set.

    The ``type`` field selects the variant; only the fields relevant to that
    variant are populated (mirrors the TS discriminated union).
    """

    type: str
    set_id: str | None = None
    total: int | None = None
    pending: int | None = None
    skipped: int | None = None
    dry_run: bool | None = None
    run_id: str | None = None
    owner: ImportSetLockOwner | None = None
    age_seconds: float | None = None
    forced: bool | None = None
    item: ImportSetItem | None = None
    receipt: ImportSetReceipt | None = None
    index: int | None = None
    receipt_path: str | None = None


_ImportArchiveFn = Callable[["B2CInstance", str, SiteArchiveImportOptions], Awaitable[SiteArchiveImportResult]]


@dataclass
class SiteArchiveImportSetOptions:
    """Options for :func:`site_archive_import_set`."""

    #: Stable receipt and lock namespace. Defaults to ``migrations``.
    set_id: str | None = None
    #: Plan imports without creating state, locking, importing, or writing receipts.
    dry_run: bool = False
    #: Keep uploaded archives in ``Impex/src/instance`` after each import.
    keep_archive: bool = False
    #: Include items from ``metadata/`` directories in discovered cartridges.
    include_cartridge_metadata: bool = True
    #: Root directory used to discover cartridges. Defaults to the CWD.
    cartridge_root: str | None = None
    #: Directory paths to exclude recursively, resolved relative to ``cartridge_root``.
    exclude_directories: list[str] | None = None
    #: WebDAV state root. Defaults to ``Impex/b2c-cli/import-sets``.
    state_root: str | None = None
    #: Age (seconds) after which a lock heartbeat is considered stale (default 1800).
    stale_lock_seconds: int | None = None
    #: Poll interval (seconds) while another runner owns the set lock (default 3).
    lock_poll_interval_seconds: int | None = None
    #: Lock heartbeat interval (seconds, default 30).
    heartbeat_interval_seconds: int | None = None
    #: Immediately remove an existing lock before attempting to acquire it.
    break_lock: bool = False
    #: Optional owner label stored in lock metadata.
    owner: str | None = None
    #: Wait options forwarded to each site archive import.
    wait_options: Any = None
    #: Receives planning, locking, and item progress events.
    on_event: Callable[[ImportSetEvent], None] | None = None
    #: Archive importer override. Defaults to :func:`site_archive_import`.
    import_archive: _ImportArchiveFn | None = None
    #: Sleep implementation (seconds) used while polling for a lock.
    sleep: _SleepFn = field(default=asyncio.sleep)


class ImportSetStateError(Exception):
    """Thrown when WebDAV lock or receipt state cannot be safely read or written."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.name = "ImportSetStateError"


@dataclass
class _JsonReadResult:
    found: bool
    valid: bool
    value: Any = None


@dataclass
class _ReceiptDirectoryReadResult:
    found: bool
    valid: bool


@dataclass
class _LockInfo:
    owner: ImportSetLockOwner | None = None
    age_seconds: float | None = None


# --- Discovery --------------------------------------------------------------


async def discover_import_set(
    directory: str,
    options: DiscoverImportSetOptions | None = None,
) -> list[ImportSetItem]:
    """Discover import items from cartridge ``metadata/`` directories followed by the
    explicit import-set directory.

    A cartridge metadata directory that resembles a site archive is one item;
    otherwise its immediate child directories and zip archives are items.

    :raises ValueError: when no items are found or an item ID collides.
    """
    opts = options or DiscoverImportSetOptions()
    resolved_directory = os.path.abspath(directory)
    excluded_directories = _resolve_excluded_directories(opts)
    cartridge_items = (
        [] if opts.include_cartridge_metadata is False else _discover_cartridge_metadata(opts, excluded_directories)
    )
    directory_items = _discover_import_directory(resolved_directory, "", excluded_directories)
    items = [*cartridge_items, *directory_items]

    if not items:
        import_directory_exists = os.path.isdir(resolved_directory)
        if not import_directory_exists and opts.include_cartridge_metadata is False:
            raise ValueError(f"Import-set directory does not exist: {resolved_directory}")
        raise ValueError(
            f"No import directories or zip archives found in {resolved_directory}"
            if opts.include_cartridge_metadata is False
            else f"No import directories or zip archives found in {resolved_directory} or discovered cartridge metadata"
        )

    seen: set[str] = set()
    for item in items:
        if item.id in seen:
            raise ValueError(f"Duplicate import-set item ID: {item.id}")
        seen.add(item.id)

    return items


def _discover_cartridge_metadata(
    options: DiscoverImportSetOptions,
    excluded_directories: list[str],
) -> list[ImportSetItem]:
    cartridges = sorted(
        (c for c in find_cartridges(options.cartridge_root) if not _is_excluded_path(c.src, excluded_directories)),
        key=lambda c: c.name,
    )
    items: list[ImportSetItem] = []

    for cartridge in cartridges:
        metadata_directory = os.path.join(cartridge.src, "metadata")
        metadata_entries = _read_directory(metadata_directory)
        if metadata_entries is None:
            continue

        if _looks_like_site_archive(metadata_entries):
            items.append(
                ImportSetItem(
                    id=f"cartridge-metadata/{cartridge.name}",
                    target=metadata_directory,
                    kind="directory",
                    note=_read_item_note(metadata_directory),
                )
            )
            continue

        items.extend(
            _discover_import_directory(
                metadata_directory,
                f"cartridge-metadata/{cartridge.name}/",
                excluded_directories,
            )
        )

    return items


def _looks_like_site_archive(entries: list[os.DirEntry[str]]) -> bool:
    for entry in entries:
        if entry.name.startswith("."):
            continue
        if entry.is_file():
            if os.path.splitext(entry.name)[1].lower() == ".xml":
                return True
            continue
        if not entry.is_dir():
            continue
        if entry.name.lower().replace("_", "-") in SITE_ARCHIVE_DIRECTORY_NAMES:
            return True
    return False


def _read_directory(directory: str) -> list[os.DirEntry[str]] | None:
    if not os.path.exists(directory):
        return None
    if not os.path.isdir(directory):
        raise ValueError(f"Import-set source is not a directory: {directory}")
    with os.scandir(directory) as scan:
        return list(scan)


def _discover_import_directory(
    directory: str,
    id_prefix: str = "",
    excluded_directories: list[str] | None = None,
) -> list[ImportSetItem]:
    excluded_directories = excluded_directories or []
    entries = _read_directory(directory)
    if entries is None:
        return []
    candidates = sorted(
        (
            entry
            for entry in entries
            if not entry.name.startswith(".")
            and (entry.is_dir() or (entry.is_file() and os.path.splitext(entry.name)[1].lower() == ".zip"))
            and not _is_excluded_path(os.path.join(directory, entry.name), excluded_directories)
        ),
        key=lambda entry: entry.name,
    )

    items: list[ImportSetItem] = []
    for entry in candidates:
        target = os.path.join(directory, entry.name)
        kind = "directory" if entry.is_dir() else "zip"
        items.append(
            ImportSetItem(
                id=f"{id_prefix}{entry.name}",
                target=target,
                kind=kind,
                note=_read_item_note(target) if kind == "directory" else None,
            )
        )
    return items


def _resolve_excluded_directories(options: DiscoverImportSetOptions) -> list[str]:
    root = os.path.abspath(options.cartridge_root or os.getcwd())
    configured = options.exclude_directories or []
    resolved: list[str] = []
    seen: set[str] = set()
    for directory in configured:
        if not isinstance(directory, str) or not directory.strip():
            continue
        abs_dir = os.path.abspath(os.path.join(root, directory.strip()))
        if abs_dir not in seen:
            seen.add(abs_dir)
            resolved.append(abs_dir)
    return resolved


def _read_item_note(directory: str) -> str | None:
    for filename in README_FILENAMES:
        path = os.path.join(directory, filename)
        try:
            with open(path, encoding="utf-8") as handle:
                contents = handle.read()
        except OSError:
            continue
        trimmed = contents.strip()
        return trimmed if trimmed else None
    return None


def _is_excluded_path(candidate: str, excluded_directories: list[str]) -> bool:
    for excluded_directory in excluded_directories:
        relative_path = os.path.relpath(candidate, excluded_directory)
        if relative_path == "." or (not relative_path.startswith("..") and not os.path.isabs(relative_path)):
            return True
    return False


# --- Apply ------------------------------------------------------------------


async def site_archive_import_set(
    instance: B2CInstance,
    directory: str,
    options: SiteArchiveImportSetOptions | None = None,
) -> ImportSetResult:
    """Apply an ordered set of site archives exactly until a verified receipt
    directory exists for each item.

    A missing or invalid receipt always leaves the item pending. The operation
    never logs or writes output; callers consume structured progress through
    :attr:`SiteArchiveImportSetOptions.on_event`.
    """
    opts = options or SiteArchiveImportSetOptions()
    resolved_directory = os.path.abspath(directory)
    set_id = opts.set_id or DEFAULT_SET_ID
    _validate_set_id(set_id)
    _validate_state_root(opts.state_root or DEFAULT_STATE_ROOT)

    run_id = str(uuid.uuid4())
    items = await discover_import_set(
        resolved_directory,
        DiscoverImportSetOptions(
            include_cartridge_metadata=opts.include_cartridge_metadata,
            cartridge_root=opts.cartridge_root,
            exclude_directories=opts.exclude_directories,
        ),
    )
    state_root = (opts.state_root or DEFAULT_STATE_ROOT).rstrip("/")
    set_root = f"{state_root}/{set_id}"
    receipts_root = f"{set_root}/receipts"
    lock_path = f"{set_root}/lock"
    sleep = opts.sleep
    import_archive = opts.import_archive or site_archive_import

    item_results = await _evaluate_receipts(instance, set_id, receipts_root, items, opts.on_event)
    _emit_plan(opts, set_id, item_results)

    if opts.dry_run or all(item.status == "skipped" for item in item_results):
        return _build_result(set_id, resolved_directory, bool(opts.dry_run), run_id, item_results)

    await _ensure_collection(instance, state_root, sleep)
    await _ensure_collection(instance, set_root, sleep)
    await _ensure_collection(instance, receipts_root, sleep)

    lock_owner = await _acquire_lock(instance, lock_path, set_id, run_id, opts, sleep)
    heartbeat_error: list[Exception | None] = [None]
    heartbeat_interval = max(1, opts.heartbeat_interval_seconds or DEFAULT_HEARTBEAT_INTERVAL_SECONDS)

    async def _heartbeat_loop() -> None:
        while True:
            try:
                await asyncio.sleep(heartbeat_interval)
                await _heartbeat_lock(instance, lock_path, lock_owner)
            except asyncio.CancelledError:
                return
            except Exception as error:  # noqa: BLE001 - surfaced to the main flow
                heartbeat_error[0] = error

    heartbeat_task = asyncio.create_task(_heartbeat_loop())
    operation_error: Exception | None = None

    try:
        # Another runner may have completed work while this process waited.
        item_results = await _evaluate_receipts(instance, set_id, receipts_root, items, opts.on_event)
        total = len(item_results)

        for index, item_result in enumerate(item_results):
            if item_result.status == "skipped":
                if opts.on_event is not None:
                    opts.on_event(
                        ImportSetEvent(
                            type="item-skipped",
                            item=item_result,
                            receipt=item_result.receipt,
                            index=index + 1,
                            total=total,
                        )
                    )
                continue

            if heartbeat_error[0] is not None:
                raise heartbeat_error[0]
            await _heartbeat_lock(instance, lock_path, lock_owner)
            if opts.on_event is not None:
                opts.on_event(ImportSetEvent(type="item-importing", item=item_result, index=index + 1, total=total))

            import_result = await import_archive(
                instance,
                item_result.target,
                SiteArchiveImportOptions(
                    keep_archive=opts.keep_archive,
                    wait=True,
                    wait_options=opts.wait_options,
                ),
            )

            if heartbeat_error[0] is not None:
                raise heartbeat_error[0]
            receipt = _create_receipt(set_id, receipts_root, item_result.id)
            await _write_and_verify_receipt(instance, receipt.receipt_path)

            item_result.status = "imported"
            item_result.receipt = receipt
            item_result.import_result = import_result
            if opts.on_event is not None:
                opts.on_event(
                    ImportSetEvent(
                        type="item-imported",
                        item=item_result,
                        receipt=receipt,
                        index=index + 1,
                        total=total,
                    )
                )

        return _build_result(set_id, resolved_directory, False, run_id, item_results)
    except Exception as error:
        operation_error = error
        raise
    finally:
        heartbeat_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await heartbeat_task
        try:
            await _release_lock(instance, lock_path, run_id)
        except Exception:
            # Preserve an import or receipt error so callers can report the real
            # failure. An unreleased lock becomes eligible for stale takeover.
            if operation_error is None:
                raise


async def _evaluate_receipts(
    instance: B2CInstance,
    set_id: str,
    receipts_root: str,
    items: list[ImportSetItem],
    on_event: Callable[[ImportSetEvent], None] | None = None,
) -> list[ImportSetItemResult]:
    results: list[ImportSetItemResult] = []
    for item in items:
        remote_path = _receipt_path(receipts_root, item.id)
        read = await _read_receipt_directory(instance, remote_path)
        if not read.found:
            results.append(_result_from_item(item, "pending"))
            continue
        if not read.valid:
            if on_event is not None:
                on_event(ImportSetEvent(type="receipt-invalid", item=item, receipt_path=remote_path))
            results.append(_result_from_item(item, "pending"))
            continue
        results.append(_result_from_item(item, "skipped", receipt=_create_receipt(set_id, receipts_root, item.id)))
    return results


def _result_from_item(
    item: ImportSetItem,
    status: str,
    receipt: ImportSetReceipt | None = None,
) -> ImportSetItemResult:
    return ImportSetItemResult(
        id=item.id,
        target=item.target,
        kind=item.kind,
        note=item.note,
        status=status,
        receipt=receipt,
    )


async def _acquire_lock(
    instance: B2CInstance,
    lock_path: str,
    set_id: str,
    run_id: str,
    options: SiteArchiveImportSetOptions,
    sleep: _SleepFn,
) -> ImportSetLockOwner:
    stale_seconds = max(1, options.stale_lock_seconds or DEFAULT_STALE_LOCK_SECONDS)
    poll_seconds = max(1, options.lock_poll_interval_seconds or DEFAULT_LOCK_POLL_INTERVAL_SECONDS)
    force_break = bool(options.break_lock)
    wait_notified = False

    while True:
        response = await instance.webdav.request(lock_path, method="MKCOL")
        if response.status_code == 201:
            now = _now_iso()
            owner = ImportSetLockOwner(
                set_id=set_id,
                run_id=run_id,
                created_at=now,
                heartbeat_at=now,
                owner=options.owner,
            )
            try:
                await _put_json(instance, f"{lock_path}/owner.json", owner)
            except Exception:
                await _delete_path(instance, lock_path)
                raise
            if options.on_event is not None:
                options.on_event(ImportSetEvent(type="lock-acquired", set_id=set_id, run_id=run_id))
            return owner

        if response.status_code not in (405, 409):
            raise ImportSetStateError(
                f"Unable to acquire import-set lock {lock_path}: {response.status_code} {response.reason_phrase}"
            )

        info = await _read_lock_info(instance, lock_path)
        stale = info.age_seconds is not None and info.age_seconds >= stale_seconds
        if force_break or stale:
            if options.on_event is not None:
                options.on_event(
                    ImportSetEvent(
                        type="lock-takeover",
                        set_id=set_id,
                        owner=info.owner,
                        age_seconds=info.age_seconds,
                        forced=force_break,
                    )
                )
            await _delete_path(instance, lock_path)
            force_break = False
            wait_notified = False
            continue

        if not wait_notified:
            if options.on_event is not None:
                options.on_event(
                    ImportSetEvent(type="lock-wait", set_id=set_id, owner=info.owner, age_seconds=info.age_seconds)
                )
            wait_notified = True
        await sleep(poll_seconds)


async def _heartbeat_lock(instance: B2CInstance, lock_path: str, owner: ImportSetLockOwner) -> None:
    owner_path = f"{lock_path}/owner.json"
    current = await _read_json(instance, owner_path)
    if not current.found or not current.valid or _owner_run_id(current.value) != owner.run_id:
        raise ImportSetStateError(f"Import-set lock {lock_path} is no longer owned by run {owner.run_id}")
    owner.heartbeat_at = _now_iso()
    await _put_json(instance, owner_path, owner)


async def _release_lock(instance: B2CInstance, lock_path: str, run_id: str) -> None:
    current = await _read_json(instance, f"{lock_path}/owner.json")
    if current.found and current.valid and _owner_run_id(current.value) == run_id:
        await _delete_path(instance, lock_path)


async def _read_lock_info(instance: B2CInstance, lock_path: str) -> _LockInfo:
    owner_read = await _read_json(instance, f"{lock_path}/owner.json")
    owner = _coerce_owner(owner_read.value) if owner_read.valid else None
    timestamp = None
    if owner is not None:
        timestamp = owner.heartbeat_at or owner.created_at
    if timestamp:
        milliseconds = _parse_iso_millis(timestamp)
        if milliseconds is not None:
            now_ms = _now_millis()
            return _LockInfo(owner=owner, age_seconds=max(0.0, (now_ms - milliseconds) / 1000))

    try:
        entries = await instance.webdav.propfind(lock_path, "0")
        modified = entries[0].last_modified if entries else None
        age = None
        if modified is not None:
            age = max(0.0, (_now_millis() - modified.timestamp() * 1000) / 1000)
        return _LockInfo(owner=owner, age_seconds=age)
    except Exception:  # noqa: BLE001 - propfind failure just means unknown age
        return _LockInfo(owner=owner)


async def _ensure_collection(instance: B2CInstance, remote_path: str, sleep: _SleepFn) -> None:
    segments = [segment for segment in remote_path.split("/") if segment]
    if len(segments) < 2:
        raise ImportSetStateError(f"Invalid WebDAV state path: {remote_path}")

    current = segments[0]
    for segment in segments[1:]:
        current = f"{current}/{segment}"
        response = await instance.webdav.request(current, method="MKCOL")
        if response.status_code in (201, 405):
            continue
        if response.status_code == 409:
            # Concurrent creators can receive 409 while the winning collection becomes visible.
            await sleep(0.025)
            head = await instance.webdav.request(current, method="HEAD")
            if head.is_success:
                continue
        raise ImportSetStateError(
            f"Unable to create WebDAV collection {current}: {response.status_code} {response.reason_phrase}"
        )


async def _read_json(instance: B2CInstance, remote_path: str) -> _JsonReadResult:
    response = await instance.webdav.request(remote_path, method="GET")
    if response.status_code == 404:
        return _JsonReadResult(found=False, valid=False)
    if not response.is_success:
        raise ImportSetStateError(
            f"Unable to read WebDAV state {remote_path}: {response.status_code} {response.reason_phrase}"
        )
    try:
        return _JsonReadResult(found=True, valid=True, value=json.loads(response.text))
    except (ValueError, json.JSONDecodeError):
        return _JsonReadResult(found=True, valid=False)


async def _put_json(instance: B2CInstance, remote_path: str, value: Any) -> None:
    payload = value
    if isinstance(value, ImportSetLockOwner):
        payload = _owner_to_json(value)
    response = await instance.webdav.request(
        remote_path,
        method="PUT",
        headers={"Content-Type": "application/json"},
        content=f"{json.dumps(payload, indent=2)}\n",
    )
    if not response.is_success:
        raise ImportSetStateError(
            f"Unable to write WebDAV state {remote_path}: {response.status_code} {response.reason_phrase}"
        )


async def _read_receipt_directory(instance: B2CInstance, remote_path: str) -> _ReceiptDirectoryReadResult:
    try:
        entries = await instance.webdav.propfind(remote_path, "0")
        return _ReceiptDirectoryReadResult(found=True, valid=bool(entries and entries[0].is_collection))
    except HttpError as error:
        if error.response.status_code == 404:
            return _ReceiptDirectoryReadResult(found=False, valid=False)
        raise ImportSetStateError(f"Unable to read WebDAV receipt directory {remote_path}: {error}") from error


async def _write_and_verify_receipt(instance: B2CInstance, remote_path: str) -> None:
    response = await instance.webdav.request(remote_path, method="MKCOL")
    if response.status_code == 405:
        existing = await _read_receipt_directory(instance, remote_path)
        if not existing.valid:
            await _delete_path(instance, remote_path)
            response = await instance.webdav.request(remote_path, method="MKCOL")
    if response.status_code not in (201, 405):
        raise ImportSetStateError(
            f"Unable to create WebDAV receipt directory {remote_path}: {response.status_code} {response.reason_phrase}"
        )

    verification = await _read_receipt_directory(instance, remote_path)
    if not verification.found or not verification.valid:
        raise ImportSetStateError(
            f"Receipt directory verification failed for {remote_path}; the import will be retried."
        )


async def _delete_path(instance: B2CInstance, remote_path: str) -> None:
    response = await instance.webdav.request(remote_path, method="DELETE")
    if not response.is_success and response.status_code != 404:
        raise ImportSetStateError(
            f"Unable to delete WebDAV state {remote_path}: {response.status_code} {response.reason_phrase}"
        )


def _create_receipt(set_id: str, receipts_root: str, item_id: str) -> ImportSetReceipt:
    return ImportSetReceipt(
        version=1,
        set_id=set_id,
        item_id=item_id,
        receipt_path=_receipt_path(receipts_root, item_id),
    )


def _receipt_path(receipts_root: str, item_id: str) -> str:
    digest = hashlib.sha256(item_id.encode("utf-8")).hexdigest()
    return f"{receipts_root}/{digest}"


def _emit_plan(options: SiteArchiveImportSetOptions, set_id: str, items: list[ImportSetItemResult]) -> None:
    if options.on_event is None:
        return
    options.on_event(
        ImportSetEvent(
            type="plan",
            set_id=set_id,
            total=len(items),
            pending=sum(1 for item in items if item.status == "pending"),
            skipped=sum(1 for item in items if item.status == "skipped"),
            dry_run=bool(options.dry_run),
        )
    )


def _build_result(
    set_id: str,
    directory: str,
    dry_run: bool,
    run_id: str,
    items: list[ImportSetItemResult],
) -> ImportSetResult:
    return ImportSetResult(
        set_id=set_id,
        directory=directory,
        dry_run=dry_run,
        run_id=run_id,
        items=items,
        imported=sum(1 for item in items if item.status == "imported"),
        skipped=sum(1 for item in items if item.status == "skipped"),
        pending=sum(1 for item in items if item.status == "pending"),
    )


def _validate_set_id(set_id: str) -> None:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}", set_id):
        raise ValueError(
            f'Invalid import-set ID "{set_id}". Use 1-128 letters, numbers, dots, underscores, or hyphens.'
        )


def _validate_state_root(state_root: str) -> None:
    segments = [segment for segment in state_root.split("/") if segment]
    if (not segments or segments[0].lower() != "impex") or any(segment in (".", "..") for segment in segments):
        raise ValueError(f"Import-set state root must be a path under Impex: {state_root}")


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _now_millis() -> float:
    return datetime.now(tz=timezone.utc).timestamp() * 1000


def _parse_iso_millis(value: str) -> float | None:
    text = value.replace("Z", "+00:00") if value.endswith("Z") else value
    try:
        return datetime.fromisoformat(text).timestamp() * 1000
    except ValueError:
        return None


def _owner_to_json(owner: ImportSetLockOwner) -> dict[str, Any]:
    data: dict[str, Any] = {
        "version": owner.version,
        "setId": owner.set_id,
        "runId": owner.run_id,
        "createdAt": owner.created_at,
        "heartbeatAt": owner.heartbeat_at,
    }
    if owner.owner is not None:
        data["owner"] = owner.owner
    return data


def _coerce_owner(value: Any) -> ImportSetLockOwner | None:
    if not isinstance(value, dict):
        return None
    return ImportSetLockOwner(
        version=value.get("version", 1),
        set_id=value.get("setId", ""),
        run_id=value.get("runId", ""),
        created_at=value.get("createdAt", ""),
        heartbeat_at=value.get("heartbeatAt", ""),
        owner=value.get("owner"),
    )


def _owner_run_id(value: Any) -> str | None:
    if isinstance(value, dict):
        run_id = value.get("runId")
        return run_id if isinstance(run_id, str) else None
    return None


__all__ = [
    "DEFAULT_HEARTBEAT_INTERVAL_SECONDS",
    "DEFAULT_LOCK_POLL_INTERVAL_SECONDS",
    "DEFAULT_SET_ID",
    "DEFAULT_STALE_LOCK_SECONDS",
    "DEFAULT_STATE_ROOT",
    "SITE_ARCHIVE_DIRECTORY_NAMES",
    "DiscoverImportSetOptions",
    "ImportSetEvent",
    "ImportSetItem",
    "ImportSetItemResult",
    "ImportSetLockOwner",
    "ImportSetReceipt",
    "ImportSetResult",
    "ImportSetStateError",
    "SiteArchiveImportSetOptions",
    "discover_import_set",
    "site_archive_import_set",
]
