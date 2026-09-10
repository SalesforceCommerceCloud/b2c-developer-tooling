# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Shared helpers used by ``operations`` subpackages.

Mirrors ``src/operations/util`` in the TypeScript SDK.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.util.zip import add_directory_to_zip

__all__ = ["add_directory_to_zip"]
