---
name: b2c-users-roles
description: Manage users and roles with the b2c cli. Covers Account Manager (AM) user CRUD, AM role grant/revoke with scoping, AM organizations, AM API clients, and Business Manager (BM) instance-level role CRUD, user assignment, and permissions. Use when managing users, roles, permissions, organizations, or API clients in Account Manager or Business Manager.
---

# B2C Users and Roles Skill

Use the `b2c` CLI to manage users and roles across Account Manager (AM) and Business Manager (BM).

> **Tip:** If `b2c` is not installed globally, use `npx @salesforce/b2c-cli` instead.

## Overview

| Area | Topic | Description |
|------|-------|-------------|
| Account Manager | `am users` | Create, update, delete AM users |
| Account Manager | `am roles` | List, grant, revoke AM roles (with optional tenant scope) |
| Account Manager | `am orgs` | List organizations |
| Account Manager | `am clients` | Manage API clients |
| Business Manager | `bm roles` | Create, delete instance-level BM roles |
| Business Manager | `bm roles grant/revoke` | Assign/unassign users to BM roles on an instance |
| Business Manager | `bm roles permissions` | Get/set role permissions on an instance |

## Account Manager Users

```bash
# list all users
b2c am users list

# create a user
b2c am users create --mail user@example.com --first-name Jane --last-name Doe --org MyOrg

# get a user by login
b2c am users get user@example.com

# update a user
b2c am users update user@example.com --first-name Janet

# delete (disable) a user
b2c am users delete user@example.com

# reset a user to INITIAL state
b2c am users reset user@example.com
```

## Account Manager Roles

```bash
# list all AM roles
b2c am roles list

# list roles filtered by target type
b2c am roles list --target-type User

# get role details
b2c am roles get bm-admin

# grant a role to a user
b2c am roles grant user@example.com --role bm-admin

# grant a role with tenant scope
b2c am roles grant user@example.com --role bm-admin --scope tenant1,tenant2

# revoke a role
b2c am roles revoke user@example.com --role bm-admin

# revoke only specific scope
b2c am roles revoke user@example.com --role bm-admin --scope tenant1
```

## Account Manager Organizations and API Clients

```bash
# list organizations
b2c am orgs list

# list API clients
b2c am clients list

# create an API client
b2c am clients create --display-name "My Client" --org MyOrg

# reset API client password
b2c am clients password my-client-id
```

## Business Manager Roles

BM role commands operate on a specific Commerce Cloud instance (via `--server` or config).

```bash
# list BM roles on an instance
b2c bm roles list --server my-sandbox.demandware.net

# get role details (with user list)
b2c bm roles get Administrator --expand users

# create a custom role
b2c bm roles create MyCustomRole --description "Custom role for content editors"

# delete a custom role (system roles cannot be deleted)
b2c bm roles delete MyCustomRole

# grant a BM role to a user on the instance
b2c bm roles grant user@example.com --role Administrator

# revoke a BM role from a user
b2c bm roles revoke user@example.com --role Administrator

# all commands support --json for machine-readable output
b2c bm roles list --json
```

## Business Manager Role Permissions

Permissions use a file-based get/set workflow since the API replaces all permissions at once.

```bash
# view permission summary
b2c bm roles permissions get Administrator

# export permissions to a JSON file for editing
b2c bm roles permissions get Administrator --output admin-perms.json

# edit the file, then apply
b2c bm roles permissions set Administrator --file admin-perms.json
```

The permissions JSON has four sections: `functional`, `module`, `locale`, and `webdav`. Each can be scoped to organization, site, or unscoped depending on type.

## Authentication Requirements

| Operations | Client Credentials | User Auth |
|---|---|---|
| AM Users and Roles | User Administrator role on API client | Account Administrator or User Administrator |
| AM Organizations | Not supported | Account Administrator |
| AM API Clients | Not supported | Account Administrator or API Administrator |
| BM Roles | OCAPI permissions for `/roles` resource | OCAPI permissions for `/roles` resource |

## Related Skills

- `b2c-cli:b2c-config` - Configure authentication credentials and instance settings
- `b2c-cli:b2c-sandbox` - Create and manage sandboxes (instances)
