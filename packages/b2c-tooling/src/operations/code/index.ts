/**
 * Code deployment operations for B2C Commerce.
 *
 * This module provides functions for uploading cartridges and managing
 * code versions on B2C Commerce instances via WebDAV.
 *
 * ## Functions
 *
 * - {@link uploadCartridges} - Upload cartridge code to an instance
 * - {@link activateCodeVersion} - Activate a code version on an instance
 *
 * ## Usage
 *
 * ```typescript
 * import { uploadCartridges, activateCodeVersion } from '@salesforce/b2c-tooling/operations/code';
 * import { B2CInstance, BasicAuthStrategy } from '@salesforce/b2c-tooling';
 *
 * const auth = new BasicAuthStrategy('username', 'access-key');
 * const instance = new B2CInstance(
 *   { hostname: 'your-sandbox.demandware.net', codeVersion: 'v1' },
 *   auth
 * );
 *
 * // Upload cartridges from local directory
 * await uploadCartridges(instance, './cartridges');
 *
 * // Activate the code version
 * await activateCodeVersion(instance, 'v1');
 * ```
 *
 * ## Authentication
 *
 * Code deployment uses WebDAV, which supports both Basic Auth and OAuth.
 * Basic Auth is recommended for better performance.
 *
 * @module operations/code
 */
export {uploadCartridges, activateCodeVersion} from './upload.js';
