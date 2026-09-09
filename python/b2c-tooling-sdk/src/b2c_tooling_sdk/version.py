# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SDK version information and User-Agent string."""

from __future__ import annotations

from importlib import metadata

#: The SDK distribution name.
SDK_NAME = "salesforce-b2c-tooling-sdk"

try:
    #: The SDK package version (read from installed distribution metadata).
    SDK_VERSION = metadata.version(SDK_NAME)
except metadata.PackageNotFoundError:  # pragma: no cover - source checkout without install
    SDK_VERSION = "0.3.0"

#: Default User-Agent string for the SDK, e.g. ``b2c-tooling-sdk-python/0.1.0``.
SDK_USER_AGENT = f"b2c-tooling-sdk-python/{SDK_VERSION}"
