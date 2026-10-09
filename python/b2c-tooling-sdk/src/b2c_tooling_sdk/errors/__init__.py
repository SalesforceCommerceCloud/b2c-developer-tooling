# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Error types for B2C tooling operations."""

from __future__ import annotations

from b2c_tooling_sdk.errors.http_error import HttpError
from b2c_tooling_sdk.errors.network_error import (
    NetworkError,
    NetworkErrorKind,
    classify_network_error,
    describe_network_error_kind,
    is_network_error,
    wrap_network_error,
)

__all__ = [
    "HttpError",
    "NetworkError",
    "NetworkErrorKind",
    "classify_network_error",
    "describe_network_error_kind",
    "is_network_error",
    "wrap_network_error",
]
