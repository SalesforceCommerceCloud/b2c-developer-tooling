import {B2CInstance} from '../../instance/index.js';

/**
 * Uploads cartridges to an instance.
 * Note: It takes B2CInstance as a dependency. It doesn't care if Auth is Basic or OAuth.
 */
export async function uploadCartridges(instance: B2CInstance, _rootDir: string): Promise<void> {
  if (!instance.config.codeVersion) {
    throw new Error('Code version required for upload');
  }

  console.log(`Uploading to ${instance.config.hostname} (Version: ${instance.config.codeVersion})...`);

  // Create the version directory
  const res = await instance.webdavRequest(`Cartridges/${instance.config.codeVersion}`, {method: 'MKCOL'});

  // 405 means directory already exists, which is fine
  if (!res.ok && res.status !== 405) {
    throw new Error(`Failed to create directory: ${res.status} ${res.statusText}`);
  }

  // TODO: Implement actual file upload logic
  // - Zip the cartridges from rootDir
  // - Upload via WebDAV PUT
  // - Optionally unzip on server
  console.log(`Directory created/verified for version ${instance.config.codeVersion}`);
}

/**
 * Activates a code version on an instance.
 */
export async function activateCodeVersion(instance: B2CInstance, codeVersion: string): Promise<void> {
  console.log(`Activating code version ${codeVersion} on ${instance.config.hostname}...`);

  // TODO: Implement actual activation logic via OCAPI
  // This typically involves a PATCH request to the code version resource
}
