# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""OCAPI implementation of the Business Manager users backend.

Mirrors ``src/operations/bm-users/ocapi-backend.ts``.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, cast

from b2c_tooling_sdk.clients.error_utils import throw_ocapi_error
from b2c_tooling_sdk.clients.scapi_merchant_users import SCAPI_MERCHANT_USERS_RW_SCOPES
from b2c_tooling_sdk.operations.bm_users.types import (
    CreateUserInput,
    ListUsersOptions,
    ListUsersResult,
    SearchUsersOptions,
    UpdateUserChanges,
    UserInfo,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    BmUser,
    ListBmUsersOptions,
    SearchBmUsersOptions,
    UpdateBmUserChanges,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    delete_bm_user as ocapi_delete_bm_user,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    get_bm_user as ocapi_get_bm_user,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    list_bm_users as ocapi_list_bm_users,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    search_bm_users as ocapi_search_bm_users,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    update_bm_user as ocapi_update_bm_user,
)

if TYPE_CHECKING:
    from b2c_tooling_sdk.instance import B2CInstance


def _map_ocapi_user(ocapi: BmUser) -> UserInfo:
    return UserInfo(
        login=ocapi.get("login") or "",
        email=ocapi.get("email"),
        first_name=ocapi.get("first_name"),
        last_name=ocapi.get("last_name"),
        external_id=ocapi.get("external_id"),
        disabled=ocapi.get("disabled"),
        locked=ocapi.get("locked"),
        last_login_date=ocapi.get("last_login_date"),
        password_expiration_date=ocapi.get("password_expiration_date"),
        password_modification_date=ocapi.get("password_modification_date"),
        preferred_data_locale=ocapi.get("preferred_data_locale"),
        preferred_ui_locale=ocapi.get("preferred_ui_locale"),
        roles=ocapi.get("roles"),
        raw=ocapi,
    )


class OcapiUsersBackend:
    """Manages BM users through the legacy OCAPI Data API ``/users`` resource."""

    def __init__(self, instance: B2CInstance) -> None:
        self._instance = instance

    @property
    def name(self) -> Literal["ocapi"]:
        return "ocapi"

    async def list_users(self, options: ListUsersOptions | None = None) -> ListUsersResult:
        opts = options or ListUsersOptions()
        result = await ocapi_list_bm_users(self._instance, ListBmUsersOptions(start=opts.start, count=opts.count))
        users = cast("list[BmUser]", result.get("data") or [])
        total = cast("int | None", result.get("total"))
        start = cast("int | None", result.get("start"))
        count = cast("int | None", result.get("count"))
        return ListUsersResult(
            total=total if total is not None else 0,
            start=start if start is not None else 0,
            count=count if count is not None else len(users),
            hits=[_map_ocapi_user(user) for user in users],
        )

    async def get_user(self, login: str) -> UserInfo:
        user = await ocapi_get_bm_user(self._instance, login)
        return _map_ocapi_user(user)

    async def search_users(self, options: SearchUsersOptions | None = None) -> ListUsersResult:
        opts = options or SearchUsersOptions()
        result = await ocapi_search_bm_users(
            self._instance,
            SearchBmUsersOptions(
                query=opts.query,
                search_phrase=opts.search_phrase,
                login=opts.login,
                email=opts.email,
                locked=opts.locked,
                disabled=opts.disabled,
                sort_by=opts.sort_by,
                sort_order=opts.sort_order,
                start=opts.start,
                count=opts.count,
            ),
        )
        users = cast("list[BmUser]", result.get("hits") or [])
        total = cast("int | None", result.get("total"))
        start = cast("int | None", result.get("start"))
        count = cast("int | None", result.get("count"))
        return ListUsersResult(
            total=total if total is not None else 0,
            start=start if start is not None else (opts.start or 0),
            count=count if count is not None else len(users),
            hits=[_map_ocapi_user(user) for user in users],
        )

    async def create_or_replace_user(self, login: str, input: CreateUserInput) -> UserInfo:
        # Map canonical camelCase (Python: snake_case) → OCAPI snake_case (identical here).
        body: dict[str, Any] = {
            "login": input.login,
            "email": input.email,
            "first_name": input.first_name,
            "last_name": input.last_name,
            "external_id": input.external_id,
            "password": input.password,
            "disabled": input.disabled,
            "preferred_data_locale": input.preferred_data_locale,
            "preferred_ui_locale": input.preferred_ui_locale,
            "roles": input.roles,
        }
        result = await self._instance.ocapi.put("/users/{login}", {"params": {"path": {"login": login}}, "body": body})
        if result.error:
            assert result.response is not None
            throw_ocapi_error(
                result.error, result.response, f"Failed to create user {login}", SCAPI_MERCHANT_USERS_RW_SCOPES
            )
        return _map_ocapi_user(cast(BmUser, result.data))

    async def update_user(self, login: str, changes: UpdateUserChanges) -> UserInfo:
        ocapi_changes = UpdateBmUserChanges(
            email=changes.email,
            first_name=changes.first_name,
            last_name=changes.last_name,
            external_id=changes.external_id,
            disabled=changes.disabled,
            preferred_data_locale=changes.preferred_data_locale,
            preferred_ui_locale=changes.preferred_ui_locale,
        )
        updated = await ocapi_update_bm_user(self._instance, login, ocapi_changes)
        return _map_ocapi_user(updated)

    async def delete_user(self, login: str) -> None:
        await ocapi_delete_bm_user(self._instance, login)


__all__ = ["OcapiUsersBackend"]
