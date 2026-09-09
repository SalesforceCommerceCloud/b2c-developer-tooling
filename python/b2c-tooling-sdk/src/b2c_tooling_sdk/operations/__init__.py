# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Higher-level operations for B2C Commerce.

Mirrors the ``operations`` subtree of the TypeScript SDK. Each subpackage
(``code``, ``jobs``, ``sites``, ``catalogs``, ``bm_users``, ``bm_roles``,
``users``, ``roles``, ``orgs``, ``ods``, ``metrics``, ``logs``) provides
task-oriented functions built on top of the typed clients in
:mod:`b2c_tooling_sdk.clients`. Operations inspect :class:`ClientResult` values
and raise typed exceptions on error (mirroring the TS ``if (error || !data) throw``
convention).

Import subpackages directly, e.g. ``from b2c_tooling_sdk.operations.code import
find_cartridges``.
"""

from __future__ import annotations
