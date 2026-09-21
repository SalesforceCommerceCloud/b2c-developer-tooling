# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI Sites scopes named in OCAPI-deprecation error messages.

Mirrors ``src/operations/sites/sites-scopes.ts``. Derived from the canonical
cascade so they can't drift. The union covers read-only and read-write
operations.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients.scapi_sites import SCAPI_SITES_CASCADE

#: Distinct sites read scopes (e.g. ``["sfcc.sites.rw", "sfcc.sites"]``).
SCAPI_SITES_READ_AND_RW_SCOPES: list[str] = list(
    dict.fromkeys(scope for tier in SCAPI_SITES_CASCADE.read for scope in tier)
)

__all__ = ["SCAPI_SITES_READ_AND_RW_SCOPES"]
