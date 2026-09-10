# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Redaction utilities for displaying resolved configuration.

Mirrors ``src/config/redaction.ts``. Used by any surface that shows resolved
config to a user or agent so masking behaviour stays consistent. Redaction is on
by default; callers may opt into unmasked output explicitly.
"""

from __future__ import annotations

import dataclasses
from typing import Any

from b2c_tooling_sdk.config.types import NormalizedConfig

#: NormalizedConfig fields whose values are secrets and are masked by default.
SENSITIVE_CONFIG_FIELDS: frozenset[str] = frozenset(
    {
        "certificate_passphrase",
        "client_secret",
        "jwt_passphrase",
        "mrt_api_key",
        "password",
        "slas_client_secret",
    }
)


def is_sensitive_config_field(field: str) -> bool:
    """Return True when a field name holds a secret that should be masked."""
    return field in SENSITIVE_CONFIG_FIELDS


def mask_config_value(value: str) -> str:
    """Mask a secret, showing the first 4 chars when long enough to aid identification.

    Matches the SDK logger convention (``<first4>...REDACTED``); values of 10 or
    fewer characters are fully redacted.
    """
    if len(value) > 10:
        return f"{value[:4]}...REDACTED"
    return "REDACTED"


def redact_config_values(values: NormalizedConfig, *, unmask: bool = False) -> dict[str, Any]:
    """Return a dict of config values with sensitive fields masked.

    Fields whose value is ``None`` are omitted. When ``unmask`` is True secrets
    are shown verbatim.
    """
    output: dict[str, Any] = {}
    for f in dataclasses.fields(values):
        value = getattr(values, f.name)
        if value is None:
            continue
        if not unmask and is_sensitive_config_field(f.name):
            output[f.name] = mask_config_value(str(value))
        else:
            output[f.name] = value
    return output


__all__ = [
    "SENSITIVE_CONFIG_FIELDS",
    "is_sensitive_config_field",
    "mask_config_value",
    "redact_config_values",
]
