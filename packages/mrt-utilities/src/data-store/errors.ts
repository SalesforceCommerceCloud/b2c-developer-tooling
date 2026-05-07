/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

export class DataStoreNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreNotFoundError';
    Object.setPrototypeOf(this, DataStoreNotFoundError.prototype);
  }
}

export class DataStoreServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreServiceError';
    Object.setPrototypeOf(this, DataStoreServiceError.prototype);
  }
}

export class DataStoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataStoreUnavailableError';
    Object.setPrototypeOf(this, DataStoreUnavailableError.prototype);
  }
}
