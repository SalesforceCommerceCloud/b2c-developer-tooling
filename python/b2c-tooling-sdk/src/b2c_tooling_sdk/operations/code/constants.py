# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared timeout constants for code-deployment WebDAV operations.

Mirrors ``src/operations/code/constants.ts``.
"""

from __future__ import annotations

#: Timeout for long-running WebDAV operations (uploads of large cartridge archives).
LONG_OPERATION_TIMEOUT_SECONDS: float = 600.0

#: Timeout for the server-side UNZIP operation.
#:
#: Intentionally generous and, more importantly, **never retried on timeout**: if
#: the client gives up while the server is still extracting a large archive,
#: re-issuing UNZIP would race the still-in-progress extraction (partial files,
#: corrupted cartridges). A timeout here surfaces as a warning telling the
#: caller to verify the deployment manually rather than an automatic retry.
UNZIP_TIMEOUT_SECONDS: float = 300.0

__all__ = ["LONG_OPERATION_TIMEOUT_SECONDS", "UNZIP_TIMEOUT_SECONDS"]
