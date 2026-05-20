/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

// Thin re-export to keep existing CLI imports working while consolidating the
// canonical implementation into the SDK. New code should import directly from
// `@salesforce/b2c-tooling-sdk/ux`.
export {confirm, type ConfirmOptions} from '@salesforce/b2c-tooling-sdk/ux';
