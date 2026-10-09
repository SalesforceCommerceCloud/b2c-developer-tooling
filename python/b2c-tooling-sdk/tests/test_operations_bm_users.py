# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Tests for the Business Manager users operations and SCAPI/OCAPI dual backend.

Covers the OCAPI free functions (``users.py``), the ``OcapiUsersBackend`` and
``ScapiUsersBackend`` dual-backend implementations, and backend selection via
``create_users_backend`` (explicit ocapi/scapi and auto with OCAPI fallback).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
import respx

from b2c_tooling_sdk.clients.error_utils import OcapiDeprecatedError
from b2c_tooling_sdk.clients.ocapi import DEFAULT_API_VERSION, create_ocapi_client
from b2c_tooling_sdk.clients.scapi_backend_utils import ScapiCapabilityUnsupportedError, ScapiRequestError
from b2c_tooling_sdk.operations.bm_users import (
    CreateUserInput,
    ListUsersOptions,
    OcapiUsersBackend,
    ScapiUsersBackend,
    ScapiUsersBackendConfig,
    SearchUsersOptions,
    UpdateUserChanges,
    UsersBackendConfig,
    create_bm_user_access_key,
    create_users_backend,
    delete_bm_user,
    delete_bm_user_access_key,
    get_bm_user,
    get_bm_user_access_key,
    list_bm_users,
    search_bm_users,
    set_bm_user_access_key_enabled,
    update_bm_user,
    whoami_bm_user,
)
from b2c_tooling_sdk.operations.bm_users.users import ListBmUsersOptions, SearchBmUsersOptions, UpdateBmUserChanges

HOSTNAME = "example.demandware.net"
SHORT_CODE = "abcd1234"
TENANT_ID = "zzxy_prd"
ORGANIZATION_ID = "f_ecom_zzxy_prd"
OCAPI_BASE = f"https://{HOSTNAME}/s/-/dw/data/{DEFAULT_API_VERSION}"
USERS_URL = f"{OCAPI_BASE}/users"
USER_SEARCH_URL = f"{OCAPI_BASE}/user_search"
SCAPI_USERS_URL = (
    f"https://{SHORT_CODE}.api.commercecloud.salesforce.com/merchant/users/v1/organizations/{ORGANIZATION_ID}/users"
)


def _login_url(login: str) -> str:
    return f"{USERS_URL}/{login}"


def _access_key_url(login: str, scope: str) -> str:
    return f"{USERS_URL}/{login}/access_key/{scope}"


def _scapi_login_url(login: str) -> str:
    return f"{SCAPI_USERS_URL}/{login}"


class _FakeOcapiAuth:
    """Minimal auth strategy for the OCAPI auth middleware (header injection only)."""

    def __init__(self, header: str = "Bearer ocapi-token") -> None:
        self._header = header
        self.invalidated = False

    async def get_authorization_header(self) -> str:
        return self._header

    def invalidate_token(self) -> None:
        self.invalidated = True

    async def fetch(self, url: str, **kwargs: object) -> httpx.Response:  # pragma: no cover - unused by HttpClient
        raise NotImplementedError


class _FakeScapiAuth:
    """Fake ``ScopedAuthStrategy`` for the default-scopes (legacy) SCAPI auth path
    used by the Merchant Users client -- matches ``_FakeAuth`` in
    ``test_clients_scapi_domains.py``."""

    def __init__(self) -> None:
        self.header = "Bearer scapi-token"
        self.requested_scopes: list[str] = []
        self.invalidated = 0

    def with_additional_scopes(self, scopes: list[str]) -> _FakeScapiAuth:
        self.requested_scopes = list(scopes)
        return self

    async def get_authorization_header(self) -> str:
        return self.header

    def invalidate_token(self) -> None:
        self.invalidated += 1


@dataclass
class _FakeScapiClientConfig:
    """Duck-typed stand-in for ``ScapiClientConfig`` (short_code/tenant_id/auth)."""

    short_code: str
    tenant_id: str
    auth: Any


class _FakeInstance:
    """Duck-typed stand-in for ``B2CInstance`` exposing only what the dual-backend
    factory and the two users backends need: ``api_backend``,
    ``scapi_client_config``, and a pre-built ``ocapi`` client."""

    def __init__(
        self,
        *,
        api_backend: str = "auto",
        scapi_client_config: _FakeScapiClientConfig | None = None,
        ocapi_client: Any = None,
    ) -> None:
        self.api_backend = api_backend
        self.scapi_client_config = scapi_client_config
        self.ocapi = ocapi_client


def _query_val(url: httpx.URL, key: str) -> str:
    return parse_qs(urlparse(str(url)).query)[key][0]


def _ocapi_user(login: str = "jdoe", **overrides: Any) -> dict[str, Any]:
    user = {
        "login": login,
        "email": f"{login}@example.com",
        "first_name": "Jane",
        "last_name": "Doe",
        "external_id": "ext-1",
        "disabled": False,
        "locked": False,
        "last_login_date": "2025-01-01T00:00:00Z",
        "preferred_data_locale": "en",
        "preferred_ui_locale": "en",
        "roles": ["Administrator"],
    }
    user.update(overrides)
    return user


def _scapi_user(login: str = "jdoe", **overrides: Any) -> dict[str, Any]:
    user = {
        "login": login,
        "email": f"{login}@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "externalId": "ext-1",
        "disabled": False,
        "locked": False,
        "preferredDataLocale": "en",
        "preferredUiLocale": "en",
        "roles": ["Administrator"],
    }
    user.update(overrides)
    return user


# --- OCAPI free functions (users.py) -----------------------------------------------


@respx.mock
async def test_list_bm_users_happy_path() -> None:
    respx.get(USERS_URL).mock(
        return_value=httpx.Response(
            200, json={"data": [_ocapi_user("a"), _ocapi_user("b")], "total": 2, "start": 0, "count": 2}
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    result = await list_bm_users(instance, ListBmUsersOptions(start=0, count=25))  # type: ignore[arg-type]

    assert result["total"] == 2
    assert [u["login"] for u in result["data"]] == ["a", "b"]


@respx.mock
async def test_get_bm_user_happy_path() -> None:
    respx.get(_login_url("jdoe")).mock(return_value=httpx.Response(200, json=_ocapi_user("jdoe")))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    user = await get_bm_user(instance, "jdoe")  # type: ignore[arg-type]

    assert user["login"] == "jdoe"


@respx.mock
async def test_get_bm_user_raises_runtime_error_on_generic_failure() -> None:
    respx.get(_login_url("missing")).mock(
        return_value=httpx.Response(404, json={"fault": {"type": "UserNotFoundException", "message": "no such user"}})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    with pytest.raises(RuntimeError) as exc_info:
        await get_bm_user(instance, "missing")  # type: ignore[arg-type]

    assert "Failed to get user missing" in str(exc_info.value)
    assert "no such user" in str(exc_info.value)


@respx.mock
async def test_get_bm_user_raises_deprecated_error_on_ocapi_disabled() -> None:
    respx.get(_login_url("jdoe")).mock(
        return_value=httpx.Response(
            403, json={"fault": {"type": "OcapiDeprecatedException", "message": "OCAPI is deprecated"}}
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    with pytest.raises(OcapiDeprecatedError):
        await get_bm_user(instance, "jdoe")  # type: ignore[arg-type]


@respx.mock
async def test_whoami_bm_user_happy_path() -> None:
    respx.get(f"{USERS_URL}/this").mock(return_value=httpx.Response(200, json=_ocapi_user("current")))
    instance = _FakeInstance(api_backend="auto", ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    user = await whoami_bm_user(instance)  # type: ignore[arg-type]

    assert user["login"] == "current"


@respx.mock
async def test_whoami_bm_user_rejected_under_explicit_scapi_preference() -> None:
    # Explicit SCAPI preference should reject this OCAPI-only compatibility
    # operation before any network call is made.
    instance = _FakeInstance(api_backend="scapi", ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    with pytest.raises(ScapiCapabilityUnsupportedError):
        await whoami_bm_user(instance)  # type: ignore[arg-type]


@respx.mock
async def test_update_bm_user_sends_snake_case_body() -> None:
    route = respx.patch(_login_url("jdoe")).mock(
        return_value=httpx.Response(200, json=_ocapi_user("jdoe", email="new@example.com"))
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    user = await update_bm_user(instance, "jdoe", UpdateBmUserChanges(email="new@example.com"))  # type: ignore[arg-type]

    assert user["email"] == "new@example.com"
    body = json.loads(route.calls.last.request.content)
    assert body["email"] == "new@example.com"


@respx.mock
async def test_delete_bm_user_happy_path() -> None:
    respx.delete(_login_url("jdoe")).mock(return_value=httpx.Response(204))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    await delete_bm_user(instance, "jdoe")  # type: ignore[arg-type]


@respx.mock
async def test_search_bm_users_builds_bool_query_from_convenience_flags() -> None:
    route = respx.post(USER_SEARCH_URL).mock(
        return_value=httpx.Response(200, json={"hits": [_ocapi_user("jdoe")], "total": 1, "start": 0, "count": 1})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    result = await search_bm_users(  # type: ignore[arg-type]
        instance, SearchBmUsersOptions(search_phrase="jane", locked=True)
    )

    assert result["total"] == 1
    body = json.loads(route.calls.last.request.content)
    assert body["query"]["bool_query"]["must"][0]["text_query"]["search_phrase"] == "jane"
    assert body["query"]["bool_query"]["must"][1]["term_query"]["fields"] == ["is_locked"]


@respx.mock
async def test_search_bm_users_defaults_to_match_all_query() -> None:
    route = respx.post(USER_SEARCH_URL).mock(
        return_value=httpx.Response(200, json={"hits": [], "total": 0, "start": 0, "count": 0})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    await search_bm_users(instance)  # type: ignore[arg-type]

    body = json.loads(route.calls.last.request.content)
    assert body["query"] == {"match_all_query": {}}


@respx.mock
async def test_search_bm_users_passes_through_raw_query() -> None:
    route = respx.post(USER_SEARCH_URL).mock(
        return_value=httpx.Response(200, json={"hits": [], "total": 0, "start": 0, "count": 0})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    raw_query = {"term_query": {"fields": ["email"], "operator": "is", "values": ["x@y.com"]}}

    await search_bm_users(instance, SearchBmUsersOptions(query=raw_query))  # type: ignore[arg-type]

    body = json.loads(route.calls.last.request.content)
    assert body["query"] == raw_query


@respx.mock
async def test_access_key_lifecycle() -> None:
    respx.get(_access_key_url("jdoe", "WEBDAV_AND_STUDIO")).mock(
        return_value=httpx.Response(200, json={"scope": "WEBDAV_AND_STUDIO", "enabled": True})
    )
    respx.put(_access_key_url("jdoe", "WEBDAV_AND_STUDIO")).mock(
        return_value=httpx.Response(200, json={"scope": "WEBDAV_AND_STUDIO", "enabled": True, "access_key": "secret"})
    )
    respx.patch(_access_key_url("jdoe", "WEBDAV_AND_STUDIO")).mock(
        return_value=httpx.Response(200, json={"scope": "WEBDAV_AND_STUDIO", "enabled": False})
    )
    respx.delete(_access_key_url("jdoe", "WEBDAV_AND_STUDIO")).mock(return_value=httpx.Response(204))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    details = await get_bm_user_access_key(instance, "jdoe", "WEBDAV_AND_STUDIO")  # type: ignore[arg-type]
    assert details["enabled"] is True

    created = await create_bm_user_access_key(instance, "jdoe", "WEBDAV_AND_STUDIO")  # type: ignore[arg-type]
    assert created["access_key"] == "secret"

    updated = await set_bm_user_access_key_enabled(instance, "jdoe", "WEBDAV_AND_STUDIO", False)  # type: ignore[arg-type]
    assert updated["enabled"] is False

    await delete_bm_user_access_key(instance, "jdoe", "WEBDAV_AND_STUDIO")  # type: ignore[arg-type]


@respx.mock
async def test_access_key_functions_rejected_under_explicit_scapi_preference() -> None:
    instance = _FakeInstance(api_backend="scapi", ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))

    with pytest.raises(ScapiCapabilityUnsupportedError):
        await get_bm_user_access_key(instance, "jdoe", "WEBDAV_AND_STUDIO")  # type: ignore[arg-type]
    with pytest.raises(ScapiCapabilityUnsupportedError):
        await create_bm_user_access_key(instance, "jdoe", "WEBDAV_AND_STUDIO")  # type: ignore[arg-type]
    with pytest.raises(ScapiCapabilityUnsupportedError):
        await set_bm_user_access_key_enabled(instance, "jdoe", "WEBDAV_AND_STUDIO", True)  # type: ignore[arg-type]
    with pytest.raises(ScapiCapabilityUnsupportedError):
        await delete_bm_user_access_key(instance, "jdoe", "WEBDAV_AND_STUDIO")  # type: ignore[arg-type]


# --- OcapiUsersBackend -------------------------------------------------------------


@respx.mock
async def test_ocapi_backend_list_users_maps_fields() -> None:
    respx.get(USERS_URL).mock(
        return_value=httpx.Response(200, json={"data": [_ocapi_user("jdoe")], "total": 1, "start": 0, "count": 1})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    result = await backend.list_users()

    assert backend.name == "ocapi"
    assert result.total == 1
    assert result.hits[0].login == "jdoe"
    assert result.hits[0].first_name == "Jane"
    assert result.hits[0].raw == _ocapi_user("jdoe")


@respx.mock
async def test_ocapi_backend_get_user() -> None:
    respx.get(_login_url("jdoe")).mock(return_value=httpx.Response(200, json=_ocapi_user("jdoe")))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    user = await backend.get_user("jdoe")

    assert user.login == "jdoe"
    assert user.external_id == "ext-1"


@respx.mock
async def test_ocapi_backend_search_users_maps_fields() -> None:
    respx.post(USER_SEARCH_URL).mock(
        return_value=httpx.Response(200, json={"hits": [_ocapi_user("jdoe")], "total": 1, "start": 0, "count": 1})
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    result = await backend.search_users(SearchUsersOptions(login="jdoe"))

    assert result.total == 1
    assert result.hits[0].login == "jdoe"


@respx.mock
async def test_ocapi_backend_create_or_replace_user() -> None:
    route = respx.put(_login_url("jdoe")).mock(return_value=httpx.Response(200, json=_ocapi_user("jdoe")))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    user = await backend.create_or_replace_user(
        "jdoe", CreateUserInput(login="jdoe", email="jdoe@example.com", first_name="Jane")
    )

    assert user.login == "jdoe"
    body = json.loads(route.calls.last.request.content)
    assert body["first_name"] == "Jane"


@respx.mock
async def test_ocapi_backend_create_or_replace_user_raises_on_failure() -> None:
    respx.put(_login_url("jdoe")).mock(
        return_value=httpx.Response(
            400, json={"fault": {"type": "LocalUserCreationException", "message": "SSO managed"}}
        )
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    with pytest.raises(RuntimeError) as exc_info:
        await backend.create_or_replace_user("jdoe", CreateUserInput(login="jdoe", email="jdoe@example.com"))

    assert "SSO managed" in str(exc_info.value)


@respx.mock
async def test_ocapi_backend_update_user_translates_camel_case_to_snake_case() -> None:
    route = respx.patch(_login_url("jdoe")).mock(
        return_value=httpx.Response(200, json=_ocapi_user("jdoe", last_name="Smith"))
    )
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    user = await backend.update_user("jdoe", UpdateUserChanges(last_name="Smith"))

    assert user.last_name == "Smith"
    body = json.loads(route.calls.last.request.content)
    assert body["last_name"] == "Smith"


@respx.mock
async def test_ocapi_backend_delete_user() -> None:
    respx.delete(_login_url("jdoe")).mock(return_value=httpx.Response(204))
    instance = _FakeInstance(ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()))
    backend = OcapiUsersBackend(instance)  # type: ignore[arg-type]

    await backend.delete_user("jdoe")


# --- ScapiUsersBackend --------------------------------------------------------------


def _scapi_backend(auth: _FakeScapiAuth | None = None) -> ScapiUsersBackend:
    config = ScapiUsersBackendConfig(
        short_code=SHORT_CODE,
        tenant_id=TENANT_ID,
        auth=auth or _FakeScapiAuth(),  # type: ignore[arg-type]
        instance=_FakeInstance(),  # type: ignore[arg-type]
    )
    return ScapiUsersBackend(config)


@respx.mock
async def test_scapi_backend_list_users_maps_fields() -> None:
    respx.get(SCAPI_USERS_URL).mock(
        return_value=httpx.Response(200, json={"data": [_scapi_user("jdoe")], "total": 1, "offset": 0, "limit": 25})
    )
    backend = _scapi_backend()

    result = await backend.list_users()

    assert backend.name == "scapi"
    assert result.total == 1
    assert result.hits[0].login == "jdoe"
    assert result.hits[0].first_name == "Jane"


@respx.mock
async def test_scapi_backend_list_users_honors_pagination() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        offset = int(_query_val(request.url, "offset"))
        limit = int(_query_val(request.url, "limit"))
        return httpx.Response(200, json={"data": [], "total": 0, "offset": offset, "limit": limit})

    respx.get(SCAPI_USERS_URL).mock(side_effect=handler)
    backend = _scapi_backend()

    result = await backend.list_users(ListUsersOptions(start=10, count=5))

    assert result.start == 10
    assert result.count == 5


@respx.mock
async def test_scapi_backend_get_user() -> None:
    respx.get(_scapi_login_url("jdoe")).mock(return_value=httpx.Response(200, json=_scapi_user("jdoe")))
    backend = _scapi_backend()

    user = await backend.get_user("jdoe")

    assert user.login == "jdoe"
    assert user.external_id == "ext-1"


@respx.mock
async def test_scapi_backend_get_user_raises_scapi_request_error() -> None:
    respx.get(_scapi_login_url("missing")).mock(
        return_value=httpx.Response(404, json={"title": "Not Found", "type": "not-found", "detail": "no such user"})
    )
    backend = _scapi_backend()

    with pytest.raises(ScapiRequestError) as exc_info:
        await backend.get_user("missing")

    assert exc_info.value.status == 404
    assert "no such user" in str(exc_info.value)


@respx.mock
async def test_scapi_backend_create_or_replace_user() -> None:
    route = respx.put(_scapi_login_url("jdoe")).mock(return_value=httpx.Response(200, json=_scapi_user("jdoe")))
    backend = _scapi_backend()

    user = await backend.create_or_replace_user(
        "jdoe", CreateUserInput(login="jdoe", email="jdoe@example.com", first_name="Jane")
    )

    assert user.login == "jdoe"
    body = json.loads(route.calls.last.request.content)
    assert body["firstName"] == "Jane"


@respx.mock
async def test_scapi_backend_update_user_patches_when_disabled_not_set() -> None:
    route = respx.patch(_scapi_login_url("jdoe")).mock(
        return_value=httpx.Response(200, json=_scapi_user("jdoe", lastName="Smith"))
    )
    backend = _scapi_backend()

    user = await backend.update_user("jdoe", UpdateUserChanges(last_name="Smith"))

    assert user.last_name == "Smith"
    body = json.loads(route.calls.last.request.content)
    assert body["lastName"] == "Smith"


@respx.mock
async def test_scapi_backend_update_user_disabled_reads_then_puts() -> None:
    respx.get(_scapi_login_url("jdoe")).mock(return_value=httpx.Response(200, json=_scapi_user("jdoe")))
    route = respx.put(_scapi_login_url("jdoe")).mock(
        return_value=httpx.Response(200, json=_scapi_user("jdoe", disabled=True))
    )
    backend = _scapi_backend()

    user = await backend.update_user("jdoe", UpdateUserChanges(disabled=True))

    assert user.disabled is True
    body = json.loads(route.calls.last.request.content)
    assert body["disabled"] is True
    # Preserves fields from the read, not just the changed one.
    assert body["email"] == "jdoe@example.com"
    assert body["roles"] == ["Administrator"]


@respx.mock
async def test_scapi_backend_delete_user() -> None:
    respx.delete(_scapi_login_url("jdoe")).mock(return_value=httpx.Response(204))
    backend = _scapi_backend()

    await backend.delete_user("jdoe")


@respx.mock
async def test_scapi_backend_search_users_raw_query_raises_capability_unsupported() -> None:
    backend = _scapi_backend()

    with pytest.raises(ScapiCapabilityUnsupportedError):
        await backend.search_users(SearchUsersOptions(query={"match_all_query": {}}))


@respx.mock
async def test_scapi_backend_search_users_filters_sorts_and_paginates() -> None:
    users = [
        _scapi_user("alice", email="alice@example.com", firstName="Alice", lastName="Zephyr", locked=True),
        _scapi_user("bob", email="bob@example.com", firstName="Bob", lastName="Anders", locked=False),
        _scapi_user("carol", email="carol@example.com", firstName="Carol", lastName="Mid", locked=True),
    ]
    respx.get(SCAPI_USERS_URL).mock(
        return_value=httpx.Response(200, json={"data": users, "total": len(users), "offset": 0, "limit": 200})
    )
    backend = _scapi_backend()

    result = await backend.search_users(SearchUsersOptions(locked=True, sort_by="last_name"))

    assert [u.login for u in result.hits] == ["carol", "alice"]
    assert result.total == 2


@respx.mock
async def test_scapi_backend_search_users_matches_search_phrase() -> None:
    users = [
        _scapi_user("alice", firstName="Alice", lastName="Wonder"),
        _scapi_user("bob", firstName="Bob", lastName="Builder"),
    ]
    respx.get(SCAPI_USERS_URL).mock(
        return_value=httpx.Response(200, json={"data": users, "total": len(users), "offset": 0, "limit": 200})
    )
    backend = _scapi_backend()

    result = await backend.search_users(SearchUsersOptions(search_phrase="wonder"))

    assert [u.login for u in result.hits] == ["alice"]


# --- create_users_backend (backend selection) --------------------------------------


def test_create_users_backend_explicit_ocapi_returns_ocapi_backend() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_users_backend(UsersBackendConfig(instance=instance, preference="ocapi"))  # type: ignore[arg-type]
    assert isinstance(backend, OcapiUsersBackend)
    assert backend.name == "ocapi"


def test_create_users_backend_explicit_scapi_returns_scapi_backend() -> None:
    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeScapiAuth())
    instance = _FakeInstance(scapi_client_config=scapi_config)
    backend = create_users_backend(UsersBackendConfig(instance=instance, preference="scapi"))  # type: ignore[arg-type]
    assert isinstance(backend, ScapiUsersBackend)
    assert backend.name == "scapi"


def test_create_users_backend_explicit_scapi_without_config_raises() -> None:
    instance = _FakeInstance(scapi_client_config=None)
    with pytest.raises(ValueError):
        create_users_backend(UsersBackendConfig(instance=instance, preference="scapi"))  # type: ignore[arg-type]


def test_create_users_backend_auto_without_scapi_config_uses_ocapi() -> None:
    instance = _FakeInstance(api_backend="auto", scapi_client_config=None)
    backend = create_users_backend(UsersBackendConfig(instance=instance, preference=None))  # type: ignore[arg-type]
    assert isinstance(backend, OcapiUsersBackend)


@respx.mock
async def test_create_users_backend_auto_falls_back_to_ocapi_on_safe_rejection() -> None:
    # SCAPI rejects (404 -> a safe fallback trigger); OCAPI then serves the request.
    respx.get(SCAPI_USERS_URL).mock(return_value=httpx.Response(404, json={"title": "gone", "type": "x"}))
    respx.get(USERS_URL).mock(
        return_value=httpx.Response(200, json={"data": [_ocapi_user("jdoe")], "total": 1, "start": 0, "count": 1})
    )

    scapi_config = _FakeScapiClientConfig(short_code=SHORT_CODE, tenant_id=TENANT_ID, auth=_FakeScapiAuth())
    instance = _FakeInstance(
        api_backend="auto",
        scapi_client_config=scapi_config,
        ocapi_client=create_ocapi_client(HOSTNAME, _FakeOcapiAuth()),
    )

    backend = create_users_backend(UsersBackendConfig(instance=instance, preference=None))  # type: ignore[arg-type]
    assert backend.name == "scapi"  # unresolved yet -- reports the primary backend

    result = await backend.list_users()

    assert [u.login for u in result.hits] == ["jdoe"]
    assert backend.name == "ocapi"  # pinned to OCAPI after the fallback
