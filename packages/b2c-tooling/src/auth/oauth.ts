import { AuthStrategy } from './types.js';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
}

export class OAuthStrategy implements AuthStrategy {
  private token: string | null = null;

  constructor(private config: OAuthConfig) {}

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    if (!this.token) await this.renewToken();

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.token}`);

    let res = await fetch(url, { ...init, headers });

    // RESILIENCE: If the server says 401, the token might have expired or been revoked.
    // We retry exactly once.
    if (res.status === 401) {
      await this.renewToken();
      headers.set('Authorization', `Bearer ${this.token}`);
      res = await fetch(url, { ...init, headers });
    }

    return res;
  }

  async getAuthorizationHeader(): Promise<string> {
    if (!this.token) await this.renewToken();
    return `Bearer ${this.token}`;
  }

  private async renewToken(): Promise<void> {
    // TODO: Implement actual Account Manager call here using this.config
    console.debug('Renewing OAuth Token...');
    this.token = 'mock_refreshed_token';
  }
}
