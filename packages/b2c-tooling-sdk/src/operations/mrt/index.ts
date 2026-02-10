/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Managed Runtime (MRT) operations.
 *
 * This module provides functions for managing bundles and deployments
 * on Salesforce Managed Runtime.
 *
 * ## Bundle Operations
 *
 * - {@link createBundle} - Create a bundle from a build directory
 * - {@link pushBundle} - Push a bundle to MRT (creates and uploads)
 * - {@link uploadBundle} - Upload a pre-created bundle
 * - {@link listBundles} - List bundles for a project
 *
 * ## Usage
 *
 * ```typescript
 * import { pushBundle } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * // Push and deploy a bundle
 * const result = await pushBundle({
 *   projectSlug: 'my-storefront',
 *   ssrOnly: ['ssr.js'],
 *   ssrShared: ['**\/*.js', 'static/**\/*'],
 *   buildDirectory: './build',
 *   message: 'Release v1.0.0',
 *   target: 'staging'
 * }, auth);
 *
 * console.log(`Bundle ${result.bundleId} deployed to ${result.target}`);
 * ```
 *
 * ## Authentication
 *
 * MRT operations use API key authentication. Get your API key from the
 * [Runtime Admin](https://runtime.commercecloud.com/) dashboard.
 *
 * @module operations/mrt
 */

// Bundle creation
export {createBundle, createGlobFilter, getDefaultMessage, DEFAULT_SSR_PARAMETERS} from './bundle.js';
export type {CreateBundleOptions, Bundle} from './bundle.js';

// Push and bundle operations
export {pushBundle, uploadBundle, listBundles, downloadBundle} from './push.js';
export type {
  PushOptions,
  PushResult,
  ListBundlesOptions,
  ListBundlesResult,
  DownloadBundleOptions,
  DownloadBundleResult,
  MrtBundle,
} from './push.js';

// Environment variable operations
export {listEnvVars, setEnvVar, setEnvVars, deleteEnvVar} from './env-var.js';
export type {
  EnvVarOptions,
  SetEnvVarOptions,
  SetEnvVarsOptions,
  DeleteEnvVarOptions,
  ListEnvVarsResult,
  EnvironmentVariable,
} from './env-var.js';

// Environment (target) operations
export {createEnv, deleteEnv, getEnv, waitForEnv, listEnvs, updateEnv} from './env.js';
export type {
  CreateEnvOptions,
  DeleteEnvOptions,
  GetEnvOptions,
  WaitForEnvOptions,
  ListEnvsOptions,
  ListEnvsResult,
  UpdateEnvOptions,
  MrtEnvironment,
  MrtEnvironmentState,
  MrtEnvironmentUpdate,
  PatchedMrtEnvironment,
} from './env.js';

// Deployment operations
export {listDeployments, createDeployment} from './deployment.js';
export type {
  ListDeploymentsOptions,
  ListDeploymentsResult,
  CreateDeploymentOptions,
  CreateDeploymentResult,
  MrtDeployment,
  MrtDeploymentCreate,
} from './deployment.js';

// Organization operations
export {listOrganizations} from './organization.js';
export type {
  ListOrganizationsOptions,
  ListOrganizationsResult,
  MrtOrganization,
  OrganizationLimits,
} from './organization.js';

// Project operations
export {listProjects, createProject, getProject, updateProject, deleteProject} from './project.js';
export type {
  ListProjectsOptions,
  ListProjectsResult,
  CreateProjectOptions,
  GetProjectOptions,
  UpdateProjectOptions,
  DeleteProjectOptions,
  MrtProject,
  MrtProjectUpdate,
  PatchedMrtProject,
  SsrRegion,
} from './project.js';

// Member operations
export {listMembers, addMember, getMember, updateMember, removeMember, MEMBER_ROLES} from './member.js';
export type {
  ListMembersOptions,
  ListMembersResult,
  AddMemberOptions,
  GetMemberOptions,
  UpdateMemberOptions,
  RemoveMemberOptions,
  MrtMember,
  PatchedMrtMember,
  MemberRoleValue,
} from './member.js';

// Notification operations
export {
  listNotifications,
  createNotification,
  getNotification,
  updateNotification,
  deleteNotification,
} from './notification.js';
export type {
  ListNotificationsOptions,
  ListNotificationsResult,
  CreateNotificationOptions,
  GetNotificationOptions,
  UpdateNotificationOptions,
  DeleteNotificationOptions,
  MrtNotification,
  MrtEmailNotification,
  PatchedMrtNotification,
} from './notification.js';

// Redirect operations
export {
  listRedirects,
  createRedirect,
  getRedirect,
  updateRedirect,
  deleteRedirect,
  cloneRedirects,
} from './redirect.js';
export type {
  ListRedirectsOptions,
  ListRedirectsResult,
  CreateRedirectOptions,
  GetRedirectOptions,
  UpdateRedirectOptions,
  DeleteRedirectOptions,
  CloneRedirectsOptions,
  CloneRedirectsResult,
  MrtRedirect,
  PatchedMrtRedirect,
  RedirectHttpStatusCode,
} from './redirect.js';

// Access control header operations
export {
  listAccessControlHeaders,
  createAccessControlHeader,
  getAccessControlHeader,
  deleteAccessControlHeader,
} from './access-control.js';
export type {
  ListAccessControlHeadersOptions,
  ListAccessControlHeadersResult,
  CreateAccessControlHeaderOptions,
  GetAccessControlHeaderOptions,
  DeleteAccessControlHeaderOptions,
  MrtAccessControlHeader,
} from './access-control.js';

// Cache operations
export {invalidateCache} from './cache.js';
export type {InvalidateCacheOptions, InvalidateCacheResult} from './cache.js';

// User operations
export {getProfile, resetApiKey, getEmailPreferences, updateEmailPreferences} from './user.js';
export type {
  UserOperationOptions,
  ApiKeyResult,
  UpdateEmailPreferencesOptions,
  MrtUserProfile,
  MrtEmailPreferences,
  PatchedMrtEmailPreferences,
} from './user.js';

// B2C Commerce config operations
export {getB2COrgInfo, getB2CTargetInfo, setB2CTargetInfo, updateB2CTargetInfo} from './b2c-config.js';
export type {
  GetB2COrgInfoOptions,
  GetB2CTargetInfoOptions,
  SetB2CTargetInfoOptions,
  UpdateB2CTargetInfoOptions,
  B2COrgInfo,
  B2CTargetInfo,
  PatchedB2CTargetInfo,
} from './b2c-config.js';

// Log tailing operations
export {createLoggingToken, parseMrtLogLine, getLogsWebSocketUrl, tailMrtLogs} from './tail-logs.js';
export type {MrtLogEntry, CreateLoggingTokenOptions, TailMrtLogsOptions, TailMrtLogsResult} from './tail-logs.js';
