# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Discovery of exportable data units on a B2C Commerce instance.

Mirrors ``src/operations/jobs/discover.ts``. Lists the IDs that can be selected
when building an export configuration for a site archive export - sites,
catalogs, and inventory lists. Categories without a list-all OCAPI endpoint
(libraries, customer lists, price books) are not discoverable and must be
entered by ID.

Cross-module note: this module needs the sites and catalogs backends, which in
turn (via ``operations.sites.cartridges``) may reach back into
``operations.jobs.site_archive``. To keep import order acyclic and tests
hermetic, the backend factories are reached through the module-local
:func:`_create_sites_backend` / :func:`_create_catalogs_backend` indirections
(deferred imports) rather than top-level imports; tests can monkeypatch them.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from b2c_tooling_sdk.clients.scapi_backend_utils import assert_ocapi_compatibility_allowed
from b2c_tooling_sdk.logging import get_logger

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance


@dataclass
class ExportableUnits:
    """IDs discovered on an instance, grouped by data-unit category.

    Each list is sorted alphabetically. A category that could not be read (e.g.
    missing OCAPI permission) is returned as an empty list with a matching entry
    in :attr:`warnings`.
    """

    #: Site IDs (from ``GET /sites``).
    sites: list[str] = field(default_factory=list)
    #: Catalog IDs (from ``GET /catalogs``).
    catalogs: list[str] = field(default_factory=list)
    #: Inventory list IDs (from ``GET /inventory_lists``).
    inventory_lists: list[str] = field(default_factory=list)
    #: Per-category warnings for endpoints that failed (e.g. permission denied).
    warnings: list[str] = field(default_factory=list)


#: Page size for paginated list endpoints (OCAPI default is 25).
PAGE_COUNT = 200


def _create_sites_backend(instance: B2CInstance) -> Any:
    """Deferred-import indirection for the Sites backend (breaks the jobs<->sites cycle)."""
    from b2c_tooling_sdk.operations.sites import (  # noqa: PLC0415
        SitesBackendConfig,
        create_sites_backend,
    )

    return create_sites_backend(SitesBackendConfig(instance=instance))


def _create_catalogs_backend(instance: B2CInstance) -> Any:
    """Deferred-import indirection for the Catalogs backend."""
    from b2c_tooling_sdk.operations.catalogs import (  # noqa: PLC0415
        CatalogsBackendConfig,
        create_catalogs_backend,
    )

    return create_catalogs_backend(CatalogsBackendConfig(instance=instance))


async def _list_inventory_list_ids(instance: B2CInstance) -> list[str]:
    """List inventory list IDs through the paginated OCAPI collection, following
    ``start``/``count`` until all documents are read."""
    assert_ocapi_compatibility_allowed(instance.api_backend, "inventory-list enumeration")
    ids: list[str] = []
    start = 0

    # OCAPI collections page via start/count; `total` reports the full size.
    while True:
        result = await instance.ocapi.get(
            "/inventory_lists",
            {"params": {"query": {"start": start, "count": PAGE_COUNT}}},
        )
        data, error = result.data, result.error

        if error or not data:
            fault = error.get("fault") if isinstance(error, dict) else None
            message = fault.get("message") if isinstance(fault, dict) else None
            raise RuntimeError(message or "Failed to list inventory lists")

        for item in data.get("data") or []:
            if item.get("id"):
                ids.append(item["id"])

        total = data.get("total")
        if total is None:
            total = len(ids)
        start += PAGE_COUNT
        if start >= total or not (data.get("data") or []):
            break

    return ids


async def discover_exportable_units(instance: B2CInstance) -> ExportableUnits:
    """Discover the data units that can be exported from an instance.

    Each category is read independently: a failure in one records a warning and
    leaves that list empty rather than failing the whole discovery.

    :param instance: B2C instance to query.
    :returns: Discovered IDs grouped by category, with per-category warnings.
    """
    logger = get_logger()
    result = ExportableUnits()

    async def discover_sites() -> None:
        try:
            sites = await _create_sites_backend(instance).list_sites()
            result.sites = sorted(site.id for site in sites if site.id)
        except Exception as err:  # noqa: BLE001 - recorded as a per-category warning
            logger.debug("Failed to discover sites: %s", err)
            result.warnings.append(f"Could not list sites: {err}")

    async def discover_catalogs() -> None:
        try:
            catalogs = await _create_catalogs_backend(instance).list_catalogs()
            result.catalogs = sorted(catalog.id for catalog in catalogs)
        except Exception as err:  # noqa: BLE001 - recorded as a per-category warning
            logger.debug("Failed to discover catalogs: %s", err)
            result.warnings.append(f"Could not list catalogs: {err}")

    async def discover_inventory_lists() -> None:
        try:
            result.inventory_lists = sorted(await _list_inventory_list_ids(instance))
        except Exception as err:  # noqa: BLE001 - recorded as a per-category warning
            logger.debug("Failed to discover inventory lists: %s", err)
            result.warnings.append(f"Could not list inventory lists: {err}")

    await asyncio.gather(discover_sites(), discover_catalogs(), discover_inventory_lists())

    return result


__all__ = ["PAGE_COUNT", "ExportableUnits", "discover_exportable_units"]
