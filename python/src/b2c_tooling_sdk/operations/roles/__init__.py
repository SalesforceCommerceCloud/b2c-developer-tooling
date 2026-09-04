# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Account Manager role management operations.

Mirrors ``src/operations/roles/index.ts``. Provides high-level functions for
retrieving role information in Account Manager, including listing roles and
getting role details.

## Core Role Functions

- :func:`get_role` -- Get role details by ID
- :func:`list_roles` -- List roles with pagination

## Usage

.. code-block:: python

    from b2c_tooling_sdk.operations.roles import get_role, list_roles, ListRolesOptions
    from b2c_tooling_sdk.clients import create_account_manager_roles_client
    from b2c_tooling_sdk.auth import OAuthStrategy

    auth = OAuthStrategy(client_id="your-client-id", client_secret="your-client-secret")
    client = create_account_manager_roles_client(config, auth)

    # Get a role by ID
    role = await get_role(client, "bm-admin")

    # List roles
    roles = await list_roles(client, ListRolesOptions(size=25, page=0))

    # List roles filtered by target type
    user_roles = await list_roles(client, ListRolesOptions(size=25, page=0, role_target_type="User"))

## Authentication

Role operations require OAuth authentication with appropriate Account Manager permissions.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients import AccountManagerRole as AccountManagerRole
from b2c_tooling_sdk.clients import ListRolesOptions as ListRolesOptions
from b2c_tooling_sdk.clients import RoleCollection as RoleCollection
from b2c_tooling_sdk.clients import get_role as get_role
from b2c_tooling_sdk.clients import list_roles as list_roles

__all__ = [
    "AccountManagerRole",
    "ListRolesOptions",
    "RoleCollection",
    "get_role",
    "list_roles",
]
