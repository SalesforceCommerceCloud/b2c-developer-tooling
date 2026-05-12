/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import type {B2CInstance} from '@salesforce/b2c-tooling-sdk/instance';
import {whoamiBmUser} from '@salesforce/b2c-tooling-sdk/operations/bm-users';

/**
 * Returns `login` if provided, otherwise resolves the current authenticated
 * user's login via `GET /users/this`. Used by access-key commands so callers
 * can manage their own keys without restating the email.
 */
export async function resolveLoginOrWhoami(instance: B2CInstance, login: string | undefined): Promise<string> {
  if (login) return login;
  const user = await whoamiBmUser(instance);
  if (!user.login) {
    throw new Error('Could not resolve current user login from /users/this — pass an explicit login.');
  }
  return user.login;
}
