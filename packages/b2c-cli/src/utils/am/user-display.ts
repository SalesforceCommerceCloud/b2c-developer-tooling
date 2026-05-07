/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {printFieldsBlock, type DetailField, type DetailSection} from '@salesforce/b2c-tooling-sdk/cli';
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

function buildBasicFields(user: AccountManagerUser, orgMapping: OrgMapping): DetailField[] {
  const isPasswordExpired = user.passwordExpirationTimestamp
    ? user.passwordExpirationTimestamp < Date.now()
    : undefined;
  const twoFAEnabled = user.verifiers && user.verifiers.length > 0 ? 'Yes' : 'No';
  const primaryOrg = user.primaryOrganization ? formatOrgDisplay(user.primaryOrganization, orgMapping) : undefined;

  return [
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
}

function buildOrganizationsSection(user: AccountManagerUser, orgMapping: OrgMapping): DetailSection | undefined {
  if (!user.organizations || user.organizations.length === 0) {
    return undefined;
  }
  return {
    title: 'Organizations',
    lines: user.organizations.map((o) => {
      const orgId = typeof o === 'string' ? o : o.id || 'Unknown';
      return `- ${formatOrgDisplay(orgId, orgMapping)}`;
    }),
  };
}

function buildRolesSection(user: AccountManagerUser, roleMapping: RoleMapping): DetailSection | undefined {
  if (!user.roles || user.roles.length === 0) {
    return undefined;
  }
  return {
    title: 'Roles',
    lines: user.roles.map((r) => {
      const name = typeof r === 'string' ? r : r.roleEnumName || r.id || 'Unknown';
      return `- ${formatRoleDisplay(name, roleMapping)}`;
    }),
  };
}

function buildRoleScopesSection(user: AccountManagerUser): DetailSection | undefined {
  if (!user.roleTenantFilterMap || Object.keys(user.roleTenantFilterMap).length === 0) {
    return undefined;
  }
  const fields: DetailField[] = Object.entries(user.roleTenantFilterMap as Record<string, unknown>).map(
    ([roleEnumName, filter]) => {
      const filterValue =
        typeof filter === 'string' ? filter : Array.isArray(filter) ? filter.join(', ') : String(filter);
      return [roleEnumName, filterValue];
    },
  );
  return {title: 'Role Scopes', fields};
}

/**
 * Prints user details to stdout using cliui formatting.
 */
export function printUserDetails(user: AccountManagerUser, roleMapping: RoleMapping, orgMapping: OrgMapping): void {
  const sections: DetailSection[] = [];
  const orgs = buildOrganizationsSection(user, orgMapping);
  if (orgs) sections.push(orgs);
  const roles = buildRolesSection(user, roleMapping);
  if (roles) sections.push(roles);
  const scopes = buildRoleScopesSection(user);
  if (scopes) sections.push(scopes);

  printFieldsBlock('User Details', buildBasicFields(user, orgMapping), {sections});
}
