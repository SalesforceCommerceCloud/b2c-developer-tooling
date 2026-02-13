/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {ux} from '@oclif/core';
import cliui from 'cliui';
import {resolveToInternalRole} from '@salesforce/b2c-tooling-sdk';
import type {AccountManagerUser, RoleMapping, OrgMapping} from '@salesforce/b2c-tooling-sdk';

/**
 * Formats a role for display as "Description (ENUM_NAME)" or just "ENUM_NAME".
 */
function formatRoleDisplay(roleName: string, roleMapping: RoleMapping): string {
  const enumName = resolveToInternalRole(roleName, roleMapping);
  const description = roleMapping.descriptions.get(enumName);
  return description ? `${description} (${enumName})` : enumName;
}

function formatOrgDisplay(orgId: string, orgMapping: OrgMapping): string {
  const name = orgMapping.byId.get(orgId);
  return name ? `${name} (${orgId})` : orgId;
}

function printBasicFields(ui: ReturnType<typeof cliui>, user: AccountManagerUser, orgMapping: OrgMapping): void {
  const isPasswordExpired = user.passwordExpirationTimestamp
    ? user.passwordExpirationTimestamp < Date.now()
    : undefined;
  const twoFAEnabled = user.verifiers && user.verifiers.length > 0 ? 'Yes' : 'No';
  const primaryOrg = user.primaryOrganization ? formatOrgDisplay(user.primaryOrganization, orgMapping) : undefined;

  const fields: [string, string | undefined][] = [
    ['ID', user.id],
    ['Email', user.mail],
    ['First Name', user.firstName],
    ['Last Name', user.lastName],
    ['Display Name', user.displayName],
    ['State', user.userState],
    ['Primary Organization', primaryOrg],
    ['Preferred Locale', user.preferredLocale || undefined],
    ['Business Phone', user.businessPhone || undefined],
    ['Home Phone', user.homePhone || undefined],
    ['Mobile Phone', user.mobilePhone || undefined],
    ['Linked to SF Identity', user.linkedToSfIdentity?.toString()],
    ['2FA Enabled', twoFAEnabled],
    ['Password Expired', isPasswordExpired === undefined ? undefined : isPasswordExpired ? 'Yes' : 'No'],
    ['Last Login', user.lastLoginDate || undefined],
    ['Created At', user.createdAt ? new Date(user.createdAt).toLocaleString() : undefined],
    ['Last Modified', user.lastModified ? new Date(user.lastModified).toLocaleString() : undefined],
  ];

  for (const [label, value] of fields) {
    if (value !== undefined) {
      ui.div({text: `${label}:`, width: 25, padding: [0, 2, 0, 0]}, {text: value, padding: [0, 0, 0, 0]});
    }
  }
}

function printOrganizations(ui: ReturnType<typeof cliui>, user: AccountManagerUser, orgMapping: OrgMapping): void {
  if (user.organizations === undefined || user.organizations.length === 0) {
    return;
  }

  ui.div({text: 'Organizations', padding: [2, 0, 0, 0]});
  ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

  for (const o of user.organizations) {
    const orgId = typeof o === 'string' ? o : o.id || 'Unknown';
    const name = formatOrgDisplay(orgId, orgMapping);
    ui.div({text: `- ${name}`, padding: [0, 0, 0, 2]});
  }
}

function printRoles(ui: ReturnType<typeof cliui>, user: AccountManagerUser, roleMapping: RoleMapping): void {
  if (user.roles === undefined || user.roles.length === 0) {
    return;
  }

  ui.div({text: 'Roles', padding: [2, 0, 0, 0]});
  ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

  for (const r of user.roles) {
    const name = typeof r === 'string' ? r : r.roleEnumName || r.id || 'Unknown';
    const display = formatRoleDisplay(name, roleMapping);
    ui.div({text: `- ${display}`, padding: [0, 0, 0, 2]});
  }
}

function printRoleScopes(ui: ReturnType<typeof cliui>, user: AccountManagerUser): void {
  if (user.roleTenantFilterMap === undefined || Object.keys(user.roleTenantFilterMap).length === 0) {
    return;
  }

  ui.div({text: 'Role Scopes', padding: [2, 0, 0, 0]});
  ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

  for (const [roleEnumName, filter] of Object.entries(user.roleTenantFilterMap as Record<string, unknown>)) {
    const filterValue =
      typeof filter === 'string' ? filter : Array.isArray(filter) ? filter.join(', ') : String(filter);
    ui.div({text: `${roleEnumName}:`, width: 30, padding: [0, 2, 0, 0]}, {text: filterValue, padding: [0, 0, 0, 0]});
  }
}

/**
 * Prints user details to stdout using cliui formatting.
 */
export function printUserDetails(user: AccountManagerUser, roleMapping: RoleMapping, orgMapping: OrgMapping): void {
  const ui = cliui({width: process.stdout.columns || 80});

  ui.div({text: 'User Details', padding: [1, 0, 0, 0]});
  ui.div({text: '─'.repeat(50), padding: [0, 0, 0, 0]});

  printBasicFields(ui, user, orgMapping);
  printOrganizations(ui, user, orgMapping);
  printRoles(ui, user, roleMapping);
  printRoleScopes(ui, user);

  ux.stdout(ui.toString());
}
