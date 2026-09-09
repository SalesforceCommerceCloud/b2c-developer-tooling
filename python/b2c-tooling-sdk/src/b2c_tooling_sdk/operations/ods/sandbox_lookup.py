# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Sandbox ID lookup utilities for resolving friendly sandbox identifiers.

Mirrors ``src/operations/ods/sandbox-lookup.ts``.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from b2c_tooling_sdk.clients import OdsClient

#: UUID regex pattern (standard 8-4-4-4-12 format).
_UUID_REGEX = re.compile(r"^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$", re.IGNORECASE)

#: Friendly sandbox ID pattern: realm-instance or realm_instance
#: - realm: 4 alphanumeric characters
#: - separator: dash or underscore
#: - instance: 1+ alphanumeric characters
_FRIENDLY_ID_REGEX = re.compile(r"^([a-z\d]{4})[-_]([a-z\d]+)$", re.IGNORECASE)

#: Prefix used in organization ID format (e.g., f_ecom_zzpq_013).
_ECOM_PREFIX = "f_ecom_"


def _normalize_identifier(value: str) -> str:
    """Strip the ``f_ecom_`` prefix if present."""
    if value.lower().startswith(_ECOM_PREFIX):
        return value[len(_ECOM_PREFIX) :]
    return value


class SandboxNotFoundError(Exception):
    """Raised when a sandbox cannot be found by its friendly identifier."""

    def __init__(self, identifier: str, realm: str | None = None, instance: str | None = None) -> None:
        if realm and instance:
            message = f"Sandbox not found: {identifier} (realm={realm}, instance={instance})"
        else:
            message = f"Sandbox not found: {identifier}"
        super().__init__(message)
        self.name = "SandboxNotFoundError"
        self.identifier = identifier
        self.realm = realm
        self.instance = instance


def is_uuid(value: str) -> bool:
    """Check if a string is a valid UUID.

    :param value: The string to check.
    :returns: ``True`` if the value is a valid UUID.
    """
    return bool(_UUID_REGEX.match(value))


def is_friendly_sandbox_id(value: str) -> bool:
    """Check if a string matches the friendly sandbox ID format (realm-instance or realm_instance).

    :param value: The string to check.
    :returns: ``True`` if the value matches the friendly format.
    """
    return bool(_FRIENDLY_ID_REGEX.match(_normalize_identifier(value)))


@dataclass
class ParsedFriendlySandboxId:
    """Realm/instance components parsed from a friendly sandbox ID."""

    realm: str
    instance: str


def parse_friendly_sandbox_id(value: str) -> ParsedFriendlySandboxId | None:
    """Parse a friendly sandbox ID into its realm and instance components.

    :param value: The friendly ID to parse (e.g., ``"abcd-123"`` or ``"abcd_123"``).
    :returns: The parsed realm/instance, or ``None`` if not a valid friendly ID.
    """
    normalized = _normalize_identifier(value)
    match = _FRIENDLY_ID_REGEX.match(normalized)
    if not match:
        return None
    return ParsedFriendlySandboxId(realm=match.group(1).lower(), instance=match.group(2).lower())


async def resolve_sandbox_id(client: OdsClient, identifier: str) -> str:
    """Resolve a sandbox identifier to a UUID.

    If the identifier is already a UUID, it is returned directly without making an
    API call. If the identifier is a friendly format (realm-instance), it queries
    the ODS API to find the matching sandbox and returns its UUID.

    :param client: The ODS API client.
    :param identifier: Sandbox identifier (UUID or friendly format like ``"abcd-123"``).
    :returns: The sandbox UUID.
    :raises SandboxNotFoundError: If the sandbox cannot be found.

    :example:
        >>> # UUID is returned directly
        >>> await resolve_sandbox_id(client, "abc12345-1234-1234-1234-abc123456789")
        'abc12345-1234-1234-1234-abc123456789'
        >>> # Friendly ID is looked up
        >>> await resolve_sandbox_id(client, "zzzv-123")
        'abc12345-1234-1234-1234-abc123456789'  # actual UUID from API
    """
    # If already a UUID, return directly.
    if is_uuid(identifier):
        return identifier

    # Try to parse as friendly ID.
    parsed = parse_friendly_sandbox_id(identifier)
    if parsed is None:
        # Not a UUID and not a friendly ID - treat as UUID and let API return 404.
        return identifier

    # Query sandboxes filtered by realm.
    result = await client.get("/sandboxes", {"params": {"query": {"filter_params": f"realm={parsed.realm}"}}})

    sandboxes = result.data.get("data") if isinstance(result.data, dict) else None
    if result.error or not sandboxes:
        raise SandboxNotFoundError(identifier, parsed.realm, parsed.instance)

    # Find sandbox with matching instance.
    sandbox = next(
        (
            candidate
            for candidate in sandboxes
            if isinstance(candidate, dict) and (candidate.get("instance") or "").lower() == parsed.instance
        ),
        None,
    )
    sandbox_id = sandbox.get("id") if sandbox else None

    if not sandbox_id:
        raise SandboxNotFoundError(identifier, parsed.realm, parsed.instance)

    return str(sandbox_id)


__all__ = [
    "ParsedFriendlySandboxId",
    "SandboxNotFoundError",
    "is_friendly_sandbox_id",
    "is_uuid",
    "parse_friendly_sandbox_id",
    "resolve_sandbox_id",
]
