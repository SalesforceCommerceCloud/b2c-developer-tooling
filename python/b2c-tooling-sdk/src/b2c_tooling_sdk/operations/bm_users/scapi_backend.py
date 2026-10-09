# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""SCAPI implementation of the Business Manager users backend.

Mirrors ``src/operations/bm-users/scapi-backend.ts``.
"""

from __future__ import annotations

from typing import Any, Literal, cast

from b2c_tooling_sdk.clients.custom_apis import build_tenant_scope, to_organization_id
from b2c_tooling_sdk.clients.dual_backend_factory import ScapiBackendCtorConfig
from b2c_tooling_sdk.clients.scapi_backend_utils import (
    ScapiCapabilityUnsupportedError,
    create_scapi_request_error,
    scapi_capability_unsupported_message,
)
from b2c_tooling_sdk.clients.scapi_merchant_users import (
    SCAPI_MERCHANT_USERS_READ_SCOPES,
    SCAPI_MERCHANT_USERS_RW_SCOPES,
    ScapiMerchantUsersClient,
    ScapiMerchantUsersClientConfig,
    create_scapi_merchant_users_client,
)
from b2c_tooling_sdk.clients.scapi_scope_tier import ScopeTierManager
from b2c_tooling_sdk.operations.bm_users.types import (
    CreateUserInput,
    ListUsersOptions,
    ListUsersResult,
    SearchUsersOptions,
    UpdateUserChanges,
    UserInfo,
)

#: Configuration for :class:`ScapiUsersBackend`. Alias of the shared
#: :class:`~b2c_tooling_sdk.clients.dual_backend_factory.ScapiBackendCtorConfig`
#: (``short_code``, ``tenant_id``, ``auth``, ``instance`` -- ``instance`` is
#: unused by Users, accepted only for compatibility with the dual-backend factory).
ScapiUsersBackendConfig = ScapiBackendCtorConfig


def _map_scapi_user(scapi: dict[str, Any]) -> UserInfo:
    return UserInfo(
        login=scapi.get("login") or "",
        email=scapi.get("email"),
        first_name=scapi.get("firstName"),
        last_name=scapi.get("lastName"),
        external_id=scapi.get("externalId"),
        disabled=scapi.get("disabled"),
        locked=scapi.get("locked"),
        last_login_date=scapi.get("lastLoginDate"),
        password_expiration_date=scapi.get("passwordExpirationDate"),
        password_modification_date=scapi.get("passwordModificationDate"),
        preferred_data_locale=scapi.get("preferredDataLocale"),
        preferred_ui_locale=scapi.get("preferredUiLocale"),
        roles=scapi.get("roles"),
        raw=scapi,
    )


#: Maps an OCAPI-style sort field name to the canonical :class:`UserInfo` attribute.
_SORT_FIELD_ALIASES: dict[str, str] = {
    "first_name": "first_name",
    "last_name": "last_name",
    "external_id": "external_id",
    "last_login_date": "last_login_date",
    "is_locked": "locked",
    "is_disabled": "disabled",
}


def _to_canonical_sort_field(field: str) -> str:
    return _SORT_FIELD_ALIASES.get(field, field)


class ScapiUsersBackend:
    """Manages BM users through the SCAPI Merchant Users Admin API."""

    def __init__(self, config: ScapiUsersBackendConfig) -> None:
        self._config = config
        self._organization_id = to_organization_id(config.tenant_id)
        self._scope_tier: ScopeTierManager[ScapiMerchantUsersClient] = ScopeTierManager(
            build_client=self._build_client,
            rw_scopes=list(SCAPI_MERCHANT_USERS_RW_SCOPES),
            read_scopes=list(SCAPI_MERCHANT_USERS_READ_SCOPES),
            domain_name="Users",
        )

    @property
    def name(self) -> Literal["scapi"]:
        return "scapi"

    async def list_users(self, options: ListUsersOptions | None = None) -> ListUsersResult:
        opts = options or ListUsersOptions()
        start = opts.start if opts.start is not None else 0
        count = opts.count if opts.count is not None else 25

        async def _do(client: ScapiMerchantUsersClient) -> ListUsersResult:
            result = await client.get(
                "/organizations/{organizationId}/users",
                {
                    "params": {
                        "path": {"organizationId": self._organization_id},
                        "query": {"limit": count, "offset": start},
                    }
                },
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, "Failed to list users")
            data = cast("dict[str, Any]", result.data)
            hits = [_map_scapi_user(user) for user in data.get("data") or []]
            total = cast("int | None", data.get("total"))
            offset = cast("int | None", data.get("offset"))
            limit = cast("int | None", data.get("limit"))
            return ListUsersResult(
                total=total if total is not None else 0,
                start=offset if offset is not None else start,
                count=limit if limit is not None else count,
                hits=hits,
            )

        return await self._scope_tier.try_read(_do)

    async def search_users(self, options: SearchUsersOptions | None = None) -> ListUsersResult:
        opts = options or SearchUsersOptions()
        if opts.query is not None:
            raise ScapiCapabilityUnsupportedError(
                f"{scapi_capability_unsupported_message('raw OCAPI user-search JSON')} "
                "Use portable search flags to stay on SCAPI."
            )

        all_users: list[UserInfo] = []
        offset = 0
        page_size = 200
        while True:
            page = await self.list_users(ListUsersOptions(start=offset, count=page_size))
            all_users.extend(page.hits)
            offset += len(page.hits)
            if len(page.hits) == 0 or offset >= page.total:
                break

        phrase = opts.search_phrase.lower() if opts.search_phrase else None

        def _matches(user: UserInfo) -> bool:
            if opts.login is not None and user.login != opts.login:
                return False
            if opts.email is not None and user.email != opts.email:
                return False
            if opts.locked is not None and user.locked != opts.locked:
                return False
            if opts.disabled is not None and user.disabled != opts.disabled:
                return False
            if not phrase:
                return True
            return any(
                value is not None and phrase in value.lower()
                for value in (user.login, user.email, user.first_name, user.last_name)
            )

        filtered = [user for user in all_users if _matches(user)]

        if opts.sort_by:
            field_name = _to_canonical_sort_field(opts.sort_by)
            reverse = opts.sort_order == "desc"
            filtered.sort(key=lambda user: str(getattr(user, field_name, "") or ""), reverse=reverse)

        start = opts.start if opts.start is not None else 0
        count = opts.count if opts.count is not None else 25
        hits = filtered[start : start + count]
        return ListUsersResult(total=len(filtered), start=start, count=len(hits), hits=hits)

    async def get_user(self, login: str) -> UserInfo:
        async def _do(client: ScapiMerchantUsersClient) -> UserInfo:
            result = await client.get(
                "/organizations/{organizationId}/users/{login}",
                {"params": {"path": {"organizationId": self._organization_id, "login": login}}},
            )
            if result.error or result.data is None:
                raise create_scapi_request_error(result.error, result.response, f"Failed to get user {login}")
            return _map_scapi_user(cast("dict[str, Any]", result.data))

        return await self._scope_tier.try_read(_do)

    async def create_or_replace_user(self, login: str, input: CreateUserInput) -> UserInfo:
        client = self._scope_tier.get_client_for_write()
        body: dict[str, Any] = {
            "login": input.login,
            "email": input.email,
            "firstName": input.first_name,
            "lastName": input.last_name,
            "externalId": input.external_id,
            "password": input.password,
            "disabled": input.disabled,
            "preferredDataLocale": input.preferred_data_locale,
            "preferredUiLocale": input.preferred_ui_locale,
            "roles": input.roles,
        }
        result = await client.put(
            "/organizations/{organizationId}/users/{login}",
            {"params": {"path": {"organizationId": self._organization_id, "login": login}}, "body": body},
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(result.error, result.response, f"Failed to create user {login}")
        return _map_scapi_user(cast("dict[str, Any]", result.data))

    async def update_user(self, login: str, changes: UpdateUserChanges) -> UserInfo:
        # PATCH does not expose `disabled`, but the live API's replace operation
        # does. Preserve the current writable fields and use PUT for that case.
        if changes.disabled is not None:
            current = await self.get_user(login)
            if not current.email:
                raise RuntimeError(f"Cannot update disabled status for {login}: the current user response has no email")
            return await self.create_or_replace_user(
                login,
                CreateUserInput(
                    login=login,
                    email=changes.email if changes.email is not None else current.email,
                    first_name=changes.first_name if changes.first_name is not None else current.first_name,
                    last_name=changes.last_name if changes.last_name is not None else current.last_name,
                    external_id=changes.external_id if changes.external_id is not None else current.external_id,
                    disabled=changes.disabled,
                    preferred_data_locale=(
                        changes.preferred_data_locale
                        if changes.preferred_data_locale is not None
                        else current.preferred_data_locale
                    ),
                    preferred_ui_locale=(
                        changes.preferred_ui_locale
                        if changes.preferred_ui_locale is not None
                        else current.preferred_ui_locale
                    ),
                    roles=current.roles,
                ),
            )

        client = self._scope_tier.get_client_for_write()
        body: dict[str, Any] = {
            "email": changes.email,
            "firstName": changes.first_name,
            "lastName": changes.last_name,
            "externalId": changes.external_id,
            "preferredDataLocale": changes.preferred_data_locale,
            "preferredUiLocale": changes.preferred_ui_locale,
        }
        result = await client.patch(
            "/organizations/{organizationId}/users/{login}",
            {"params": {"path": {"organizationId": self._organization_id, "login": login}}, "body": body},
        )
        if result.error or result.data is None:
            raise create_scapi_request_error(result.error, result.response, f"Failed to update user {login}")
        return _map_scapi_user(cast("dict[str, Any]", result.data))

    async def delete_user(self, login: str) -> None:
        client = self._scope_tier.get_client_for_write()
        result = await client.delete(
            "/organizations/{organizationId}/users/{login}",
            {"params": {"path": {"organizationId": self._organization_id, "login": login}}},
        )
        if result.error:
            raise create_scapi_request_error(result.error, result.response, f"Failed to delete user {login}")

    def _build_client(self, scopes: list[str]) -> ScapiMerchantUsersClient:
        client_config = ScapiMerchantUsersClientConfig(
            short_code=self._config.short_code,
            tenant_id=self._config.tenant_id,
            scopes=[*scopes, build_tenant_scope(self._config.tenant_id)],
        )
        return create_scapi_merchant_users_client(client_config, self._config.auth)


__all__ = ["ScapiUsersBackend", "ScapiUsersBackendConfig"]
