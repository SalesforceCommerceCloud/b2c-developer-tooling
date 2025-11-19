import { AuthStrategy } from './types.js';

export class ApiKeyStrategy implements AuthStrategy {
  constructor(
    private key: string,
    private headerName = 'x-api-key'
  ) {}

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set(this.headerName, this.key);
    return fetch(url, { ...init, headers });
  }
}
