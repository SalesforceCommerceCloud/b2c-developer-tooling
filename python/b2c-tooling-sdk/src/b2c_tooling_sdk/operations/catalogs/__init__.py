# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI-first catalog operations with transitional OCAPI fallback.

Mirrors ``src/operations/catalogs/index.ts``.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.catalogs.catalogs_backend import CatalogsBackendConfig, create_catalogs_backend
from b2c_tooling_sdk.operations.catalogs.catalogs_types import CatalogInfo, CatalogsBackend, ListCatalogsOptions
from b2c_tooling_sdk.operations.catalogs.ocapi_catalogs_backend import OcapiCatalogsBackend
from b2c_tooling_sdk.operations.catalogs.scapi_catalogs_backend import ScapiCatalogsBackend, ScapiCatalogsBackendConfig

__all__ = [
    "CatalogInfo",
    "CatalogsBackend",
    "CatalogsBackendConfig",
    "ListCatalogsOptions",
    "OcapiCatalogsBackend",
    "ScapiCatalogsBackend",
    "ScapiCatalogsBackendConfig",
    "create_catalogs_backend",
]
