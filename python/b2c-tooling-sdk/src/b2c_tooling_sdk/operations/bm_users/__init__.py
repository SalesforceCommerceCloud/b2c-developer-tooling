# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Business Manager user operations for B2C Commerce instances.

Mirrors ``src/operations/bm-users/index.ts``. Provides functions for querying
and managing instance-level users via the OCAPI Data API. These are distinct
from Account Manager users managed via ``operations/users``.

Create-or-replace is supported via the backend's ``create_or_replace_user``
method (PUT), obtained from :func:`create_users_backend`. On instances using
SSO with Account Manager (the default for production) this is rejected with
``LocalUserCreationException`` -- local user creation must be enabled on the
instance for it to succeed; otherwise provision users in Account Manager and
use these operations for read/search/update/delete plus access-key
administration.

Core user functions:

- :func:`list_bm_users` - List all users on an instance.
- :func:`get_bm_user` - Get a user by login.
- :func:`whoami_bm_user` - Get the currently authenticated user.
- :func:`search_bm_users` - Search users with filter expressions.
- :func:`update_bm_user` - Update user attributes (locale, external_id, disabled).
- :func:`delete_bm_user` - Delete a user from the instance.

Access keys (externally-managed users):

- :func:`get_bm_user_access_key` - Read access key details.
- :func:`create_bm_user_access_key` - Create / rotate an access key.
- :func:`set_bm_user_access_key_enabled` - Enable / disable an access key.
- :func:`delete_bm_user_access_key` - Delete an access key.
"""

from __future__ import annotations

from b2c_tooling_sdk.operations.bm_users.backend import UsersBackendConfig, create_users_backend
from b2c_tooling_sdk.operations.bm_users.ocapi_backend import OcapiUsersBackend
from b2c_tooling_sdk.operations.bm_users.scapi_backend import ScapiUsersBackend, ScapiUsersBackendConfig
from b2c_tooling_sdk.operations.bm_users.types import (
    CreateUserInput,
    ListUsersOptions,
    ListUsersResult,
    SearchUsersOptions,
    UpdateUserChanges,
    UserInfo,
    UsersBackend,
)
from b2c_tooling_sdk.operations.bm_users.users import (
    ACCESS_KEY_SCOPES,
    AccessKeyScope,
    BmAccessKeyDetails,
    BmUser,
    BmUsers,
    BmUserSearchResult,
    ListBmUsersOptions,
    SearchBmUsersOptions,
    UpdateBmUserChanges,
    create_bm_user_access_key,
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

__all__ = [
    "ACCESS_KEY_SCOPES",
    "AccessKeyScope",
    "BmAccessKeyDetails",
    "BmUser",
    "BmUserSearchResult",
    "BmUsers",
    "CreateUserInput",
    "ListBmUsersOptions",
    "ListUsersOptions",
    "ListUsersResult",
    "OcapiUsersBackend",
    "ScapiUsersBackend",
    "ScapiUsersBackendConfig",
    "SearchBmUsersOptions",
    "SearchUsersOptions",
    "UpdateBmUserChanges",
    "UpdateUserChanges",
    "UserInfo",
    "UsersBackend",
    "UsersBackendConfig",
    "create_bm_user_access_key",
    "create_users_backend",
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
