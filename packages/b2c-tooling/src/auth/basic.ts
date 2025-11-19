import { AuthStrategy } from './types.js';

export class BasicAuthStrategy implements AuthStrategy {
  private encoded: string;

  constructor(user: string, pass: string) {
    this.encoded = Buffer.from(`${user}:${pass}`).toString('base64');
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Basic ${this.encoded}`);
    return fetch(url, { ...init, headers });
  }

  async getAuthorizationHeader(): Promise<string> {
    return `Basic ${this.encoded}`;
  }
}
