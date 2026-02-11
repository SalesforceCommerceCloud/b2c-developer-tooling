# Token Lifecycle Reference

Understanding token expiry, refresh patterns, and lifecycle management for SLAS.

## Token Types and Expiry

| Token Type | Default Expiry | Configurable | Use Case |
|------------|----------------|--------------|----------|
| Access Token | 30 minutes | Yes (SLAS Admin) | API requests |
| Refresh Token (Public) | 90 days | Yes | Token renewal |
| Refresh Token (Private) | 90 days | Yes | Token renewal |
| Session Bridge Token | 30 minutes | No | Cross-platform auth |
| Passwordless Token | 10 minutes | No | OTP verification |

## Access Token Lifecycle

```
[Issue] → [Active] → [Expired]
   ↓         ↓
  Use    Refresh
```

### Best Practices for Access Tokens

```javascript
class TokenManager {
    constructor(config) {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
        this.refreshThreshold = 5 * 60 * 1000; // 5 minutes
    }

    isExpired() {
        return Date.now() >= this.expiresAt;
    }

    shouldRefresh() {
        // Refresh when within threshold of expiry
        return Date.now() >= (this.expiresAt - this.refreshThreshold);
    }

    async getValidToken() {
        if (this.shouldRefresh()) {
            await this.refresh();
        }
        return this.accessToken;
    }

    async refresh() {
        const tokens = await this.slasRefresh(this.refreshToken);
        this.setTokens(tokens);
    }

    setTokens(tokens) {
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        this.expiresAt = Date.now() + (tokens.expires_in * 1000);
    }
}
```

## Refresh Token Patterns

### Public Client (Single-Use)

For browser-based apps without a backend:

```javascript
// Refresh tokens are single-use - must store new token
async function refreshPublicClient(refreshToken) {
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            channel_id: siteId
        })
    });

    const tokens = await response.json();

    // IMPORTANT: Old refresh token is now invalid
    // Must use the new refresh_token for next refresh
    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token, // NEW token
        expiresIn: tokens.expires_in
    };
}
```

### Private Client (Reusable)

For server-side applications:

```javascript
// Refresh tokens are reusable with client secret
async function refreshPrivateClient(refreshToken) {
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            channel_id: siteId
        })
    });

    const tokens = await response.json();

    // Can reuse same refresh token (though new one may be provided)
    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || refreshToken,
        expiresIn: tokens.expires_in
    };
}
```

## Token Rotation Strategy

### Public Clients - Handle Race Conditions

```javascript
class PublicTokenManager {
    constructor() {
        this.refreshPromise = null;
        this.tokenVersion = 0;
    }

    async refresh() {
        // Prevent multiple concurrent refreshes
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        const currentVersion = this.tokenVersion;

        this.refreshPromise = this._doRefresh()
            .finally(() => {
                this.refreshPromise = null;
            });

        return this.refreshPromise;
    }

    async _doRefresh() {
        const tokens = await refreshPublicClient(this.refreshToken);

        // Check for race condition
        if (this.tokenVersion !== currentVersion) {
            // Another refresh happened, tokens might be stale
            throw new Error('Token version mismatch');
        }

        this.tokenVersion++;
        this.setTokens(tokens);
        return tokens;
    }
}
```

### Storage Strategies

```javascript
// Browser - httpOnly cookie preferred (requires BFF)
// Fallback to localStorage with encryption

class TokenStorage {
    // Option 1: httpOnly cookies via BFF
    async storeViaBackend(tokens) {
        await fetch('/api/auth/store-tokens', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(tokens)
        });
    }

    // Option 2: localStorage (less secure)
    storeLocally(tokens) {
        // Consider encrypting before storage
        localStorage.setItem('auth_tokens', JSON.stringify({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + (tokens.expires_in * 1000)
        }));
    }

    // Option 3: Memory only (cleared on refresh)
    storeInMemory(tokens) {
        this._tokens = tokens;
    }
}
```

## Session Timeout Handling

### Proactive Refresh

```javascript
class SessionManager {
    constructor() {
        this.refreshTimer = null;
    }

    scheduleRefresh(expiresIn) {
        // Clear existing timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        // Schedule refresh 5 minutes before expiry
        const refreshIn = (expiresIn - 300) * 1000;

        this.refreshTimer = setTimeout(() => {
            this.refresh().catch(this.handleRefreshError);
        }, refreshIn);
    }

    handleRefreshError(error) {
        // Check if refresh token is also expired
        if (error.message.includes('invalid_grant')) {
            // Full re-authentication required
            this.logout();
            this.redirectToLogin();
        }
    }
}
```

### Activity-Based Extension

```javascript
class ActivityTracker {
    constructor(tokenManager) {
        this.tokenManager = tokenManager;
        this.lastActivity = Date.now();
        this.activityTimeout = 15 * 60 * 1000; // 15 minutes

        this.setupListeners();
    }

    setupListeners() {
        ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
            window.addEventListener(event, () => this.recordActivity(), { passive: true });
        });
    }

    recordActivity() {
        const now = Date.now();
        if (now - this.lastActivity > 60000) { // Throttle to 1 minute
            this.lastActivity = now;
            this.checkTokenRefresh();
        }
    }

    checkTokenRefresh() {
        if (this.tokenManager.shouldRefresh()) {
            this.tokenManager.refresh();
        }
    }

    isInactive() {
        return Date.now() - this.lastActivity > this.activityTimeout;
    }
}
```

## Guest to Registered Transition

When a guest user logs in, merge sessions:

```javascript
async function loginWithSessionMerge(credentials, guestAccessToken) {
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Include guest token for basket/session merge
            'Authorization': `Bearer ${guestAccessToken}`
        },
        body: new URLSearchParams({
            grant_type: 'password',
            username: credentials.username,
            password: credentials.password,
            client_id: clientId,
            channel_id: siteId
        })
    });

    // Returns registered user tokens
    // Guest basket is automatically merged
    return response.json();
}
```

## Logout and Token Revocation

```javascript
async function logout(accessToken, refreshToken) {
    // Revoke refresh token
    await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/revoke`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                token: refreshToken,
                token_type_hint: 'refresh_token',
                client_id: clientId,
                channel_id: siteId
            })
        }
    );

    // Clear local storage
    localStorage.removeItem('auth_tokens');

    // Clear cookies if using BFF
    await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });
}
```

## Error Handling Reference

| Error | Meaning | Action |
|-------|---------|--------|
| `invalid_grant` | Refresh token expired/revoked | Re-authenticate |
| `invalid_token` | Access token invalid | Try refresh |
| `expired_token` | Access token expired | Refresh token |
| `invalid_client` | Client credentials wrong | Check configuration |
| `unauthorized_client` | Client not allowed | Check SLAS client settings |

## Debugging Token Issues

```javascript
// Decode JWT without validation (for debugging only)
function decodeToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return {
        subject: payload.sub,
        issuer: payload.iss,
        audience: payload.aud,
        expiresAt: new Date(payload.exp * 1000),
        issuedAt: new Date(payload.iat * 1000),
        scopes: payload.scope?.split(' ') || []
    };
}

// Check if token is expired
function isTokenExpired(token) {
    const decoded = decodeToken(token);
    return decoded && Date.now() >= decoded.expiresAt.getTime();
}
```
