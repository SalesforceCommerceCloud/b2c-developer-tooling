# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Account Manager API client for B2C Commerce.

Mirrors ``src/clients/am-api.ts``. Provides clients for the Account Manager REST
APIs including users, roles, API clients, and organizations, plus a unified
:class:`AccountManagerClient` that exposes every operation through a single
interface.

The users/roles/apiclients clients are configured
:class:`~b2c_tooling_sdk.clients._core.HttpClient` instances (the openapi-fetch
``Client`` analog): auth middleware first, a private pageable-transform
middleware (the AM API expects flat ``size``/``page`` query params rather than
openapi-fetch's bracket-notation nested objects), then registry plugin
middleware, then logging last.

The organizations client hand-rolls its own status-code-driven error handling
(401/403/generic, no 401 retry) rather than using :func:`~b2c_tooling_sdk.clients.middleware.create_auth_middleware`
(which retries once on 401) -- this mirrors the TS ``createAccountManagerOrgsClient``,
which calls ``auth.getAuthorizationHeader()`` directly instead of installing the
retrying auth middleware.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Literal, cast
from urllib.parse import quote

import httpx

from b2c_tooling_sdk.auth.types import AuthStrategy
from b2c_tooling_sdk.clients._core import HttpClient, MiddlewareRequestContext, MiddlewareResponseContext
from b2c_tooling_sdk.clients.middleware import create_auth_middleware, create_logging_middleware
from b2c_tooling_sdk.clients.middleware_registry import MiddlewareRegistry, global_middleware_registry
from b2c_tooling_sdk.defaults import DEFAULT_ACCOUNT_MANAGER_HOST
from b2c_tooling_sdk.logging import get_logger

#: Regex for Account Manager role tenant filter format:
#: ``ROLE_ENUM:realm_instance(,realm_instance)*(;ROLE_ENUM:...)*``
#: e.g. ``SALESFORCE_COMMERCE_API:abcd_prd`` or ``bm-admin:tenant1,tenant2;ECOM_USER:wxyz_stg``.
ROLE_TENANT_FILTER_PATTERN = re.compile(r"^(\w+:\w{4,}_\w{3,}(,\w{4,}_\w{3,})*(;)?)*$", re.ASCII)


def is_valid_role_tenant_filter(value: str) -> bool:
    """Return ``True`` if ``value`` matches the Account Manager role tenant filter format.

    Format: ``ROLE_ENUM:realm_instance(,realm_instance)*(;ROLE_ENUM:...)*``.
    Examples: ``SALESFORCE_COMMERCE_API:abcd_prd`` or ``bm-admin:tenant1,tenant2;ECOM_USER:wxyz_stg``.
    """
    return len(value) > 0 and bool(ROLE_TENANT_FILTER_PATTERN.match(value))


# ============================================================================
# Configuration shared by every Account Manager client factory
# ============================================================================


@dataclass
class AccountManagerClientConfig:
    """Configuration for creating Account Manager clients (users, roles, apiclients, orgs)."""

    #: Account Manager hostname. Defaults to ``account.demandware.com``.
    hostname: str | None = None
    #: Middleware registry to use for this client. Defaults to the global registry.
    middleware_registry: MiddlewareRegistry | None = None


# ============================================================================
# Shared error-message extraction helpers
# ============================================================================


def _simple_error_message(error: Any) -> str | None:
    """Extract ``error.error.message`` (mirrors TS ``error.error?.message``)."""
    if isinstance(error, dict):
        inner = error.get("error")
        if isinstance(inner, dict):
            message = inner.get("message")
            if isinstance(message, str) and message:
                return message
    return None


def _list_error_message(error: Any) -> str | None:
    """Extract a list-operation error message (mirrors TS
    ``error.errors?.[0]?.message || error.error?.message``)."""
    if isinstance(error, dict):
        errors = error.get("errors")
        if isinstance(errors, list) and errors and isinstance(errors[0], dict):
            message = errors[0].get("message")
            if isinstance(message, str) and message:
                return message
    return _simple_error_message(error)


def _field_hint_error_message(error: Any, no_field_default: str) -> str | None:
    """Extract the field-validation-aware error message used by API client
    create/update (mirrors TS's ``fieldErrors``-aware extraction, appending a
    ``(field: message)`` hint to the base message when available)."""
    if not isinstance(error, dict):
        return None
    errors = error.get("errors")
    first = errors[0] if isinstance(errors, list) and errors and isinstance(errors[0], dict) else None

    field_hint: str | None = None
    field_errors = first.get("fieldErrors") if first else None
    if isinstance(field_errors, list) and field_errors:
        parts = [f"{fe.get('field')}: {fe.get('defaultMessage') or ''}" for fe in field_errors if isinstance(fe, dict)]
        joined = "; ".join(p for p in parts if p)
        field_hint = joined or None
    if not field_hint and first:
        field = first.get("field")
        field_hint = field if isinstance(field, str) else None

    first_message = first.get("message") if first else None
    inner = error.get("error")
    inner_message = inner.get("message") if isinstance(inner, dict) else None

    if field_hint:
        base = first_message or inner_message or no_field_default
        return f"{base} ({field_hint})"
    return first_message or inner_message


# ============================================================================
# Shared pageable-transform middleware
# ============================================================================


class _PageableTransformMiddleware:
    """Rewrites bracketed ``pageable[size]``/``pageable[page]`` query params to
    flattened ``size``/``page`` (mirrors TS's private ``createPageableTransformMiddleware``).

    openapi-fetch serializes a nested query object like ``{pageable: {size, page}}``
    using bracket notation; the Account Manager API expects flat ``size``/``page``
    params instead. The Python operations below build the bracket-notation keys
    directly (there is no nested-object query serializer in :class:`HttpClient`),
    and this middleware flattens them before the request is sent.
    """

    def __init__(self) -> None:
        self._logger = get_logger("clients.am_api")

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        request = ctx.request
        url = request.url
        params = url.params
        pageable_size = params.get("pageable[size]")
        pageable_page = params.get("pageable[page]")

        if pageable_size is None and pageable_page is None:
            return request

        new_params = params
        if "pageable[size]" in new_params:
            new_params = new_params.remove("pageable[size]")
        if "pageable[page]" in new_params:
            new_params = new_params.remove("pageable[page]")
        if pageable_size is not None:
            new_params = new_params.set("size", pageable_size)
        if pageable_page is not None:
            new_params = new_params.set("page", pageable_page)

        new_url = url.copy_with(params=new_params)
        self._logger.debug(
            "[AM] Transformed pageable query parameters from bracket to flattened notation: %s -> %s",
            str(url),
            str(new_url),
        )
        return httpx.Request(request.method, new_url, headers=request.headers, content=request.content)

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        return ctx.response


def _create_pageable_transform_middleware() -> _PageableTransformMiddleware:
    return _PageableTransformMiddleware()


# ============================================================================
# Users API
# ============================================================================

#: The typed Account Manager Users client. Aliased to :class:`HttpClient` (the
#: ``openapi-fetch`` ``Client`` analog).
AccountManagerUsersClient = HttpClient

#: User type from the generated schema. Untyped (``dict``) -- see module docstring.
AccountManagerUser = dict[str, Any]
UserCreate = dict[str, Any]
UserUpdate = dict[str, Any]
UserCollection = dict[str, Any]

#: Expand parameter for user/API-client get operations.
UserExpandOption = Literal["organizations", "roles"]
UserState = Literal["INITIAL", "ENABLED", "DELETED"]


@dataclass
class ListUsersOptions:
    """Options for listing users."""

    #: Page size (default: 20, min: 1, max: 4000).
    size: int | None = None
    #: Page number (default: 0).
    page: int | None = None


@dataclass
class RoleMapping:
    """Role mapping built from the Account Manager roles API.

    Maps between role ``id`` (e.g. ``bm-admin``) and ``roleEnumName`` (e.g. ``ECOM_ADMIN``).
    """

    #: Maps role id (e.g. ``bm-admin``) to roleEnumName (e.g. ``ECOM_ADMIN``).
    by_id: dict[str, str]
    #: Maps roleEnumName (e.g. ``ECOM_ADMIN``) to role id (e.g. ``bm-admin``).
    by_enum_name: dict[str, str]
    #: Maps roleEnumName (e.g. ``ECOM_ADMIN``) to description (e.g. ``Business Manager Administrator``).
    descriptions: dict[str, str]


@dataclass
class OrgMapping:
    """Organization mapping built from the Account Manager organizations API. Maps org ID to name."""

    #: Maps organization ID to name.
    by_id: dict[str, str]


def create_account_manager_users_client(
    config: AccountManagerClientConfig, auth: AuthStrategy
) -> AccountManagerUsersClient:
    """Create a typed Account Manager Users API client.

    :param config: Account Manager Users client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    hostname = config.hostname or DEFAULT_ACCOUNT_MANAGER_HOST
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(f"https://{hostname}", client_type="am-users-api")

    # Core middleware: auth first.
    client.use(create_auth_middleware(auth))

    # Transform pageable query parameters from bracket notation to flattened format.
    client.use(_create_pageable_transform_middleware())

    # Plugin middleware from the registry.
    for middleware in registry.get_middleware("am-users-api"):
        client.use(middleware)

    # Logging middleware last (sees the complete request with all modifications).
    client.use(create_logging_middleware("AM-USERS"))

    return client


async def get_user(
    client: AccountManagerUsersClient,
    user_id: str,
    expand: list[UserExpandOption] | None = None,
) -> AccountManagerUser:
    """Retrieve details of a user by ID. Raises if the user is not found or the request fails."""
    query = {"expand": list(expand)} if expand else None
    result = await client.get(
        "/dw/rest/v1/users/{userId}",
        {"params": {"path": {"userId": user_id}, "query": query}},
    )

    if result.error:
        if result.response is not None and result.response.status_code == 404:
            raise RuntimeError(f"User {user_id} not found")
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to get user: {json.dumps(result.error)}")

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerUser, result.data)


async def list_users(
    client: AccountManagerUsersClient,
    options: ListUsersOptions | None = None,
) -> UserCollection:
    """List users with pagination. Raises if the request fails."""
    opts = options or ListUsersOptions()
    size = opts.size if opts.size is not None else 20
    page = opts.page if opts.page is not None else 0

    result = await client.get(
        "/dw/rest/v1/users",
        {"params": {"query": {"pageable[size]": size, "pageable[page]": page}}},
    )

    if result.error:
        error_message = _list_error_message(result.error)
        if error_message and "fromIndex" in error_message and "toIndex" in error_message:
            raise RuntimeError(
                f"Page {page} is out of bounds. The requested page exceeds the available data. Try a lower page number."
            )
        raise RuntimeError(error_message or f"Failed to list users: {json.dumps(result.error)}")

    return cast(UserCollection, result.data or {"content": []})


async def create_user(client: AccountManagerUsersClient, user: UserCreate) -> AccountManagerUser:
    """Create a new user. Raises if the request fails."""
    result = await client.post("/dw/rest/v1/users", {"body": user})

    if result.error:
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to create user: {json.dumps(result.error)}")

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerUser, result.data)


async def update_user(client: AccountManagerUsersClient, user_id: str, changes: UserUpdate) -> AccountManagerUser:
    """Update an existing user. Raises if the request fails."""
    result = await client.put(
        "/dw/rest/v1/users/{userId}",
        {"params": {"path": {"userId": user_id}}, "body": changes},
    )

    if result.error:
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to update user: {json.dumps(result.error)}")

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerUser, result.data)


async def delete_user(client: AccountManagerUsersClient, user_id: str) -> None:
    """Disable a user (soft delete -- sets ``userState`` to ``DELETED``).

    Users must be disabled before they can be purged.
    """
    result = await client.post(
        "/dw/rest/v1/users/{userId}/disable",
        {"params": {"path": {"userId": user_id}}, "body": {}},
    )

    if result.error:
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to delete user: {json.dumps(result.error)}")


async def purge_user(client: AccountManagerUsersClient, user_id: str) -> None:
    """Purge a user (hard delete). Users must be in ``DELETED`` state before they can be purged."""
    result = await client.delete("/dw/rest/v1/users/{userId}", {"params": {"path": {"userId": user_id}}})

    if result.error:
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to purge user: {json.dumps(result.error)}")


async def reset_user(client: AccountManagerUsersClient, user_id: str) -> None:
    """Reset a user to ``INITIAL`` state and send activation instructions."""
    result = await client.post(
        "/dw/rest/v1/users/{userId}/reset",
        {"params": {"path": {"userId": user_id}}, "body": {}},
    )

    if result.error:
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to reset user: {json.dumps(result.error)}")


async def find_user_by_login(
    client: AccountManagerUsersClient,
    login: str,
    expand: list[UserExpandOption] | None = None,
) -> AccountManagerUser | None:
    """Find a user by login (email) using the dedicated search endpoint.

    :returns: The user if found, ``None`` if not found.
    """
    result = await client.get(
        "/dw/rest/v1/users/search/findByLogin",
        {"params": {"query": {"login": login}}},
    )

    if result.response is not None and result.response.status_code == 404:
        return None

    if result.error:
        raise RuntimeError(f"Failed to search for user: {json.dumps(result.error)}")

    found = result.data
    if not found:
        return None

    # If expand is requested, fetch the full user with expanded fields.
    if expand and found.get("id"):
        return await get_user(client, found["id"], expand)

    return cast(AccountManagerUser, found)


async def fetch_role_mapping(roles_client: AccountManagerRolesClient) -> RoleMapping:
    """Fetch all roles and build a mapping between role ``id`` and ``roleEnumName``."""
    result = await list_roles(roles_client, ListRolesOptions(size=100))
    by_id: dict[str, str] = {}
    by_enum_name: dict[str, str] = {}
    descriptions: dict[str, str] = {}

    for role in result.get("content") or []:
        role_id = role.get("id")
        role_enum_name = role.get("roleEnumName")
        if role_id and role_enum_name:
            by_id[role_id] = role_enum_name
            by_enum_name[role_enum_name] = role_id
            description = role.get("description")
            if description:
                descriptions[role_enum_name] = description

    return RoleMapping(by_id=by_id, by_enum_name=by_enum_name, descriptions=descriptions)


def resolve_to_internal_role(role: str, mapping: RoleMapping) -> str:
    """Resolve a role to its internal ``roleEnumName`` using an API-fetched role mapping.

    Accepts either the role ``id`` (e.g. ``bm-admin``) or ``roleEnumName`` (e.g. ``ECOM_ADMIN``).
    Falls back to a generic transform (uppercase + replace hyphens with underscores) for unknown roles.
    """
    if role in mapping.by_enum_name:
        return role
    enum_name = mapping.by_id.get(role)
    if enum_name:
        return enum_name
    return role.upper().replace("-", "_")


def resolve_from_internal_role(role_enum_name: str, mapping: RoleMapping) -> str:
    """Resolve an internal ``roleEnumName`` to its external role ``id`` using an API-fetched role mapping.

    Falls back to a generic transform (lowercase + replace underscores with hyphens) for unknown roles.
    """
    role_id = mapping.by_enum_name.get(role_enum_name)
    if role_id:
        return role_id
    return role_enum_name.lower().replace("_", "-")


# ============================================================================
# Roles API
# ============================================================================

#: The typed Account Manager Roles client. Aliased to :class:`HttpClient`.
AccountManagerRolesClient = HttpClient

AccountManagerRole = dict[str, Any]
RoleCollection = dict[str, Any]


@dataclass
class ListRolesOptions:
    """Options for listing roles."""

    #: Page size (default: 20, min: 1, max: 4000).
    size: int | None = None
    #: Page number (default: 0).
    page: int | None = None
    #: Filter by target type (``ApiClient`` or ``User``).
    role_target_type: Literal["ApiClient", "User"] | None = None


def create_account_manager_roles_client(
    config: AccountManagerClientConfig, auth: AuthStrategy
) -> AccountManagerRolesClient:
    """Create a typed Account Manager Roles API client.

    :param config: Account Manager Roles client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    hostname = config.hostname or DEFAULT_ACCOUNT_MANAGER_HOST
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(f"https://{hostname}", client_type="am-roles-api")

    client.use(create_auth_middleware(auth))
    client.use(_create_pageable_transform_middleware())

    for middleware in registry.get_middleware("am-roles-api"):
        client.use(middleware)

    client.use(create_logging_middleware("AM-ROLES"))

    return client


async def get_role(client: AccountManagerRolesClient, role_id: str) -> AccountManagerRole:
    """Retrieve details of a role by ID. Raises if the role is not found or the request fails."""
    result = await client.get("/dw/rest/v1/roles/{roleId}", {"params": {"path": {"roleId": role_id}}})

    if result.error:
        if result.response is not None and result.response.status_code == 404:
            raise RuntimeError(f"Role {role_id} not found")
        raise RuntimeError(_simple_error_message(result.error) or f"Failed to get role: {json.dumps(result.error)}")

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerRole, result.data)


async def list_roles(
    client: AccountManagerRolesClient,
    options: ListRolesOptions | None = None,
) -> RoleCollection:
    """List roles with pagination. Raises if the request fails."""
    opts = options or ListRolesOptions()
    size = opts.size if opts.size is not None else 20
    page = opts.page if opts.page is not None else 0

    query: dict[str, Any] = {"pageable[size]": size, "pageable[page]": page}
    if opts.role_target_type:
        query["roleTargetType"] = opts.role_target_type

    result = await client.get("/dw/rest/v1/roles", {"params": {"query": query}})

    if result.error:
        error_message = _list_error_message(result.error)
        if error_message and "fromIndex" in error_message and "toIndex" in error_message:
            raise RuntimeError(
                f"Page {page} is out of bounds. The requested page exceeds the available data. Try a lower page number."
            )
        raise RuntimeError(error_message or f"Failed to list roles: {json.dumps(result.error)}")

    return cast(RoleCollection, result.data or {"content": []})


# ============================================================================
# API Clients API
# ============================================================================

#: The typed Account Manager API Clients client. Aliased to :class:`HttpClient`.
AccountManagerApiClientsClient = HttpClient

AccountManagerApiClient = dict[str, Any]
APIClientCreate = dict[str, Any]
APIClientUpdate = dict[str, Any]
APIClientCollection = dict[str, Any]

#: Expand parameter for the API client get operation.
ApiClientExpandOption = Literal["organizations", "roles"]


@dataclass
class ListApiClientsOptions:
    """Options for listing API clients."""

    #: Page size (default: 20, min: 1, max: 4000).
    size: int | None = None
    #: Page number (default: 0).
    page: int | None = None


def create_account_manager_api_clients_client(
    config: AccountManagerClientConfig, auth: AuthStrategy
) -> AccountManagerApiClientsClient:
    """Create a typed Account Manager API Clients API client.

    :param config: Account Manager client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A configured :class:`HttpClient`.
    """
    hostname = config.hostname or DEFAULT_ACCOUNT_MANAGER_HOST
    registry = config.middleware_registry or global_middleware_registry

    client = HttpClient(f"https://{hostname}", client_type="am-apiclients-api")

    client.use(create_auth_middleware(auth))
    client.use(_create_pageable_transform_middleware())

    for middleware in registry.get_middleware("am-apiclients-api"):
        client.use(middleware)

    client.use(create_logging_middleware("AM-APICLIENTS"))

    return client


async def list_api_clients(
    client: AccountManagerApiClientsClient,
    options: ListApiClientsOptions | None = None,
) -> APIClientCollection:
    """List API clients with pagination."""
    opts = options or ListApiClientsOptions()
    size = opts.size if opts.size is not None else 20
    page = opts.page if opts.page is not None else 0

    result = await client.get(
        "/dw/rest/v1/apiclients",
        {"params": {"query": {"pageable[size]": size, "pageable[page]": page}}},
    )

    if result.error:
        error_message = _list_error_message(result.error)
        raise RuntimeError(error_message or f"Failed to list API clients: {json.dumps(result.error)}")

    return cast(APIClientCollection, result.data or {"content": []})


async def get_api_client(
    client: AccountManagerApiClientsClient,
    api_client_id: str,
    expand: list[ApiClientExpandOption] | None = None,
) -> AccountManagerApiClient:
    """Retrieve an API client by ID. Raises if not found (404) or the request fails."""
    query = {"expand": list(expand)} if expand else None
    result = await client.get(
        "/dw/rest/v1/apiclients/{apiClientId}",
        {"params": {"path": {"apiClientId": api_client_id}, "query": query}},
    )

    if result.error:
        if result.response is not None and result.response.status_code == 404:
            raise RuntimeError(f"API client {api_client_id} not found")
        raise RuntimeError(
            _simple_error_message(result.error) or f"Failed to get API client: {json.dumps(result.error)}"
        )

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerApiClient, result.data)


async def create_api_client(client: AccountManagerApiClientsClient, body: APIClientCreate) -> AccountManagerApiClient:
    """Create a new API client.

    Omits ``active`` when ``False`` so the API uses its default (inactive); some
    implementations reject or mishandle explicit ``active: false`` and return
    "invalid argument APIClient".
    """
    wire_body = {k: v for k, v in body.items() if k != "active"} if body.get("active") is False else body

    result = await client.post("/dw/rest/v1/apiclients", {"body": wire_body})

    if result.error:
        message = _field_hint_error_message(result.error, "Bad Request")
        raise RuntimeError(message or f"Failed to create API client: {json.dumps(result.error)}")

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerApiClient, result.data)


async def update_api_client(
    client: AccountManagerApiClientsClient,
    api_client_id: str,
    body: APIClientUpdate,
) -> AccountManagerApiClient:
    """Update an existing API client. Raises if the request fails or the body is invalid."""
    result = await client.put(
        "/dw/rest/v1/apiclients/{apiClientId}",
        {"params": {"path": {"apiClientId": api_client_id}}, "body": body},
    )

    if result.error:
        message = _field_hint_error_message(result.error, "Invalid request")
        raise RuntimeError(message or f"Failed to update API client: {json.dumps(result.error)}")

    if result.data is None:
        raise RuntimeError("No data returned from API")

    return cast(AccountManagerApiClient, result.data)


async def delete_api_client(client: AccountManagerApiClientsClient, api_client_id: str) -> None:
    """Delete an API client. Only clients disabled for at least 7 days can be deleted."""
    result = await client.delete(
        "/dw/rest/v1/apiclients/{apiClientId}",
        {"params": {"path": {"apiClientId": api_client_id}}},
    )

    if result.error:
        if result.response is not None and result.response.status_code == 412:
            raise RuntimeError("API client must be disabled for at least 7 days before it can be deleted.")
        raise RuntimeError(
            _simple_error_message(result.error) or f"Failed to delete API client: {json.dumps(result.error)}"
        )


async def change_api_client_password(
    client: AccountManagerApiClientsClient,
    api_client_id: str,
    old_password: str,
    new_password: str,
) -> None:
    """Change the password for an API client."""
    result = await client.put(
        "/dw/rest/v1/apiclients/{apiClientId}/password",
        {"params": {"path": {"apiClientId": api_client_id}}, "body": {"old": old_password, "new": new_password}},
    )

    if result.error:
        raise RuntimeError(
            _simple_error_message(result.error) or f"Failed to change API client password: {json.dumps(result.error)}"
        )


# ============================================================================
# Organizations API
# ============================================================================

#: Account Manager organization type. Untyped (``dict``) -- see module docstring.
#: May carry arbitrary additional keys returned by the API.
AccountManagerOrganization = dict[str, Any]

#: Account Manager organization collection response.
OrganizationCollection = dict[str, Any]


@dataclass
class ListOrgsOptions:
    """Options for listing organizations."""

    #: Page size (default: 25, max: 5000).
    size: int | None = None
    #: Page number (0-based, default: 0).
    page: int | None = None
    #: Return all orgs (uses max page size of 5000).
    all: bool = False


def _to_external_org(org: AccountManagerOrganization) -> AccountManagerOrganization:
    """Transform the API organization representation to an external format.

    Removes internal properties like ``links`` that should not be exposed.
    """
    transformed = dict(org)
    transformed.pop("links", None)
    return transformed


class _OrgsAuthMiddleware:
    """Sets the ``Authorization`` header for the orgs client with **no** 401-retry.

    Mirrors the TS orgs client, which calls ``auth.getAuthorizationHeader()``
    directly rather than installing the retrying
    :func:`~b2c_tooling_sdk.clients.middleware.create_auth_middleware`.
    """

    def __init__(self, auth: AuthStrategy) -> None:
        self._auth = auth

    async def on_request(self, ctx: MiddlewareRequestContext) -> httpx.Request | None:
        get_header = getattr(self._auth, "get_authorization_header", None)
        if get_header is not None:
            ctx.request.headers["Authorization"] = await get_header()
        return ctx.request

    async def on_response(self, ctx: MiddlewareResponseContext) -> httpx.Response | None:
        return ctx.response


async def _org_request(client: HttpClient, path: str) -> Any:
    """Make a request to the Account Manager Organizations API and apply the
    TS orgs client's status-code-driven error handling (401/403/generic)."""
    result = await client.get(path)
    response = result.response
    if response is None:  # pragma: no cover - HttpClient always sets response on success
        raise RuntimeError("No response received from Account Manager")

    if response.status_code == 401:
        raise RuntimeError("Authentication invalid. Please (re-)authenticate.")
    if response.status_code == 403:
        raise RuntimeError("Operation forbidden. Please make sure you have the permission to perform this operation.")
    if response.status_code >= 400:
        raise RuntimeError(f"Operation failed. Error code {response.status_code}")
    if not response.is_success:
        raise RuntimeError(f"Request failed: {response.reason_phrase}")

    return result.data


class AccountManagerOrgsClient:
    """Account Manager Organizations API client.

    Hand-rolled request logic (mirrors the TS ``createAccountManagerOrgsClient``):
    a private, non-retrying auth middleware plus registry/logging middleware, and
    status-code-driven error mapping instead of the
    :class:`~b2c_tooling_sdk.clients._core.ClientResult` convention used by the
    other AM clients.
    """

    def __init__(self, http_client: HttpClient) -> None:
        self._http = http_client
        self._logger = get_logger("clients.am_api")

    async def get_org(self, org_id: str) -> AccountManagerOrganization:
        """Get organization by ID."""
        self._logger.debug("[AM-ORGS] Getting organization by ID: %s", org_id)
        try:
            org = await _org_request(self._http, f"/organizations/{org_id}")
        except RuntimeError as error:
            if "Error code 404" in str(error):
                raise RuntimeError(f"Organization {org_id} not found") from error
            raise
        return _to_external_org(org)

    async def get_org_by_name(self, name: str) -> AccountManagerOrganization:
        """Get organization by name (searches for exact or partial match)."""
        self._logger.debug("[AM-ORGS] Getting organization by name: %s", name)
        encoded_name = quote(name, safe="")
        try:
            result = await _org_request(
                self._http,
                f"/organizations/search/findByName?startsWith={encoded_name}&ignoreCase=false",
            )
        except RuntimeError as error:
            if "Error code 404" in str(error):
                raise RuntimeError(f"Organization {name} not found") from error
            raise

        content = result.get("content", []) if isinstance(result, dict) else []
        if len(content) == 0:
            raise RuntimeError(f"Organization {name} not found")

        if len(content) > 1:
            exact_match = next((org for org in content if org.get("name") == name), None)
            if exact_match is not None:
                return _to_external_org(exact_match)
            raise RuntimeError(f'Organization name "{name}" is ambiguous. Multiple organizations found.')

        return _to_external_org(content[0])

    async def list_orgs(self, options: ListOrgsOptions | None = None) -> OrganizationCollection:
        """List organizations with pagination."""
        opts = options or ListOrgsOptions()
        size = opts.size if opts.size is not None else 25
        page = opts.page if opts.page is not None else 0
        page_size = 5000 if opts.all else size

        self._logger.debug("[AM-ORGS] Listing organizations: size=%s page=%s", page_size, page)

        result = await _org_request(self._http, f"/organizations?page={page}&size={page_size}")
        content = result.get("content", []) if isinstance(result, dict) else []

        return {**result, "content": [_to_external_org(org) for org in content]}


def create_account_manager_orgs_client(
    config: AccountManagerClientConfig, auth: AuthStrategy
) -> AccountManagerOrgsClient:
    """Create an Account Manager Organizations API client.

    :param config: Account Manager Organizations client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: An :class:`AccountManagerOrgsClient`.
    """
    hostname = config.hostname or DEFAULT_ACCOUNT_MANAGER_HOST
    registry = config.middleware_registry or global_middleware_registry

    http_client = HttpClient(f"https://{hostname}/dw/rest/v1", client_type="am-orgs-api")

    http_client.use(_OrgsAuthMiddleware(auth))

    for middleware in registry.get_middleware("am-orgs-api"):
        http_client.use(middleware)

    http_client.use(create_logging_middleware("AM-ORGS"))

    return AccountManagerOrgsClient(http_client)


# ============================================================================
# Unified Account Manager Client
# ============================================================================


class AccountManagerClient:
    """Unified Account Manager API client that combines users, roles, API clients, and organizations.

    Provides direct access to every Account Manager API operation through a
    single interface, while internally using separate configured clients for
    each domain. Role and org mappings (id/enum-name and id/name) are lazily
    fetched and cached.
    """

    def __init__(
        self,
        users_client: AccountManagerUsersClient,
        roles_client: AccountManagerRolesClient,
        api_clients_client: AccountManagerApiClientsClient,
        orgs_client: AccountManagerOrgsClient,
    ) -> None:
        self._users = users_client
        self._roles = roles_client
        self._api_clients = api_clients_client
        self._orgs = orgs_client
        self._logger = get_logger("clients.am_api")
        self._role_mapping: RoleMapping | None = None
        self._org_mapping: OrgMapping | None = None

    # -- Users API -----------------------------------------------------------

    async def get_user(self, user_id: str, expand: list[UserExpandOption] | None = None) -> AccountManagerUser:
        """Get user by ID."""
        return await get_user(self._users, user_id, expand)

    async def list_users(self, options: ListUsersOptions | None = None) -> UserCollection:
        """List users with pagination."""
        return await list_users(self._users, options)

    async def create_user(self, user: UserCreate) -> AccountManagerUser:
        """Create a new user."""
        return await create_user(self._users, user)

    async def update_user(self, user_id: str, changes: UserUpdate) -> AccountManagerUser:
        """Update an existing user."""
        return await update_user(self._users, user_id, changes)

    async def delete_user(self, user_id: str) -> None:
        """Disable a user (soft delete)."""
        await delete_user(self._users, user_id)

    async def purge_user(self, user_id: str) -> None:
        """Purge a user (hard delete)."""
        await purge_user(self._users, user_id)

    async def reset_user(self, user_id: str) -> None:
        """Reset a user to ``INITIAL`` state."""
        await reset_user(self._users, user_id)

    async def find_user_by_login(
        self, login: str, expand: list[UserExpandOption] | None = None
    ) -> AccountManagerUser | None:
        """Find a user by login (email)."""
        return await find_user_by_login(self._users, login, expand)

    async def grant_role(self, user_id: str, role: str, scope: str | None = None) -> AccountManagerUser:
        """Grant a role to a user, optionally scoped to specific tenants."""
        role_mapping = await self.get_role_mapping()
        # Resolve to both formats: role ID for the roles array, roleEnumName for roleTenantFilter.
        enum_name = resolve_to_internal_role(role, role_mapping)
        role_id = resolve_from_internal_role(enum_name, role_mapping)
        self._logger.debug("[AM] Resolved role '%s' -> id='%s', enum='%s'", role, role_id, enum_name)
        user = await get_user(self._users, user_id)

        # Build updated roles (uses role ID format, e.g. 'bm-admin').
        current_roles = _user_role_ids(user)
        updated_roles = current_roles if role_id in current_roles else [*current_roles, role_id]

        # Build updated roleTenantFilter (uses roleEnumName format, e.g. 'ECOM_ADMIN').
        role_tenant_filter = user.get("roleTenantFilter") or ""
        if scope:
            scopes = scope.split(",")
            filter_map = _parse_role_tenant_filter(role_tenant_filter)
            existing_scopes = filter_map.get(enum_name, [])
            all_scopes = list(dict.fromkeys([*existing_scopes, *scopes]))
            filter_map[enum_name] = all_scopes
            role_tenant_filter = _render_role_tenant_filter(filter_map)

        return await update_user(
            self._users,
            user_id,
            {"roles": updated_roles, "roleTenantFilter": role_tenant_filter or None},
        )

    async def revoke_role(self, user_id: str, role: str, scope: str | None = None) -> AccountManagerUser:
        """Revoke a role from a user, optionally removing only specific tenant scopes."""
        role_mapping = await self.get_role_mapping()
        enum_name = resolve_to_internal_role(role, role_mapping)
        role_id = resolve_from_internal_role(enum_name, role_mapping)
        self._logger.debug("[AM] Resolved role '%s' -> id='%s', enum='%s'", role, role_id, enum_name)
        user = await get_user(self._users, user_id)

        current_roles = _user_role_ids(user)
        updated_roles = current_roles
        role_tenant_filter = user.get("roleTenantFilter") or ""

        if not scope:
            # Remove the entire role.
            updated_roles = [r for r in current_roles if r != role_id]
            filters = [f for f in role_tenant_filter.split(";") if f]
            role_tenant_filter = ";".join(f for f in filters if not f.startswith(f"{enum_name}:"))
        else:
            # Remove specific scope(s).
            scopes = scope.split(",")
            filter_map = _parse_role_tenant_filter(role_tenant_filter)
            existing_scopes = filter_map.get(enum_name, [])
            remaining_scopes = [s for s in existing_scopes if s not in scopes]
            if len(remaining_scopes) == 0:
                # No scopes left, remove the role entirely.
                updated_roles = [r for r in current_roles if r != role_id]
                filter_map.pop(enum_name, None)
            else:
                filter_map[enum_name] = remaining_scopes
            role_tenant_filter = _render_role_tenant_filter(filter_map)

        return await update_user(
            self._users,
            user_id,
            {"roles": updated_roles, "roleTenantFilter": role_tenant_filter or None},
        )

    # -- Roles API -------------------------------------------------------------

    async def get_role(self, role_id: str) -> AccountManagerRole:
        """Get role by ID."""
        return await get_role(self._roles, role_id)

    async def list_roles(self, options: ListRolesOptions | None = None) -> RoleCollection:
        """List roles with pagination."""
        return await list_roles(self._roles, options)

    async def get_role_mapping(self) -> RoleMapping:
        """Get the role mapping (id <-> roleEnumName), lazily cached."""
        if self._role_mapping is None:
            self._role_mapping = await fetch_role_mapping(self._roles)
        return self._role_mapping

    async def get_org_mapping(self) -> OrgMapping:
        """Get the org mapping (id -> name), lazily cached."""
        if self._org_mapping is None:
            result = await self._orgs.list_orgs(ListOrgsOptions(all=True))
            by_id: dict[str, str] = {}
            for org in result.get("content") or []:
                org_id = org.get("id")
                name = org.get("name")
                if org_id and name:
                    by_id[org_id] = name
            self._org_mapping = OrgMapping(by_id=by_id)
        return self._org_mapping

    # -- API Clients API ---------------------------------------------------------

    async def list_api_clients(self, options: ListApiClientsOptions | None = None) -> APIClientCollection:
        """List API clients with pagination."""
        return await list_api_clients(self._api_clients, options)

    async def get_api_client(
        self, api_client_id: str, expand: list[ApiClientExpandOption] | None = None
    ) -> AccountManagerApiClient:
        """Get API client by ID."""
        return await get_api_client(self._api_clients, api_client_id, expand)

    async def create_api_client(self, body: APIClientCreate) -> AccountManagerApiClient:
        """Create a new API client."""
        return await create_api_client(self._api_clients, body)

    async def update_api_client(self, api_client_id: str, body: APIClientUpdate) -> AccountManagerApiClient:
        """Update an existing API client."""
        return await update_api_client(self._api_clients, api_client_id, body)

    async def delete_api_client(self, api_client_id: str) -> None:
        """Delete an API client (must be disabled 7+ days)."""
        await delete_api_client(self._api_clients, api_client_id)

    async def change_api_client_password(self, api_client_id: str, old_password: str, new_password: str) -> None:
        """Change an API client password."""
        await change_api_client_password(self._api_clients, api_client_id, old_password, new_password)

    # -- Organizations API -------------------------------------------------------

    async def get_org(self, org_id: str) -> AccountManagerOrganization:
        """Get organization by ID."""
        return await self._orgs.get_org(org_id)

    async def get_org_by_name(self, name: str) -> AccountManagerOrganization:
        """Get organization by name."""
        return await self._orgs.get_org_by_name(name)

    async def list_orgs(self, options: ListOrgsOptions | None = None) -> OrganizationCollection:
        """List organizations with pagination."""
        return await self._orgs.list_orgs(options)


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


def create_account_manager_client(config: AccountManagerClientConfig, auth: AuthStrategy) -> AccountManagerClient:
    """Create a unified Account Manager API client (users, roles, API clients, orgs).

    :param config: Account Manager client configuration.
    :param auth: Authentication strategy (typically OAuth).
    :returns: A unified :class:`AccountManagerClient`.
    """
    users_client = create_account_manager_users_client(config, auth)
    roles_client = create_account_manager_roles_client(config, auth)
    api_clients_client = create_account_manager_api_clients_client(config, auth)
    orgs_client = create_account_manager_orgs_client(config, auth)

    return AccountManagerClient(users_client, roles_client, api_clients_client, orgs_client)


__all__ = [
    "APIClientCollection",
    "APIClientCreate",
    "APIClientUpdate",
    "ROLE_TENANT_FILTER_PATTERN",
    "AccountManagerApiClient",
    "AccountManagerApiClientsClient",
    "AccountManagerClient",
    "AccountManagerClientConfig",
    "AccountManagerOrganization",
    "AccountManagerOrgsClient",
    "AccountManagerRole",
    "AccountManagerRolesClient",
    "AccountManagerUser",
    "AccountManagerUsersClient",
    "ApiClientExpandOption",
    "ListApiClientsOptions",
    "ListOrgsOptions",
    "ListRolesOptions",
    "ListUsersOptions",
    "OrgMapping",
    "OrganizationCollection",
    "RoleCollection",
    "RoleMapping",
    "UserCollection",
    "UserCreate",
    "UserExpandOption",
    "UserState",
    "UserUpdate",
    "change_api_client_password",
    "create_account_manager_api_clients_client",
    "create_account_manager_client",
    "create_account_manager_orgs_client",
    "create_account_manager_roles_client",
    "create_account_manager_users_client",
    "create_api_client",
    "create_user",
    "delete_api_client",
    "delete_user",
    "fetch_role_mapping",
    "find_user_by_login",
    "get_api_client",
    "get_role",
    "get_user",
    "is_valid_role_tenant_filter",
    "list_api_clients",
    "list_roles",
    "list_users",
    "purge_user",
    "reset_user",
    "resolve_from_internal_role",
    "resolve_to_internal_role",
    "update_api_client",
    "update_user",
]
