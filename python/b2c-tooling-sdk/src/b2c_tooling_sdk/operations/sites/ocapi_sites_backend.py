# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI implementation of the sites backend (legacy/fallback).

Mirrors ``src/operations/sites/ocapi-sites-backend.ts``. Reads sites and
per-site detail via the OCAPI Data API ``/sites`` resource.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal

from b2c_tooling_sdk.clients.error_utils import throw_ocapi_error
from b2c_tooling_sdk.operations.sites.sites_scopes import SCAPI_SITES_READ_AND_RW_SCOPES
from b2c_tooling_sdk.operations.sites.sites_types import CartridgePosition, ListSitesOptions, SiteInfo

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance


def _map_ocapi_site(ocapi_site: dict[str, Any]) -> SiteInfo:
    site_id = ocapi_site.get("id") or ""
    display_name_field = ocapi_site.get("display_name")
    display_name = (display_name_field.get("default") if isinstance(display_name_field, dict) else None) or site_id
    return SiteInfo(
        id=site_id,
        display_name=display_name,
        storefront_status=ocapi_site.get("storefront_status"),
        cartridges=ocapi_site.get("cartridges"),
        raw=ocapi_site,
    )


class OcapiSitesBackend:
    """OCAPI Sites backend (legacy/fallback). Reads sites and per-site detail via
    the OCAPI Data API ``/sites`` resource.
    """

    def __init__(self, instance: B2CInstance) -> None:
        self._instance = instance

    @property
    def name(self) -> Literal["ocapi"]:
        return "ocapi"

    async def list_sites(self, options: ListSitesOptions | None = None) -> list[SiteInfo]:
        opts = options or ListSitesOptions()

        # When the caller bounds the result (start/count), honor it as a single
        # page. Otherwise page through the whole collection so callers that need
        # *all* sites (export-unit discovery, CAP feature listing) don't silently
        # truncate at the OCAPI default page size.
        if opts.start is not None or opts.count is not None:
            return await self._fetch_site_page(opts.start, opts.count)

        all_sites: list[SiteInfo] = []
        page_size = 200
        start = 0
        while True:
            sites, total = await self._fetch_site_page_with_total(start, page_size)
            all_sites.extend(sites)
            start += page_size
            if len(sites) == 0 or start >= total:
                break
        return all_sites

    async def _fetch_site_page(self, start: int | None, count: int | None) -> list[SiteInfo]:
        sites, _ = await self._fetch_site_page_with_total(start, count)
        return sites

    async def _fetch_site_page_with_total(self, start: int | None, count: int | None) -> tuple[list[SiteInfo], int]:
        result = await self._instance.ocapi.get(
            "/sites",
            {"params": {"query": {"start": start, "count": count, "select": "(**)"}}},
        )
        if result.error or result.data is None:
            assert result.response is not None
            throw_ocapi_error(result.error, result.response, "Failed to list sites", SCAPI_SITES_READ_AND_RW_SCOPES)

        body: dict[str, Any] = result.data
        sites = [_map_ocapi_site(item) for item in body.get("data") or []]
        total = body.get("total", (start or 0) + len(sites))
        return sites, total

    async def get_site(self, site_id: str) -> SiteInfo:
        result = await self._instance.ocapi.get("/sites/{site_id}", {"params": {"path": {"site_id": site_id}}})
        if result.error or result.data is None:
            assert result.response is not None
            throw_ocapi_error(
                result.error, result.response, f"Failed to get site {site_id}", SCAPI_SITES_READ_AND_RW_SCOPES
            )
        return _map_ocapi_site(result.data)

    async def get_cartridge_path(self, site_id: str) -> str:
        return (await self.get_site(site_id)).cartridges or ""

    async def set_cartridge_path(self, site_id: str, cartridges: str) -> str:
        result = await self._instance.ocapi.put(
            "/sites/{site_id}/cartridges",
            {"params": {"path": {"site_id": site_id}}, "body": {"cartridges": cartridges}},
        )
        if result.error or result.data is None:
            assert result.response is not None
            throw_ocapi_error(
                result.error,
                result.response,
                f"Failed to set cartridge path for site {site_id}",
                SCAPI_SITES_READ_AND_RW_SCOPES,
            )
        data: dict[str, Any] = result.data
        return data.get("cartridges") or cartridges

    async def add_cartridge(
        self, site_id: str, name: str, position: CartridgePosition, target: str | None = None
    ) -> str:
        result = await self._instance.ocapi.post(
            "/sites/{site_id}/cartridges",
            {"params": {"path": {"site_id": site_id}}, "body": {"name": name, "position": position, "target": target}},
        )
        if result.error or result.data is None:
            assert result.response is not None
            throw_ocapi_error(
                result.error,
                result.response,
                f"Failed to add cartridge {name} to site {site_id}",
                SCAPI_SITES_READ_AND_RW_SCOPES,
            )
        data: dict[str, Any] = result.data
        return data.get("cartridges") or ""

    async def remove_cartridge(self, site_id: str, name: str) -> str:
        result = await self._instance.ocapi.delete(
            "/sites/{site_id}/cartridges/{cartridge_name}",
            {"params": {"path": {"site_id": site_id, "cartridge_name": name}}},
        )
        if result.error or result.data is None:
            assert result.response is not None
            throw_ocapi_error(
                result.error,
                result.response,
                f"Failed to remove cartridge {name} from site {site_id}",
                SCAPI_SITES_READ_AND_RW_SCOPES,
            )
        data: dict[str, Any] = result.data
        return data.get("cartridges") or ""


__all__ = ["OcapiSitesBackend"]
