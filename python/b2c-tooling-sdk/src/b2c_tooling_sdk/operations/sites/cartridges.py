# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Site cartridge path operations for B2C Commerce instances.

Mirrors ``src/operations/sites/cartridges.ts``. Provides functions for
managing the ordered list of active cartridges on a site via SCAPI with
temporary OCAPI fallback, plus site archive import/export when neither direct
API is available.

Cross-module note: this module needs ``site_archive_import`` and
``site_archive_export_to_buffer`` from ``operations.jobs.site_archive`` for its
fallback path. To avoid a hard import-time dependency on ``operations.jobs``
(which imports back into ``operations.sites``), the import is deferred to
:func:`_import_jobs_site_archive`, called only when the fallback path actually
runs. Tests monkeypatch that single function instead of the real jobs module.
"""

from __future__ import annotations

import io
import re
import zipfile
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.logging import get_logger
from b2c_tooling_sdk.operations.sites.sites_backend import SitesBackendConfig, create_sites_backend
from b2c_tooling_sdk.operations.sites.sites_types import CartridgePosition

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance
    from b2c_tooling_sdk.operations.jobs.run import WaitForJobOptions

#: The special site ID for Business Manager.
BM_SITE_ID = "Sites-Site"


@dataclass
class AddCartridgeOptions:
    """Options for adding a cartridge to a site's cartridge path."""

    #: Cartridge name to add.
    name: str
    #: Position to add the cartridge (default: ``"first"``).
    position: CartridgePosition = "first"
    #: Target cartridge name (required when position is ``"before"`` or ``"after"``).
    target: str | None = None


@dataclass
class CartridgeUpdateOptions:
    """Options for cartridge path update operations that may run jobs."""

    #: Callback for operation-level status messages (e.g. "Exporting site preferences...").
    log: Callable[[str], None] | None = None
    #: Wait options for underlying job execution (polling interval, timeout, progress).
    wait_options: WaitForJobOptions | None = None


@dataclass
class CartridgePathResult:
    """Result of a cartridge path operation."""

    #: Site ID.
    site_id: str
    #: Colon-separated cartridge path string.
    cartridges: str
    #: Cartridge names as an ordered array.
    cartridge_list: list[str]


def _import_jobs_site_archive() -> tuple[
    Callable[..., Awaitable[Any]],
    Callable[..., Awaitable[Any]],
]:
    """Deferred import indirection for ``operations.jobs.site_archive``.

    Kept as a standalone module-level function (rather than an inline import at
    each call site) so tests can monkeypatch it directly — ``operations.jobs``
    never needs to exist for cartridge-path tests that don't exercise the
    fallback path, and tests that do exercise it never need the real jobs
    module to be importable.

    :returns: ``(site_archive_import, site_archive_export_to_buffer)``.
    """
    from b2c_tooling_sdk.operations.jobs.site_archive import (  # noqa: PLC0415
        site_archive_export_to_buffer,
        site_archive_import,
    )

    return site_archive_import, site_archive_export_to_buffer


def _to_result(site_id: str, cartridges: str) -> CartridgePathResult:
    """Parses a colon-separated cartridge path string into a :class:`CartridgePathResult`."""
    trimmed = cartridges.strip()
    return CartridgePathResult(
        site_id=site_id,
        cartridges=trimmed,
        cartridge_list=trimmed.split(":") if trimmed else [],
    )


async def get_cartridge_path(instance: B2CInstance, site_id: str) -> CartridgePathResult:
    """Gets the cartridge path for a site.

    Uses the configured Sites backend to read the cartridge path. Auto mode
    prefers SCAPI and temporarily falls back to OCAPI. Works for all sites
    including Business Manager (``Sites-Site``).

    :param instance: B2C instance to query.
    :param site_id: Site ID (e.g. ``"RefArch"``, ``"Sites-Site"``).
    :returns: Cartridge path result.
    """
    try:
        cartridges = await create_sites_backend(SitesBackendConfig(instance=instance)).get_cartridge_path(site_id)
        return _to_result(site_id, cartridges)
    except Exception as error:
        raise RuntimeError(f'Failed to get cartridge path for site "{site_id}": {error}') from error


async def add_cartridge(
    instance: B2CInstance,
    site_id: str,
    options: AddCartridgeOptions,
    update_options: CartridgeUpdateOptions | None = None,
) -> CartridgePathResult:
    """Adds a cartridge to a site's cartridge path.

    For regular sites, uses the SCAPI-first Sites backend and falls back to
    site archive import if neither direct backend is available. For Business
    Manager (``Sites-Site``), always uses site archive import.
    """
    logger = get_logger()

    # BM always uses import/export
    if site_id == BM_SITE_ID:
        logger.debug('Business Manager site "%s" — using site archive import for cartridge add', site_id)
        return await _add_cartridge_via_import(instance, site_id, options, update_options)

    backend = create_sites_backend(SitesBackendConfig(instance=instance))
    try:
        cartridges = await backend.add_cartridge(site_id, options.name, options.position, options.target)
        return _to_result(site_id, cartridges)
    except Exception as backend_error:
        return await _handle_fallback(
            site_id,
            "add",
            backend_error,
            lambda: _add_cartridge_via_import(instance, site_id, options, update_options),
        )


async def remove_cartridge(
    instance: B2CInstance,
    site_id: str,
    cartridge_name: str,
    update_options: CartridgeUpdateOptions | None = None,
) -> CartridgePathResult:
    """Removes a cartridge from a site's cartridge path.

    For regular sites, uses the SCAPI-first Sites backend and falls back to
    site archive import if neither direct backend is available. For Business
    Manager (``Sites-Site``), always uses site archive import.
    """
    logger = get_logger()

    if site_id == BM_SITE_ID:
        logger.debug('Business Manager site "%s" — using site archive import for cartridge remove', site_id)
        return await _remove_cartridge_via_import(instance, site_id, cartridge_name, update_options)

    backend = create_sites_backend(SitesBackendConfig(instance=instance))
    try:
        cartridges = await backend.remove_cartridge(site_id, cartridge_name)
        return _to_result(site_id, cartridges)
    except Exception as backend_error:
        return await _handle_fallback(
            site_id,
            "remove",
            backend_error,
            lambda: _remove_cartridge_via_import(instance, site_id, cartridge_name, update_options),
        )


async def set_cartridge_path(
    instance: B2CInstance,
    site_id: str,
    cartridges: str,
    update_options: CartridgeUpdateOptions | None = None,
) -> CartridgePathResult:
    """Replaces the entire cartridge path for a site.

    For regular sites, uses the SCAPI-first Sites backend and falls back to
    site archive import if neither direct backend is available. For Business
    Manager (``Sites-Site``), always uses site archive import.
    """
    logger = get_logger()

    if site_id == BM_SITE_ID:
        logger.debug('Business Manager site "%s" — using site archive import for cartridge set', site_id)
        return await _set_cartridge_path_via_import(instance, site_id, cartridges, update_options)

    backend = create_sites_backend(SitesBackendConfig(instance=instance))
    try:
        result_cartridges = await backend.set_cartridge_path(site_id, cartridges)
        return _to_result(site_id, result_cartridges)
    except Exception as backend_error:
        return await _handle_fallback(
            site_id,
            "set",
            backend_error,
            lambda: _set_cartridge_path_via_import(instance, site_id, cartridges, update_options),
        )


# ---------------------------------------------------------------------------
# Internal: Fallback handler
# ---------------------------------------------------------------------------


async def _handle_fallback(
    site_id: str,
    operation: str,
    backend_error: BaseException,
    fallback_fn: Callable[[], Awaitable[CartridgePathResult]],
) -> CartridgePathResult:
    logger = get_logger()
    backend_message = str(backend_error)

    logger.warning(
        'Direct API %s failed for site "%s" (%s), trying site archive import fallback',
        operation,
        site_id,
        backend_message,
    )

    try:
        return await fallback_fn()
    except Exception as import_error:
        import_message = str(import_error)
        message = "\n".join(
            [
                f'Failed to {operation} cartridge path for site "{site_id}".',
                "",
                f"SCAPI/OCAPI direct update failed: {backend_message}",
                f"Site archive import fallback also failed: {import_message}",
                "",
                "To fix, configure one of:",
                "  - SCAPI Sites API: Grant sfcc.sites.rw",
                "  - OCAPI Data API: Grant POST/PUT/DELETE on /sites/*/cartridges",
                "  - Site import: Grant job execution permissions for sfcc-site-archive-import "
                "and WebDAV write access to Impex/",
                "",
                "See: https://salesforcecommercecloud.github.io/b2c-developer-tooling/guide/authentication.html",
            ]
        )
        raise RuntimeError(message) from import_error


# ---------------------------------------------------------------------------
# Internal: Import/export-based operations
# ---------------------------------------------------------------------------


async def _get_cartridge_path_via_export(
    instance: B2CInstance,
    site_id: str,
    update_options: CartridgeUpdateOptions | None = None,
) -> str:
    """Reads the current cartridge path via site archive export.

    Used as a fallback when OCAPI GET also fails.
    """
    logger = get_logger()
    opts = update_options or CartridgeUpdateOptions()
    logger.debug('Reading cartridge path via site archive export for site "%s"', site_id)
    if opts.log:
        target_desc = "organization preferences" if site_id == BM_SITE_ID else "site descriptor"
        opts.log(f"Exporting {target_desc} to read cartridge path...")

    _, site_archive_export_to_buffer = _import_jobs_site_archive()

    if site_id == BM_SITE_ID:
        result = await site_archive_export_to_buffer(
            instance, {"global_data": {"preferences": True}}, wait_options=opts.wait_options
        )
        prefs_xml = _find_file_in_zip(result.data, "preferences.xml")
        if prefs_xml is None:
            raise RuntimeError("preferences.xml not found in export archive")
        return _parse_bm_cartridges_from_preferences_xml(prefs_xml)

    result = await site_archive_export_to_buffer(
        instance, {"sites": {site_id: {"site_descriptor": True}}}, wait_options=opts.wait_options
    )
    descriptor_xml = _find_file_in_zip(result.data, "site.xml")
    if descriptor_xml is None:
        raise RuntimeError(f'site.xml not found in export archive for site "{site_id}"')
    return _parse_site_cartridges_from_descriptor_xml(descriptor_xml)


async def _set_cartridge_path_via_import(
    instance: B2CInstance,
    site_id: str,
    cartridges: str,
    update_options: CartridgeUpdateOptions | None = None,
) -> CartridgePathResult:
    logger = get_logger()
    opts = update_options or CartridgeUpdateOptions()
    logger.debug('Setting cartridge path via site archive import for site "%s": %s', site_id, cartridges)
    if opts.log:
        opts.log("Importing updated cartridge path...")

    if site_id == BM_SITE_ID:
        buffer = _build_zip({"preferences.xml": _generate_bm_preferences_xml(cartridges)})
    else:
        buffer = _build_zip({f"sites/{site_id}/site.xml": _generate_site_descriptor_xml(site_id, cartridges)})

    site_archive_import, _ = _import_jobs_site_archive()
    await site_archive_import(instance, buffer, wait_options=opts.wait_options)

    return _to_result(site_id, cartridges)


async def _add_cartridge_via_import(
    instance: B2CInstance,
    site_id: str,
    options: AddCartridgeOptions,
    update_options: CartridgeUpdateOptions | None = None,
) -> CartridgePathResult:
    # Read current path
    try:
        current_path = (await get_cartridge_path(instance, site_id)).cartridges
    except Exception:
        current_path = await _get_cartridge_path_via_export(instance, site_id, update_options)

    cartridge_list = current_path.split(":") if current_path else []

    # Check if already exists
    if options.name in cartridge_list:
        raise RuntimeError(f'Cartridge "{options.name}" already exists in the cartridge path for site "{site_id}"')

    # Apply position logic
    new_list = _apply_cartridge_position(cartridge_list, options)

    return await _set_cartridge_path_via_import(instance, site_id, ":".join(new_list), update_options)


async def _remove_cartridge_via_import(
    instance: B2CInstance,
    site_id: str,
    cartridge_name: str,
    update_options: CartridgeUpdateOptions | None = None,
) -> CartridgePathResult:
    try:
        current_path = (await get_cartridge_path(instance, site_id)).cartridges
    except Exception:
        current_path = await _get_cartridge_path_via_export(instance, site_id, update_options)

    cartridge_list = current_path.split(":") if current_path else []
    if cartridge_name not in cartridge_list:
        raise RuntimeError(f'Cartridge "{cartridge_name}" not found in the cartridge path for site "{site_id}"')

    cartridge_list.remove(cartridge_name)
    return await _set_cartridge_path_via_import(instance, site_id, ":".join(cartridge_list), update_options)


# ---------------------------------------------------------------------------
# Internal: Cartridge position logic
# ---------------------------------------------------------------------------


def _apply_cartridge_position(cartridge_list: list[str], options: AddCartridgeOptions) -> list[str]:
    result = list(cartridge_list)
    name, position, target = options.name, options.position, options.target

    if position == "first":
        result.insert(0, name)
    elif position == "last":
        result.append(name)
    elif position == "before":
        if target is None or target not in result:
            raise RuntimeError(f'Target cartridge "{target}" not found in the cartridge path')
        result.insert(result.index(target), name)
    elif position == "after":
        if target is None or target not in result:
            raise RuntimeError(f'Target cartridge "{target}" not found in the cartridge path')
        result.insert(result.index(target) + 1, name)

    return result


# ---------------------------------------------------------------------------
# Internal: XML generation and parsing
# ---------------------------------------------------------------------------

_PREFERENCE_RE = re.compile(r'<preference\s+preference-id="CustomCartridges"[^>]*>([^<]*)</preference>')
_CARTRIDGES_RE = re.compile(r"<cartridges>([^<]*)</cartridges>")


def _generate_bm_preferences_xml(cartridges: str) -> str:
    escaped = _escape_xml(cartridges)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<preferences xmlns="http://www.demandware.com/xml/impex/preferences/2007-03-31">\n'
        "    <standard-preferences>\n"
        "        <all-instances>\n"
        f'            <preference preference-id="CustomCartridges">{escaped}</preference>\n'
        "        </all-instances>\n"
        "    </standard-preferences>\n"
        "</preferences>\n"
    )


def _generate_site_descriptor_xml(site_id: str, cartridges: str) -> str:
    escaped_site_id = _escape_xml(site_id)
    escaped_cartridges = _escape_xml(cartridges)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<site xmlns="http://www.demandware.com/xml/impex/site/2006-10-31" site-id="{escaped_site_id}">\n'
        f"    <cartridges>{escaped_cartridges}</cartridges>\n"
        "</site>\n"
    )


def _parse_bm_cartridges_from_preferences_xml(xml: str) -> str:
    """Extracts the ``CustomCartridges`` preference value."""
    match = _PREFERENCE_RE.search(xml)
    return match.group(1).strip() if match else ""


def _parse_site_cartridges_from_descriptor_xml(xml: str) -> str:
    """Extracts the ``cartridges`` element value."""
    match = _CARTRIDGES_RE.search(xml)
    return match.group(1).strip() if match else ""


def _escape_xml(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _build_zip(files: dict[str, str]) -> bytes:
    """Builds an in-memory zip archive (JSZip equivalent) with the given ``path -> text`` entries."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for path, content in files.items():
            zip_file.writestr(path, content)
    return buffer.getvalue()


def _find_file_in_zip(zip_bytes: bytes, filename: str) -> str | None:
    """Finds the first non-directory entry whose path ends with ``/{filename}``."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zip_file:
        for name in zip_file.namelist():
            if not name.endswith("/") and name.endswith(f"/{filename}"):
                return zip_file.read(name).decode("utf-8")
    return None


__all__ = [
    "BM_SITE_ID",
    "AddCartridgeOptions",
    "CartridgePathResult",
    "CartridgeUpdateOptions",
    "add_cartridge",
    "get_cartridge_path",
    "remove_cartridge",
    "set_cartridge_path",
]
