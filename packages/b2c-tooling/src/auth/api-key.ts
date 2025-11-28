import type {AuthStrategy} from './types.js';
import {getLogger} from '../logging/logger.js';

export class ApiKeyStrategy implements AuthStrategy {
  constructor(
    private key: string,
    private headerName = 'x-api-key',
  ) {
    const logger = getLogger();
    // Show partial key for identification (first 8 chars)
    const keyPreview = key.length > 8 ? `${key.slice(0, 8)}...` : key;
    logger.debug({headerName}, `[Auth] Using API Key authentication (${headerName}): ${keyPreview}`);
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set(this.headerName, this.key);
    return fetch(url, {...init, headers});
  }
}
