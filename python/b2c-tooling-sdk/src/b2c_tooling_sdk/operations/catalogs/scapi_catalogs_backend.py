# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI implementation of the catalogs backend.

Mirrors ``src/operations/catalogs/scapi-catalogs-backend.ts``.
"""

from __future__ import annotations

from typing import Any, Literal

from b2c_tooling_sdk.clients.custom_apis import to_organization_id
from b2c_tooling_sdk.clients.dual_backend_factory import ScapiBackendCtorConfig
from b2c_tooling_sdk.clients.middleware import SCOPE_MODE_HEADER
from b2c_tooling_sdk.clients.scapi_backend_utils import create_scapi_request_error
from b2c_tooling_sdk.clients.scapi_catalogs import (
    ScapiCatalogsClient,
    ScapiCatalogsClientConfig,
    create_scapi_catalogs_client,
)
from b2c_tooling_sdk.operations.catalogs.catalogs_types import CatalogInfo, ListCatalogsOptions

_MAX_PAGE = 50
_READ_HEADERS = {SCOPE_MODE_HEADER: "read"}

#: Configuration for :class:`ScapiCatalogsBackend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.ScapiBackendCtorConfig`
#: (``short_code``, ``tenant_id``, ``auth``, ``instance``).
ScapiCatalogsBackendConfig = ScapiBackendCtorConfig


class ScapiCatalogsBackend:
    """Lists catalogs against the SCAPI Catalogs Admin API."""

    def __init__(self, config: ScapiCatalogsBackendConfig) -> None:
        self._organization_id = to_organization_id(config.tenant_id)
        client_config = ScapiCatalogsClientConfig(short_code=config.short_code, tenant_id=config.tenant_id)
        self._client: ScapiCatalogsClient = create_scapi_catalogs_client(client_config, config.auth)

    @property
    def name(self) -> Literal["scapi"]:
        return "scapi"

    async def list_catalogs(self, options: ListCatalogsOptions | None = None) -> list[CatalogInfo]:
        opts = options or ListCatalogsOptions()
        start = opts.start if opts.start is not None else 0
        target = opts.count
        catalogs: list[dict[str, Any]] = []
        offset = start

        while target is None or len(catalogs) < target:
            limit = _MAX_PAGE if target is None else min(_MAX_PAGE, target - len(catalogs))
            result = await self._client.get(
                "/organizations/{organizationId}/catalogs",
                {
                    "params": {
                        "path": {"organizationId": self._organization_id},
                        "query": {"limit": limit, "offset": offset},
                    },
                    "headers": _READ_HEADERS,
                },
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, "Failed to list catalogs")

            data: dict[str, Any] = result.data
            page: list[dict[str, Any]] = data.get("data") or []
            catalogs.extend(page)
            offset += len(page)
            if len(page) == 0 or offset >= data.get("total", offset):
                break

        return [
            CatalogInfo(
                id=catalog.get("id", ""),
                name=_localized_name(catalog.get("name")),
                online=catalog.get("online"),
                raw=catalog,
            )
            for catalog in catalogs
        ]


def _localized_name(name: dict[str, str] | None) -> str | None:
    """Prefer the ``default`` locale, else the first available localized value."""
    if not name:
        return None
    if "default" in name:
        return name["default"]
    values = list(name.values())
    return values[0] if values else None


__all__ = ["ScapiCatalogsBackend", "ScapiCatalogsBackendConfig"]
