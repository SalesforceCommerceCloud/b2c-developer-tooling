/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Hints for WebDAV requests refused while authenticated as an Account Manager user.
 *
 * A user token (browser login) is authorized by the user's Business Manager
 * permissions on the instance, not by the WebDAV Client Permissions of the
 * API client. These hints name the functional permission the root requires.
 *
 * @module clients/webdav-access-hint
 */

/**
 * Business Manager functional permission required for each WebDAV root
 * (keys are lowercase root folder names under `/webdav/Sites`).
 */
const ROOT_PERMISSIONS: Record<string, string> = {
  cartridges: 'WebDAV_Manage_Customization',
  catalogs: 'WebDAV_Transfer_Files',
  customersnapshots: 'WebDAV_Transfer_Files',
  dynamic: 'WebDAV_Transfer_Files',
  impex: 'WebDAV_Transfer_Files',
  libraries: 'WebDAV_Transfer_Files',
  logs: 'WebDAV_Transfer_Files',
  realmdata: 'WebDAV_Realm_Access',
  securitylogs: 'WebDAV_Security_Logs_Access',
  static: 'WebDAV_Transfer_Files',
  temp: 'WebDAV_Transfer_Files',
};

/**
 * Returns the Business Manager functional permission a user needs for a WebDAV path.
 *
 * @param path - Path relative to `/webdav/Sites` (e.g. `Cartridges/v1/app`)
 * @returns The permission ID, or undefined for unknown roots
 */
export function getWebDavRootPermission(path: string): string | undefined {
  const root = path.replace(/^\/+/, '').split('/')[0]?.toLowerCase();
  return root ? ROOT_PERMISSIONS[root] : undefined;
}

/**
 * Builds the hint for a 401/403 WebDAV response to a request made with an
 * Account Manager user token.
 *
 * @param path - Path relative to `/webdav/Sites`
 * @param username - Account Manager login of the signed-in user, when known
 * @returns Hint text to append to the error message
 */
export function describeWebDavUserAccessFailure(path: string, username?: string): string {
  const root = path.replace(/^\/+/, '').split('/')[0] || path;
  const permission = getWebDavRootPermission(path);
  const who = username ? `user "${username}"` : 'the signed-in user';
  const requirement = permission
    ? `"${root}" requires the ${permission} functional permission.`
    : `Check that the user has access to "${root}".`;
  return (
    `WebDAV access with an Account Manager login uses the Business Manager permissions of ${who}. ` +
    `${requirement} Make sure the user exists on this instance and has a Business Manager role with that ` +
    'permission (Administration > Organization > Roles & Permissions), or configure a WebDAV access key or API client instead.'
  );
}
