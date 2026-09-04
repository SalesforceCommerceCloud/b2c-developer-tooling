# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Account Manager user management operations.

Mirrors ``src/operations/users/index.ts``. Provides high-level functions for
managing users in Account Manager, including CRUD operations, role
management, and user lifecycle operations.

## Core User Functions

- :func:`get_user` -- Get user details by ID
- :func:`get_user_by_login` -- Get user details by login (email)
- :func:`list_users` -- List users with pagination
- :func:`create_user` -- Create a new user
- :func:`update_user` -- Update an existing user
- :func:`delete_user` -- Disable a user (soft delete)
- :func:`purge_user` -- Purge a disabled user (hard delete)
- :func:`reset_user` -- Reset a user to INITIAL state

## Usage

.. code-block:: python

    from b2c_tooling_sdk.operations.users import get_user_by_login, list_users, create_user, CreateUserOptions
    from b2c_tooling_sdk.clients import create_account_manager_users_client
    from b2c_tooling_sdk.auth import OAuthStrategy

    auth = OAuthStrategy(client_id="your-client-id", client_secret="your-client-secret")
    client = create_account_manager_users_client(config, auth)

    # Get a user by login
    user = await get_user_by_login(client, "user@example.com")

    # List users
    users = await list_users(client, ListUsersOptions(size=25, page=0))

    # Create a new user
    new_user = await create_user(
        client,
        CreateUserOptions(
            user={
                "mail": "newuser@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "organizations": ["org-id"],
                "primaryOrganization": "org-id",
            }
        ),
    )

## Authentication

User operations require OAuth authentication with appropriate Account Manager permissions.
"""

from __future__ import annotations

from dataclasses import dataclass

from b2c_tooling_sdk.clients import (
    AccountManagerUser,
    AccountManagerUsersClient,
    UserCollection,
    UserCreate,
    UserUpdate,
    find_user_by_login,
)
from b2c_tooling_sdk.clients import create_user as _create_user_api
from b2c_tooling_sdk.clients import delete_user as delete_user
from b2c_tooling_sdk.clients import get_user as get_user
from b2c_tooling_sdk.clients import list_users as list_users
from b2c_tooling_sdk.clients import purge_user as purge_user
from b2c_tooling_sdk.clients import reset_user as reset_user
from b2c_tooling_sdk.clients import update_user as _update_user_api


@dataclass
class CreateUserOptions:
    """Options for creating a user."""

    #: User details.
    user: UserCreate


@dataclass
class UpdateUserOptions:
    """Options for updating a user."""

    #: User ID.
    user_id: str
    #: Changes to apply.
    changes: UserUpdate


@dataclass
class GrantRoleOptions:
    """Options for granting a role.

    The AM API uses mixed formats: role IDs (e.g. ``bm-admin``) in the ``roles``
    array, and roleEnumNames (e.g. ``ECOM_ADMIN``) in the ``roleTenantFilter``
    string. Both must be provided. Use ``resolve_to_internal_role`` /
    ``resolve_from_internal_role`` to convert.
    """

    #: User ID.
    user_id: str
    #: Role ID as used in the roles array (e.g. 'bm-admin').
    role: str
    #: Role enum name as used in roleTenantFilter (e.g. 'ECOM_ADMIN').
    role_enum_name: str
    #: Optional scope for the role (tenant IDs, comma-separated).
    scope: str | None = None


@dataclass
class RevokeRoleOptions:
    """Options for revoking a role.

    See :class:`GrantRoleOptions` for details on the mixed role ID formats.
    """

    #: User ID.
    user_id: str
    #: Role ID as used in the roles array (e.g. 'bm-admin').
    role: str
    #: Role enum name as used in roleTenantFilter (e.g. 'ECOM_ADMIN').
    role_enum_name: str
    #: Optional scope to remove (if not provided, removes the entire role).
    scope: str | None = None


async def get_user_by_login(client: AccountManagerUsersClient, login: str) -> AccountManagerUser:
    """Retrieve details of a user by login (email).

    This searches through paginated results to find the user.

    :param client: Account Manager client.
    :param login: User login (email).
    :returns: User details.
    :raises RuntimeError: If the user is not found.
    """
    user = await find_user_by_login(client, login)
    if not user:
        raise RuntimeError(f"User {login} not found")
    return user


async def create_user(client: AccountManagerUsersClient, options: CreateUserOptions) -> AccountManagerUser:
    """Create a new user.

    :param client: Account Manager client.
    :param options: Create options (user details).
    :returns: Created user.
    """
    return await _create_user_api(client, options.user)


async def update_user(client: AccountManagerUsersClient, options: UpdateUserOptions) -> AccountManagerUser:
    """Update an existing user.

    :param client: Account Manager client.
    :param options: Update options (userId, changes).
    :returns: Updated user.
    """
    return await _update_user_api(client, options.user_id, options.changes)


def _user_role_ids(user: AccountManagerUser) -> list[str]:
    """Extract role IDs from a user's ``roles`` field, which may be a list of
    role ID strings or (when expanded) a list of role objects."""
    roles_value = user.get("roles")
    if not isinstance(roles_value, list):
        return []
    role_ids: list[str] = []
    for r in roles_value:
        if isinstance(r, str):
            role_ids.append(r)
        elif isinstance(r, dict):
            role_ids.append(r.get("id") or "")
    return role_ids


def _parse_role_tenant_filter(role_tenant_filter: str) -> dict[str, list[str]]:
    """Parse a ``roleTenantFilter`` string (``ROLE:tenant1,tenant2;ROLE2:tenant3``) into a map."""
    filter_map: dict[str, list[str]] = {}
    for filt in (f for f in role_tenant_filter.split(";") if f):
        role_enum, _, tenants = filt.partition(":")
        if tenants:
            filter_map[role_enum] = tenants.split(",")
    return filter_map


def _render_role_tenant_filter(filter_map: dict[str, list[str]]) -> str:
    """Render a parsed ``roleTenantFilter`` map back to its string form."""
    return ";".join(f"{role_enum}:{','.join(tenants)}" for role_enum, tenants in filter_map.items())


async def grant_role(client: AccountManagerUsersClient, options: GrantRoleOptions) -> AccountManagerUser:
    """Grant a role to a user, optionally with scope.

    This updates the user's roles and roleTenantFilter.

    :param client: Account Manager client.
    :param options: Grant options (userId, role, optional scope).
    :returns: Updated user.
    """
    role = options.role
    role_enum_name = options.role_enum_name

    # First get the current user.
    user = await get_user(client, options.user_id)

    # Build updated roles (uses role ID format, e.g. 'bm-admin').
    current_roles = _user_role_ids(user)
    updated_roles = current_roles if role in current_roles else [*current_roles, role]

    # Build updated roleTenantFilter (uses roleEnumName format, e.g. 'ECOM_ADMIN').
    role_tenant_filter = user.get("roleTenantFilter") or ""
    if options.scope:
        scopes = options.scope.split(",")
        # Parse existing filter.
        filter_map = _parse_role_tenant_filter(role_tenant_filter)
        # Add new scopes.
        existing_scopes = filter_map.get(role_enum_name, [])
        all_scopes = list(dict.fromkeys([*existing_scopes, *scopes]))
        filter_map[role_enum_name] = all_scopes
        # Rebuild filter string.
        role_tenant_filter = _render_role_tenant_filter(filter_map)

    return await update_user(
        client,
        UpdateUserOptions(
            user_id=options.user_id,
            changes={"roles": updated_roles, "roleTenantFilter": role_tenant_filter or None},
        ),
    )


async def revoke_role(client: AccountManagerUsersClient, options: RevokeRoleOptions) -> AccountManagerUser:
    """Revoke a role from a user, optionally removing specific scope.

    :param client: Account Manager client.
    :param options: Revoke options (userId, role, optional scope).
    :returns: Updated user.
    """
    role = options.role
    role_enum_name = options.role_enum_name

    # First get the current user.
    user = await get_user(client, options.user_id)

    # Build updated roles (uses role ID format, e.g. 'bm-admin').
    current_roles = _user_role_ids(user)
    updated_roles = current_roles

    # Build updated roleTenantFilter (uses roleEnumName format, e.g. 'ECOM_ADMIN').
    role_tenant_filter = user.get("roleTenantFilter") or ""

    if not options.scope:
        # Remove the entire role.
        updated_roles = [r for r in current_roles if r != role]
        # Remove all scopes for this role.
        filters = [f for f in role_tenant_filter.split(";") if f]
        role_tenant_filter = ";".join(f for f in filters if not f.startswith(f"{role_enum_name}:"))
    else:
        # Remove specific scope.
        scopes = options.scope.split(",")
        filter_map = _parse_role_tenant_filter(role_tenant_filter)
        existing_scopes = filter_map.get(role_enum_name, [])
        updated_scopes = [s for s in existing_scopes if s not in scopes]
        if updated_scopes:
            filter_map[role_enum_name] = updated_scopes
        else:
            filter_map.pop(role_enum_name, None)
        # Rebuild filter string.
        role_tenant_filter = _render_role_tenant_filter(filter_map)

    return await update_user(
        client,
        UpdateUserOptions(
            user_id=options.user_id,
            changes={
                "roles": updated_roles if updated_roles else None,
                "roleTenantFilter": role_tenant_filter or None,
            },
        ),
    )


__all__ = [
    "AccountManagerUser",
    "CreateUserOptions",
    "GrantRoleOptions",
    "RevokeRoleOptions",
    "UpdateUserOptions",
    "UserCollection",
    "UserCreate",
    "UserUpdate",
    "create_user",
    "delete_user",
    "get_user",
    "get_user_by_login",
    "grant_role",
    "list_users",
    "purge_user",
    "reset_user",
    "revoke_role",
    "update_user",
]
