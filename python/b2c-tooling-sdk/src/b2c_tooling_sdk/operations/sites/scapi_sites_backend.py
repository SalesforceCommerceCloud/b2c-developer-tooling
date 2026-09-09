# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI implementation of the sites backend.

Mirrors ``src/operations/sites/scapi-sites-backend.ts``. Reads sites and
manages custom cartridge paths via the ``site/sites/v1`` Admin API.
"""

from __future__ import annotations

import asyncio
from typing import Any, Literal

from b2c_tooling_sdk.clients.custom_apis import to_organization_id
from b2c_tooling_sdk.clients.dual_backend_factory import ScapiBackendCtorConfig
from b2c_tooling_sdk.clients.middleware import SCOPE_MODE_HEADER
from b2c_tooling_sdk.clients.scapi_backend_utils import create_scapi_request_error
from b2c_tooling_sdk.clients.scapi_sites import (
    ScapiSitesClient,
    ScapiSitesClientConfig,
    create_scapi_sites_client,
)
from b2c_tooling_sdk.operations.sites.sites_types import CartridgePosition, ListSitesOptions, SiteInfo

_READ_HEADERS = {SCOPE_MODE_HEADER: "read"}
_WRITE_HEADERS = {SCOPE_MODE_HEADER: "write"}

#: SCAPI ``getSites`` caps ``limit`` at 50 (spec ``site-sites-v1.yaml``).
_SCAPI_SITES_MAX_PAGE = 50

#: Concurrency for per-site detail enrichment; bounds rate-limit pressure.
_ENRICH_CONCURRENCY = 5

#: Configuration for :class:`ScapiSitesBackend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.ScapiBackendCtorConfig`
#: (``short_code``, ``tenant_id``, ``auth``, ``instance``).
ScapiSitesBackendConfig = ScapiBackendCtorConfig


def _default_locale_value(value_map: dict[str, str] | None) -> str | None:
    """Prefer the ``default`` locale, else the first available localized value."""
    if not value_map:
        return None
    if "default" in value_map:
        return value_map["default"]
    values = list(value_map.values())
    return values[0] if values else None


def _map_scapi_site(scapi_site: dict[str, Any]) -> SiteInfo:
    site_id = scapi_site.get("id", "")
    return SiteInfo(
        id=site_id,
        display_name=_default_locale_value(scapi_site.get("displayName")) or site_id,
        storefront_status=scapi_site.get("storefrontStatus"),
        cartridges=scapi_site.get("cartridges"),
        raw=scapi_site,
    )


class ScapiSitesBackend:
    """SCAPI Sites backend. Reads sites and manages custom cartridge paths via the
    ``site/sites/v1`` Admin API.
    """

    def __init__(self, config: ScapiSitesBackendConfig) -> None:
        self._organization_id = to_organization_id(config.tenant_id)
        client_config = ScapiSitesClientConfig(short_code=config.short_code, tenant_id=config.tenant_id)
        self._client: ScapiSitesClient = create_scapi_sites_client(client_config, config.auth)

    @property
    def name(self) -> Literal["scapi"]:
        return "scapi"

    async def list_sites(self, options: ListSitesOptions | None = None) -> list[SiteInfo]:
        # Page through `getSites` on the server (limit capped at 50) rather than
        # relying on the default single 25-item page — otherwise instances with
        # more than 25 sites silently lose the rest. The caller's start/count map
        # to SCAPI offset/limit.
        opts = options or ListSitesOptions()
        raw_sites = await self._fetch_site_page(opts)

        # `getSites` returns items that carry only the id (display name, storefront
        # status, and cartridges live on the per-site detail endpoint). Enrich any
        # sparse item via `getSite`, with bounded concurrency to limit rate-limit
        # pressure. Items that already arrive rich (future-proofing if the platform
        # starts populating list fields) are mapped directly with no extra call.
        return await self._enrich_sites(raw_sites)

    async def _fetch_site_page(self, options: ListSitesOptions) -> list[dict[str, Any]]:
        """Fetches the requested window of sites, paginating across 50-item SCAPI
        pages. ``start`` is the offset into the full result set; ``count`` bounds
        how many are returned (unbounded when omitted).
        """
        start_offset = options.start if options.start is not None else 0
        target = options.count  # None -> all remaining
        collected: list[dict[str, Any]] = []
        offset = start_offset

        while True:
            remaining = _SCAPI_SITES_MAX_PAGE if target is None else target - len(collected)
            if remaining <= 0:
                break
            limit = min(_SCAPI_SITES_MAX_PAGE, remaining)

            result = await self._client.get(
                "/organizations/{organizationId}/sites",
                {
                    "params": {
                        "path": {"organizationId": self._organization_id},
                        "query": {"limit": limit, "offset": offset},
                    },
                    "headers": _READ_HEADERS,
                },
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, "Failed to list sites")

            page: dict[str, Any] = result.data
            items: list[dict[str, Any]] = page.get("data") or []
            collected.extend(items)
            offset += len(items)

            # Stop when the server has no more items, or we've reached the reported
            # total, or the page came back short (defensive against a missing total).
            total = page.get("total", start_offset + len(collected))
            if len(items) == 0 or offset >= total:
                break

        return collected

    async def _map_one(self, site: dict[str, Any]) -> SiteInfo:
        # If the list item is already rich, avoid the extra detail call.
        if site.get("displayName") is not None or site.get("storefrontStatus") is not None:
            return _map_scapi_site(site)
        site_id = site.get("id")
        return await self.get_site(site_id) if site_id else _map_scapi_site(site)

    async def _enrich_sites(self, sites: list[dict[str, Any]]) -> list[SiteInfo]:
        """Maps sites, fetching per-site detail (bounded concurrency) for sparse items."""
        results: list[SiteInfo] = []
        for i in range(0, len(sites), _ENRICH_CONCURRENCY):
            batch = sites[i : i + _ENRICH_CONCURRENCY]
            mapped = await asyncio.gather(*(self._map_one(site) for site in batch))
            results.extend(mapped)
        return results

    async def get_site(self, site_id: str) -> SiteInfo:
        result = await self._client.get(
            "/organizations/{organizationId}/sites/{siteId}",
            {
                "params": {"path": {"organizationId": self._organization_id, "siteId": site_id}},
                "headers": _READ_HEADERS,
            },
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(result.error, result.response, f"Failed to get site {site_id}")
        return _map_scapi_site(result.data)

    async def get_cartridge_path(self, site_id: str) -> str:
        result = await self._client.get(
            "/organizations/{organizationId}/sites/{siteId}/custom-cartridges",
            {
                "params": {"path": {"organizationId": self._organization_id, "siteId": site_id}},
                "headers": _READ_HEADERS,
            },
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to get cartridge path for site {site_id}"
            )
        data: dict[str, Any] = result.data
        return str(data["customCartridges"])

    async def set_cartridge_path(self, site_id: str, cartridges: str) -> str:
        result = await self._client.put(
            "/organizations/{organizationId}/sites/{siteId}/custom-cartridges",
            {
                "params": {"path": {"organizationId": self._organization_id, "siteId": site_id}},
                "headers": _WRITE_HEADERS,
                "body": {"customCartridges": cartridges},
            },
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(
                result.error, result.response, f"Failed to set cartridge path for site {site_id}"
            )
        data: dict[str, Any] = result.data
        return str(data["customCartridges"])

    async def add_cartridge(
        self, site_id: str, name: str, position: CartridgePosition, target: str | None = None
    ) -> str:
        current = await self.get_cartridge_path(site_id)
        cartridges = current.split(":") if current else []
        if name in cartridges:
            raise RuntimeError(f'Cartridge "{name}" already exists in the cartridge path for site "{site_id}"')
        _insert_cartridge(cartridges, name, position, target)
        return await self.set_cartridge_path(site_id, ":".join(cartridges))

    async def remove_cartridge(self, site_id: str, name: str) -> str:
        current = await self.get_cartridge_path(site_id)
        cartridges = current.split(":") if current else []
        if name not in cartridges:
            raise RuntimeError(f'Cartridge "{name}" not found in the cartridge path for site "{site_id}"')
        cartridges.remove(name)
        return await self.set_cartridge_path(site_id, ":".join(cartridges))


def _insert_cartridge(cartridges: list[str], name: str, position: CartridgePosition, target: str | None) -> None:
    if position == "first":
        cartridges.insert(0, name)
        return
    if position == "last":
        cartridges.append(name)
        return
    if not target:
        raise RuntimeError(f'Target cartridge is required for position "{position}"')
    if target not in cartridges:
        raise RuntimeError(f'Target cartridge "{target}" not found in cartridge path')
    target_index = cartridges.index(target)
    cartridges.insert(target_index if position == "before" else target_index + 1, name)


__all__ = ["ScapiSitesBackend", "ScapiSitesBackendConfig"]
