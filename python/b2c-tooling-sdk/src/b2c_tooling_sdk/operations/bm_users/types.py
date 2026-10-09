# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Canonical types and backend interface for Business Manager user operations.

Mirrors ``src/operations/bm-users/types.ts``. Both the OCAPI Data API
(``/users``) and the SCAPI Merchant Users API (``merchant/users/v1``) manage
instance-level users on a B2C Commerce instance. We expose a single canonical
shape (camelCase field names, matching SCAPI -- expressed here as Python
``snake_case`` attributes) so command code is agnostic to which backend serves
the request.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Protocol, runtime_checkable

from b2c_tooling_sdk.clients.scapi_backend_utils import BackendBase


@dataclass
class UserInfo:
    """Canonical Business Manager user.

    Field names match SCAPI (camelCase in TS, snake_case here); the OCAPI
    backend maps from OCAPI's own snake_case wire shape.
    """

    login: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    external_id: str | None = None
    disabled: bool | None = None
    locked: bool | None = None
    last_login_date: str | None = None
    password_expiration_date: str | None = None
    password_modification_date: str | None = None
    preferred_data_locale: str | None = None
    preferred_ui_locale: str | None = None
    roles: list[str] | None = None
    #: Original backend response, for advanced consumers. Mirrors TS's ``_raw``.
    raw: Any = None


@dataclass
class UpdateUserChanges:
    """Patch fields. SCAPI uses camelCase; the OCAPI backend translates to snake_case."""

    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    external_id: str | None = None
    disabled: bool | None = None
    preferred_data_locale: str | None = None
    preferred_ui_locale: str | None = None


@dataclass
class ListUsersResult:
    """Result of listing users -- paginated."""

    total: int
    start: int
    count: int
    hits: list[UserInfo] = field(default_factory=list)


@dataclass
class ListUsersOptions:
    """Options for :meth:`UsersBackend.list_users`."""

    start: int | None = None
    count: int | None = None


@dataclass
class SearchUsersOptions(ListUsersOptions):
    """Portable user search criteria supported by both backends."""

    #: Raw OCAPI query. In auto mode this deliberately selects the OCAPI fallback.
    query: Any = None
    search_phrase: str | None = None
    login: str | None = None
    email: str | None = None
    locked: bool | None = None
    disabled: bool | None = None
    sort_by: str | None = None
    sort_order: Literal["asc", "desc"] | None = None


@dataclass
class CreateUserInput:
    """Body for create/replace (PUT). ``login`` and ``email`` are required."""

    login: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    external_id: str | None = None
    password: str | None = None
    disabled: bool | None = None
    preferred_data_locale: str | None = None
    preferred_ui_locale: str | None = None
    roles: list[str] | None = None


@runtime_checkable
class UsersBackend(BackendBase, Protocol):
    """Backend contract for BM user operations.

    Merchant Users has no server-side search endpoint, so the SCAPI backend
    implements portable search criteria over its paginated user listing. Raw
    OCAPI query DSL, access keys, and ``whoami`` remain OCAPI-only.
    """

    async def list_users(self, options: ListUsersOptions | None = None) -> ListUsersResult:
        """List users, paginated."""
        ...

    async def search_users(self, options: SearchUsersOptions | None = None) -> ListUsersResult:
        """Search users using portable criteria."""
        ...

    async def get_user(self, login: str) -> UserInfo:
        """Get a single user by login."""
        ...

    async def create_or_replace_user(self, login: str, input: CreateUserInput) -> UserInfo:
        """Create or fully replace a user."""
        ...

    async def update_user(self, login: str, changes: UpdateUserChanges) -> UserInfo:
        """Update fields on an existing user."""
        ...

    async def delete_user(self, login: str) -> None:
        """Delete a user."""
        ...


__all__ = [
    "CreateUserInput",
    "ListUsersOptions",
    "ListUsersResult",
    "SearchUsersOptions",
    "UpdateUserChanges",
    "UserInfo",
    "UsersBackend",
]
