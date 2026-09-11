/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Notification operations for Managed Runtime.
 *
 * Handles listing, creating, updating, and deleting project notifications.
 *
 * @module operations/mrt/notification
 */
import type {AuthStrategy} from '../../auth/types.js';
import {createMrtClient, DEFAULT_MRT_ORIGIN} from '../../clients/mrt.js';
import type {components} from '../../clients/mrt.js';
import {getLogger} from '../../logging/logger.js';

/**
 * Email notification type from API.
 */
export type MrtEmailNotification = components['schemas']['EmailNotification'];

/**
 * Polymorphic notification (currently only email).
 */
export type MrtNotification = components['schemas']['PolymorphicNotification'];

/**
 * Patched notification for updates.
 */
export type PatchedMrtNotification = components['schemas']['PatchedPolymorphicNotification'];

/**
 * Options for listing notifications.
 */
export interface ListNotificationsOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Maximum number of results to return.
   */
  limit?: number;

  /**
   * Offset for pagination.
   */
  offset?: number;

  /**
   * Filter by target slug.
   */
  targetSlug?: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Result of listing notifications.
 */
export interface ListNotificationsResult {
  /**
   * Total count of notifications.
   */
  count: number;

  /**
   * URL for next page of results.
   */
  next: string | null;

  /**
   * URL for previous page of results.
   */
  previous: string | null;

  /**
   * Array of notifications.
   */
  notifications: MrtNotification[];
}

/**
 * Lists notifications for an MRT project.
 *
 * @param options - List options including project slug
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns Paginated list of notifications
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { listNotifications } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const result = await listNotifications({
 *   projectSlug: 'my-storefront'
 * }, auth);
 *
 * for (const notification of result.notifications) {
 *   console.log(`Notification ${notification.id}`);
 * }
 * ```
 */
export async function listNotifications(
  options: ListNotificationsOptions,
  auth: AuthStrategy,
): Promise<ListNotificationsResult> {
  const logger = getLogger();
  const {projectSlug, limit, offset, targetSlug, origin} = options;

  logger.debug({projectSlug}, '[MRT] Listing notifications');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/notifications/', {
    params: {
      path: {project_slug: projectSlug},
      query: {
        limit,
        offset,
        targets__slug: targetSlug,
      },
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to list notifications: ${errorMessage}`);
  }

  logger.debug({count: data.count}, '[MRT] Notifications listed');

  return {
    count: data.count ?? 0,
    next: data.next ?? null,
    previous: data.previous ?? null,
    notifications: data.results ?? [],
  };
}

/**
 * Options for creating a notification.
 */
export interface CreateNotificationOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Target slugs to associate with this notification.
   */
  targets: string[];

  /**
   * Email recipients for this notification.
   */
  recipients: string[];

  /**
   * Trigger notification when deployment starts.
   */
  deploymentStart?: boolean;

  /**
   * Trigger notification when deployment succeeds.
   */
  deploymentSuccess?: boolean;

  /**
   * Trigger notification when deployment fails.
   */
  deploymentFailed?: boolean;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Creates a notification for an MRT project.
 *
 * @param options - Create notification options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The created notification
 * @throws Error if request fails
 *
 * @example
 * ```typescript
 * import { ApiKeyStrategy } from '@salesforce/b2c-tooling-sdk/auth';
 * import { createNotification } from '@salesforce/b2c-tooling-sdk/operations/mrt';
 *
 * const auth = new ApiKeyStrategy(process.env.MRT_API_KEY!, 'Authorization');
 *
 * const notification = await createNotification({
 *   projectSlug: 'my-storefront',
 *   targets: ['staging', 'production'],
 *   recipients: ['team@example.com'],
 *   deploymentStart: true,
 *   deploymentFailed: true
 * }, auth);
 * ```
 */
export async function createNotification(
  options: CreateNotificationOptions,
  auth: AuthStrategy,
): Promise<MrtNotification> {
  const logger = getLogger();
  const {projectSlug, targets, recipients, deploymentStart, deploymentSuccess, deploymentFailed, origin} = options;

  logger.debug({projectSlug, targets, recipients}, '[MRT] Creating notification');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: MrtNotification = {
    resourcetype: 'EmailNotification',
    targets,
    recipients,
    deployment_start: deploymentStart,
    deployment_success: deploymentSuccess,
    deployment_failed: deploymentFailed,
  };

  const {data, error} = await client.POST('/api/projects/{project_slug}/notifications/', {
    params: {
      path: {project_slug: projectSlug},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to create notification: ${errorMessage}`);
  }

  logger.debug({id: data.id}, '[MRT] Notification created');

  return data;
}

/**
 * Options for getting a notification.
 */
export interface GetNotificationOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Notification ID.
   */
  notificationId: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Gets a notification from an MRT project.
 *
 * @param options - Get notification options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The notification
 * @throws Error if request fails
 */
export async function getNotification(options: GetNotificationOptions, auth: AuthStrategy): Promise<MrtNotification> {
  const logger = getLogger();
  const {projectSlug, notificationId, origin} = options;

  logger.debug({projectSlug, notificationId}, '[MRT] Getting notification');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {data, error} = await client.GET('/api/projects/{project_slug}/notifications/{id}/', {
    params: {
      path: {project_slug: projectSlug, id: notificationId},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to get notification: ${errorMessage}`);
  }

  logger.debug({id: data.id}, '[MRT] Notification retrieved');

  return data;
}

/**
 * Options for updating a notification.
 */
export interface UpdateNotificationOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Notification ID.
   */
  notificationId: string;

  /**
   * Target slugs to associate with this notification.
   */
  targets?: string[];

  /**
   * Email recipients for this notification.
   */
  recipients?: string[];

  /**
   * Trigger notification when deployment starts.
   */
  deploymentStart?: boolean;

  /**
   * Trigger notification when deployment succeeds.
   */
  deploymentSuccess?: boolean;

  /**
   * Trigger notification when deployment fails.
   */
  deploymentFailed?: boolean;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Updates a notification in an MRT project.
 *
 * @param options - Update notification options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @returns The updated notification
 * @throws Error if request fails
 */
export async function updateNotification(
  options: UpdateNotificationOptions,
  auth: AuthStrategy,
): Promise<MrtNotification> {
  const logger = getLogger();
  const {
    projectSlug,
    notificationId,
    targets,
    recipients,
    deploymentStart,
    deploymentSuccess,
    deploymentFailed,
    origin,
  } = options;

  logger.debug({projectSlug, notificationId}, '[MRT] Updating notification');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const body: PatchedMrtNotification = {
    resourcetype: 'EmailNotification',
  };

  if (targets !== undefined) {
    body.targets = targets;
  }
  if (recipients !== undefined) {
    body.recipients = recipients;
  }
  if (deploymentStart !== undefined) {
    body.deployment_start = deploymentStart;
  }
  if (deploymentSuccess !== undefined) {
    body.deployment_success = deploymentSuccess;
  }
  if (deploymentFailed !== undefined) {
    body.deployment_failed = deploymentFailed;
  }

  const {data, error} = await client.PATCH('/api/projects/{project_slug}/notifications/{id}/', {
    params: {
      path: {project_slug: projectSlug, id: notificationId},
    },
    body,
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to update notification: ${errorMessage}`);
  }

  logger.debug({id: data.id}, '[MRT] Notification updated');

  return data;
}

/**
 * Options for deleting a notification.
 */
export interface DeleteNotificationOptions {
  /**
   * The project slug.
   */
  projectSlug: string;

  /**
   * Notification ID.
   */
  notificationId: string;

  /**
   * MRT API origin URL.
   * @default "https://cloud.mobify.com"
   */
  origin?: string;
}

/**
 * Deletes a notification from an MRT project.
 *
 * @param options - Delete notification options
 * @param auth - Authentication strategy (ApiKeyStrategy)
 * @throws Error if request fails
 */
export async function deleteNotification(options: DeleteNotificationOptions, auth: AuthStrategy): Promise<void> {
  const logger = getLogger();
  const {projectSlug, notificationId, origin} = options;

  logger.debug({projectSlug, notificationId}, '[MRT] Deleting notification');

  const client = createMrtClient({origin: origin || DEFAULT_MRT_ORIGIN}, auth);

  const {error} = await client.DELETE('/api/projects/{project_slug}/notifications/{id}/', {
    params: {
      path: {project_slug: projectSlug, id: notificationId},
    },
  });

  if (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as {message: unknown}).message)
        : JSON.stringify(error);
    throw new Error(`Failed to delete notification: ${errorMessage}`);
  }

  logger.debug({notificationId}, '[MRT] Notification deleted');
}
