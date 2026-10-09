# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI implementation of the catalogs backend.

Mirrors ``src/operations/catalogs/ocapi-catalogs-backend.ts``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal

from b2c_tooling_sdk.clients.error_utils import throw_ocapi_error
from b2c_tooling_sdk.operations.catalogs.catalogs_types import CatalogInfo, ListCatalogsOptions

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

_PAGE_SIZE = 200
_SCAPI_CATALOG_SCOPES = ["sfcc.catalogs.rw", "sfcc.catalogs"]


class OcapiCatalogsBackend:
    """Lists catalogs against the legacy OCAPI Data API ``/catalogs`` resource."""

    def __init__(self, instance: B2CInstance) -> None:
        self._instance = instance

    @property
    def name(self) -> Literal["ocapi"]:
        return "ocapi"

    async def list_catalogs(self, options: ListCatalogsOptions | None = None) -> list[CatalogInfo]:
        opts = options or ListCatalogsOptions()
        start = opts.start if opts.start is not None else 0
        target = opts.count
        catalogs: list[CatalogInfo] = []
        offset = start

        while target is None or len(catalogs) < target:
            count = _PAGE_SIZE if target is None else min(_PAGE_SIZE, target - len(catalogs))
            result = await self._instance.ocapi.get(
                "/catalogs",
                {"params": {"query": {"start": offset, "count": count, "select": "(**)"}}},
            )
            if result.error or result.data is None:
                assert result.response is not None
                throw_ocapi_error(result.error, result.response, "Failed to list catalogs", _SCAPI_CATALOG_SCOPES)

            data: dict[str, Any] = result.data
            page: list[dict[str, Any]] = data.get("data") or []
            for catalog in page:
                name_field = catalog.get("name")
                catalogs.append(
                    CatalogInfo(
                        id=catalog.get("id") or "",
                        name=name_field.get("default") if isinstance(name_field, dict) else None,
                        online=catalog.get("online"),
                        raw=catalog,
                    )
                )
            offset += len(page)
            total = data.get("total")
            if len(page) == 0 or offset >= (total if total is not None else offset):
                break

        return catalogs


__all__ = ["OcapiCatalogsBackend"]
