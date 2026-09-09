# Copyright (c) 2025, Salesforce, Inc.
# SPDX-License-Identifier: Apache-2.0
# For full license text, see the LICENSE file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
"""Account Manager organization management operations.

Mirrors ``src/operations/orgs/index.ts``. Provides high-level functions for
managing organizations in Account Manager, including retrieving organization
details.

## Core Organization Functions

- :func:`get_org` -- Get organization details by ID
- :func:`get_org_by_name` -- Get organization details by name
- :func:`list_orgs` -- List organizations with pagination

## Usage

.. code-block:: python

    from b2c_tooling_sdk.operations.orgs import get_org, get_org_by_name, list_orgs
    from b2c_tooling_sdk.clients import create_account_manager_orgs_client
    from b2c_tooling_sdk.auth import OAuthStrategy

    auth = OAuthStrategy(client_id="your-client-id", client_secret="your-client-secret")
    client = create_account_manager_orgs_client(config, auth)

    # Get an organization by ID
    org = await get_org(client, "org-id")

    # Get an organization by name
    org = await get_org_by_name(client, "My Organization")

    # List organizations
    orgs = await list_orgs(client, ListOrgsOptions(size=25, page=0))

## Authentication

Organization operations require OAuth authentication with appropriate Account Manager permissions.
"""

from __future__ import annotations

from b2c_tooling_sdk.clients import AccountManagerOrganization as AccountManagerOrganization
from b2c_tooling_sdk.clients import AccountManagerOrgsClient
from b2c_tooling_sdk.clients import ListOrgsOptions as ListOrgsOptions
from b2c_tooling_sdk.clients import OrganizationCollection as OrganizationCollection


async def get_org(client: AccountManagerOrgsClient, org_id: str) -> AccountManagerOrganization:
    """Get an organization by ID.

    :param client: Account Manager Organizations client.
    :param org_id: Organization ID.
    :returns: Organization details.
    :raises RuntimeError: If the organization is not found (404), authentication fails (401),
        permission is denied (403), or other request failures occur.
    """
    return await client.get_org(org_id)


async def get_org_by_name(client: AccountManagerOrgsClient, name: str) -> AccountManagerOrganization:
    """Get an organization by name.

    Performs a case-sensitive prefix search using ``startsWith``, filters to an
    exact match if multiple results are found, and raises if ambiguous.

    :param client: Account Manager Organizations client.
    :param name: Organization name.
    :returns: Organization details.
    :raises RuntimeError: If the organization is not found or if multiple organizations match the name.
    """
    return await client.get_org_by_name(name)


async def list_orgs(
    client: AccountManagerOrgsClient,
    options: ListOrgsOptions | None = None,
) -> OrganizationCollection:
    """List organizations with pagination.

    :param client: Account Manager Organizations client.
    :param options: Pagination options. Set ``all=True`` to retrieve all organizations
        using the max page size of 5000.
    :returns: Paginated organization collection with pagination metadata
        (totalElements, totalPages, number, size).
    """
    return await client.list_orgs(options)


__all__ = [
    "AccountManagerOrganization",
    "ListOrgsOptions",
    "OrganizationCollection",
    "get_org",
    "get_org_by_name",
    "list_orgs",
]
