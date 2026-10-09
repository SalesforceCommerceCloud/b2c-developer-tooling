# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Business Manager user operations for B2C Commerce instances.

Mirrors ``src/operations/bm-users/users.ts``. Provides functions for querying
and managing instance-level users via the OCAPI Data API.

Note: Most production B2C Commerce instances delegate user identity to Account
Manager (SSO), so create-or-replace (PUT) is rejected with
``LocalUserCreationException`` unless the instance is configured to allow
local Business Manager users. When SSO-managed, provision users in Account
Manager and use these operations for read/search/update/delete plus
access-key administration.

The generic :class:`~b2c_tooling_sdk.clients._core.HttpClient` returns raw
parsed JSON (``dict[str, Any]``) rather than a validated model -- like the
TypeScript ``openapi-fetch`` client, whose generated types are compile-time
only. ``BmUser``, ``BmUsers``, ``BmUserSearchResult``, and
``BmAccessKeyDetails`` are therefore plain JSON aliases.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal, cast

from b2c_tooling_sdk.clients.error_utils import throw_ocapi_error
from b2c_tooling_sdk.clients.scapi_backend_utils import assert_ocapi_compatibility_allowed
from b2c_tooling_sdk.clients.scapi_merchant_users import (
    SCAPI_MERCHANT_USERS_READ_SCOPES,
    SCAPI_MERCHANT_USERS_RW_SCOPES,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance

# SCAPI Merchant Users scopes named in the OCAPI-deprecation message for the
# legacy OCAPI free functions. Portable search is also exposed by the
# dual-backend interface; raw query DSL, whoami, and access keys stay here.
_USERS_READ_SCOPES = [*SCAPI_MERCHANT_USERS_READ_SCOPES, *SCAPI_MERCHANT_USERS_RW_SCOPES]
_USERS_RW_SCOPES = list(SCAPI_MERCHANT_USERS_RW_SCOPES)

#: BM user from OCAPI.
BmUser = dict[str, Any]

#: BM users collection from OCAPI.
BmUsers = dict[str, Any]

#: BM user search result from OCAPI.
BmUserSearchResult = dict[str, Any]

#: Access key details for an externally-managed user.
BmAccessKeyDetails = dict[str, Any]

#: Valid access-key scopes accepted by the Data API
#: ``/users/{login}/access_key/{scope}`` endpoints.
ACCESS_KEY_SCOPES = ("WEBDAV_AND_STUDIO", "AGENT_USER_AND_OCAPI", "STOREFRONT")

#: Access-key scope. One of :data:`ACCESS_KEY_SCOPES`.
AccessKeyScope = Literal["WEBDAV_AND_STUDIO", "AGENT_USER_AND_OCAPI", "STOREFRONT"]


@dataclass
class UpdateBmUserChanges:
    """Updatable user fields for ``patch`` operations.

    Note: ``locked`` and ``password`` cannot be modified via PATCH per the API spec.
    """

    disabled: bool | None = None
    email: str | None = None
    external_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    preferred_data_locale: str | None = None
    preferred_ui_locale: str | None = None


@dataclass
class ListBmUsersOptions:
    """Options for listing BM users."""

    #: Start index (default 0).
    start: int | None = None
    #: Number of items to return (default 25).
    count: int | None = None
    #: Property selector (default returns shallow user fields).
    select: str | None = None


@dataclass
class SearchBmUsersOptions:
    """Options for searching BM users.

    Searchable fields per the Data API spec: login, email, first_name,
    last_name, external_id, last_login_date, is_locked, is_disabled.
    """

    #: Pre-built OCAPI query object (e.g. ``{"text_query": {...}}``). If
    #: omitted, one is built from the convenience flags below.
    query: Any = None
    #: Free-text phrase searched across login/email/first_name/last_name.
    search_phrase: str | None = None
    #: Match users with a specific login.
    login: str | None = None
    #: Match users with a specific email.
    email: str | None = None
    #: Match locked users.
    locked: bool | None = None
    #: Match disabled users.
    disabled: bool | None = None
    #: Field to sort by (e.g. 'login', 'email', 'last_login_date').
    sort_by: str | None = None
    #: Sort direction.
    sort_order: Literal["asc", "desc"] | None = None
    #: Start index (default 0).
    start: int | None = None
    #: Number of items to return (default 25).
    count: int | None = None
    #: Property selector (default returns shallow user fields).
    select: str | None = None


async def list_bm_users(instance: B2CInstance, options: ListBmUsersOptions | None = None) -> BmUsers:
    """Lists all users on a B2C Commerce instance.

    :param instance: B2C instance to query.
    :param options: Pagination options.
    :returns: Users collection with pagination info.
    """
    opts = options or ListBmUsersOptions()

    result = await instance.ocapi.get(
        "/users",
        {"params": {"query": {"start": opts.start, "count": opts.count, "select": opts.select or "(**)"}}},
    )

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, "Failed to list users", _USERS_READ_SCOPES)

    return cast(BmUsers, result.data)


async def get_bm_user(instance: B2CInstance, login: str) -> BmUser:
    """Gets a single user by login (email).

    :param instance: B2C instance.
    :param login: User login.
    :returns: User details.
    """
    result = await instance.ocapi.get("/users/{login}", {"params": {"path": {"login": login}}})

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to get user {login}", _USERS_READ_SCOPES)

    return cast(BmUser, result.data)


async def whoami_bm_user(instance: B2CInstance) -> BmUser:
    """Returns details for the currently authenticated user.

    Useful for verifying which BM identity is in use on an instance.

    :param instance: B2C instance.
    :returns: Current user details (includes password expiration info).
    """
    assert_ocapi_compatibility_allowed(instance.api_backend, "Business Manager current-user lookup (whoami)")
    result = await instance.ocapi.get("/users/this")

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, "Failed to get current user")

    return cast(BmUser, result.data)


async def update_bm_user(instance: B2CInstance, login: str, changes: UpdateBmUserChanges) -> BmUser:
    """Updates an existing user.

    The ``locked`` flag and the user ``password`` cannot be updated with this
    resource.

    :param instance: B2C instance.
    :param login: User login.
    :param changes: Fields to update.
    :returns: Updated user.
    """
    body = {
        "disabled": changes.disabled,
        "email": changes.email,
        "external_id": changes.external_id,
        "first_name": changes.first_name,
        "last_name": changes.last_name,
        "preferred_data_locale": changes.preferred_data_locale,
        "preferred_ui_locale": changes.preferred_ui_locale,
    }

    result = await instance.ocapi.patch("/users/{login}", {"params": {"path": {"login": login}}, "body": body})

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to update user {login}", _USERS_RW_SCOPES)

    return cast(BmUser, result.data)


async def delete_bm_user(instance: B2CInstance, login: str) -> None:
    """Deletes a user from an instance.

    :param instance: B2C instance.
    :param login: User login.
    """
    result = await instance.ocapi.delete("/users/{login}", {"params": {"path": {"login": login}}})

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to delete user {login}", _USERS_RW_SCOPES)


def _build_search_query(options: SearchBmUsersOptions) -> Any:
    """Build the OCAPI query DSL from the portable convenience flags.

    Combines the provided criteria into a ``bool_query``, or falls back to a
    ``match_all_query`` when no criteria are given.
    """
    if options.query is not None:
        return options.query

    queries: list[dict[str, Any]] = []

    if options.search_phrase:
        queries.append(
            {
                "text_query": {
                    "fields": ["login", "email", "first_name", "last_name"],
                    "search_phrase": options.search_phrase,
                }
            }
        )
    if options.login is not None:
        queries.append({"term_query": {"fields": ["login"], "operator": "is", "values": [options.login]}})
    if options.email is not None:
        queries.append({"term_query": {"fields": ["email"], "operator": "is", "values": [options.email]}})
    if options.locked is not None:
        queries.append({"term_query": {"fields": ["is_locked"], "operator": "is", "values": [options.locked]}})
    if options.disabled is not None:
        queries.append({"term_query": {"fields": ["is_disabled"], "operator": "is", "values": [options.disabled]}})

    if not queries:
        return {"match_all_query": {}}
    if len(queries) == 1:
        return queries[0]
    return {"bool_query": {"must": queries}}


async def search_bm_users(instance: B2CInstance, options: SearchBmUsersOptions | None = None) -> BmUserSearchResult:
    """Searches users on an instance.

    Supports either a fully-formed OCAPI query (``options.query``) or
    convenience flags (``search_phrase``, ``login``, ``email``, ``locked``,
    ``disabled``) which are combined into a ``bool_query``. If no criteria are
    provided a ``match_all_query`` is used.

    :param instance: B2C instance.
    :param options: Search options.
    :returns: User search result.
    """
    opts = options or SearchBmUsersOptions()

    query = _build_search_query(opts)
    sorts = [{"field": opts.sort_by, "sort_order": opts.sort_order or "asc"}] if opts.sort_by else None

    body = {
        "query": query,
        "start": opts.start,
        "count": opts.count,
        "sorts": sorts,
        "select": opts.select or "(**)",
    }

    result = await instance.ocapi.post("/user_search", {"body": body})

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, "Failed to search users")

    return cast(BmUserSearchResult, result.data)


async def get_bm_user_access_key(instance: B2CInstance, login: str, scope: str) -> BmAccessKeyDetails:
    """Gets a single access key for an externally-managed user.

    :param instance: B2C instance.
    :param login: User login.
    :param scope: Access key scope (one of :data:`ACCESS_KEY_SCOPES`).
    :returns: Access key details.
    """
    assert_ocapi_compatibility_allowed(instance.api_backend, "Business Manager access-key administration")
    result = await instance.ocapi.get(
        "/users/{login}/access_key/{scope}", {"params": {"path": {"login": login, "scope": scope}}}
    )

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to get access key ({scope}) for {login}")

    return cast(BmAccessKeyDetails, result.data)


async def create_bm_user_access_key(instance: B2CInstance, login: str, scope: str) -> BmAccessKeyDetails:
    """Creates a single access key for an externally-managed user.

    Replaces any existing key for the same scope. The returned object includes
    the newly-generated ``access_key`` value -- this is the only time it is
    returned, so callers should record it.

    :param instance: B2C instance.
    :param login: User login.
    :param scope: Access key scope.
    :returns: Access key details (including the secret ``access_key`` value).
    """
    assert_ocapi_compatibility_allowed(instance.api_backend, "Business Manager access-key administration")
    result = await instance.ocapi.put(
        "/users/{login}/access_key/{scope}", {"params": {"path": {"login": login, "scope": scope}}}
    )

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to create access key ({scope}) for {login}")

    return cast(BmAccessKeyDetails, result.data)


async def set_bm_user_access_key_enabled(
    instance: B2CInstance, login: str, scope: str, enabled: bool
) -> BmAccessKeyDetails:
    """Enables or disables an existing access key for an externally-managed user.

    :param instance: B2C instance.
    :param login: User login.
    :param scope: Access key scope.
    :param enabled: Whether the access key should be enabled.
    :returns: Updated access key details.
    """
    assert_ocapi_compatibility_allowed(instance.api_backend, "Business Manager access-key administration")
    result = await instance.ocapi.patch(
        "/users/{login}/access_key/{scope}",
        {"params": {"path": {"login": login, "scope": scope}}, "body": {"enabled": enabled}},
    )

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to update access key ({scope}) for {login}")

    return cast(BmAccessKeyDetails, result.data)


async def delete_bm_user_access_key(instance: B2CInstance, login: str, scope: str) -> None:
    """Deletes a single access key for an externally-managed user.

    :param instance: B2C instance.
    :param login: User login.
    :param scope: Access key scope.
    """
    assert_ocapi_compatibility_allowed(instance.api_backend, "Business Manager access-key administration")
    result = await instance.ocapi.delete(
        "/users/{login}/access_key/{scope}", {"params": {"path": {"login": login, "scope": scope}}}
    )

    if result.error:
        assert result.response is not None
        throw_ocapi_error(result.error, result.response, f"Failed to delete access key ({scope}) for {login}")


__all__ = [
    "ACCESS_KEY_SCOPES",
    "AccessKeyScope",
    "BmAccessKeyDetails",
    "BmUser",
    "BmUserSearchResult",
    "BmUsers",
    "ListBmUsersOptions",
    "SearchBmUsersOptions",
    "UpdateBmUserChanges",
    "create_bm_user_access_key",
    "delete_bm_user",
    "delete_bm_user_access_key",
    "get_bm_user",
    "get_bm_user_access_key",
    "list_bm_users",
    "search_bm_users",
    "set_bm_user_access_key_enabled",
    "update_bm_user",
    "whoami_bm_user",
]
