---
name: b2c-slas-auth-patterns
description: Implement advanced SLAS authentication patterns in B2C Commerce. Use when implementing passwordless login (email OTP, SMS OTP, passkeys), session bridging between PWA and SFRA, hybrid authentication, token refresh, or trusted system authentication. Covers authentication flows, token management, and JWT validation.
---

# B2C SLAS Authentication Patterns

Advanced authentication patterns for SLAS (Shopper Login and API Access Service) beyond basic login. These patterns enable passwordless authentication, hybrid storefront support, and system-to-system integration.

## Authentication Methods Overview

| Method | Use Case | User Experience |
|--------|----------|-----------------|
| Password | Traditional login | Username + password form |
| Email OTP | Passwordless email | Code sent to email |
| SMS OTP | Passwordless SMS | Code sent to phone |
| Passkeys | FIDO2/WebAuthn | Biometric or device PIN |
| Session Bridge | Hybrid storefronts | Seamless PWA ↔ SFRA |
| TSOB | System integration | Backend service calls |

## Passwordless Email OTP

Send one-time passwords via email for passwordless login.

### Flow Overview

1. User enters email
2. System sends OTP via SLAS
3. User enters OTP
4. System exchanges OTP for tokens

### Request OTP

```javascript
// POST /shopper/auth/v1/organizations/{org}/oauth2/passwordless/start
async function requestEmailOTP(email, siteId) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/passwordless/start`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                user_id: email,
                channel_id: siteId,
                mode: 'callback',
                callback_uri: 'https://yoursite.com/verify'
            })
        }
    );

    // Returns: { passwordless_token: "...", ...}
    return response.json();
}
```

### Verify OTP and Get Token

```javascript
// POST /shopper/auth/v1/organizations/{org}/oauth2/passwordless/token
async function verifyEmailOTP(passwordlessToken, otp, clientId) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/passwordless/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                hint: 'pwdless_login',
                pwdless_token: passwordlessToken,
                code_verifier: otp,
                channel_id: siteId
            })
        }
    );

    // Returns: { access_token, refresh_token, ... }
    return response.json();
}
```

### Email Template Configuration

Configure the OTP email template in Business Manager:

**Merchant Tools > Content > Email Templates**

Create template `passwordless_login_otp`:

```html
<!DOCTYPE html>
<html>
<head><title>Your Login Code</title></head>
<body>
    <h1>Your verification code</h1>
    <p>Use this code to log in: <strong>${otp}</strong></p>
    <p>This code expires in 10 minutes.</p>
</body>
</html>
```

## Passwordless SMS OTP

Send OTP via SMS using Marketing Cloud or custom integration (e.g., AWS SNS, Twilio).

### Using Marketing Cloud

Configure SMS through Salesforce Marketing Cloud:

1. Set up Marketing Cloud connector
2. Configure SMS journey with OTP template
3. Trigger via SLAS callback

### Using Custom SMS Provider

Implement a custom hook to send SMS:

```javascript
// hooks/passwordless.js
var HTTPClient = require('dw/net/HTTPClient');

exports.sendSMS = function(phoneNumber, otp) {
    // Example: AWS SNS
    var client = new HTTPClient();
    client.open('POST', 'https://sns.us-east-1.amazonaws.com');
    client.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    var params = [
        'Action=Publish',
        'PhoneNumber=' + encodeURIComponent(phoneNumber),
        'Message=' + encodeURIComponent('Your code: ' + otp)
    ].join('&');

    client.send(params);
    return client.statusCode === 200;
};
```

## Passkeys (FIDO2/WebAuthn)

Enable biometric authentication using passkeys.

### Registration Flow

```javascript
// Step 1: Get registration options from SLAS
async function getPasskeyRegistrationOptions(accessToken) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/passkeys/registration-options`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_id: siteId
            })
        }
    );
    return response.json();
}

// Step 2: Create credential using WebAuthn API
async function createPasskey(options) {
    const credential = await navigator.credentials.create({
        publicKey: {
            challenge: base64ToBuffer(options.challenge),
            rp: { name: options.rp_name, id: options.rp_id },
            user: {
                id: base64ToBuffer(options.user_id),
                name: options.user_name,
                displayName: options.user_display_name
            },
            pubKeyCredParams: options.pub_key_cred_params,
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required'
            }
        }
    });
    return credential;
}

// Step 3: Register credential with SLAS
async function registerPasskey(accessToken, credential) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/passkeys/registration`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel_id: siteId,
                credential_id: bufferToBase64(credential.rawId),
                client_data_json: bufferToBase64(credential.response.clientDataJSON),
                attestation_object: bufferToBase64(credential.response.attestationObject)
            })
        }
    );
    return response.json();
}
```

### Authentication Flow

```javascript
// Step 1: Get authentication options
async function getPasskeyAuthOptions() {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/passkeys/authentication-options`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: siteId })
        }
    );
    return response.json();
}

// Step 2: Get credential using WebAuthn API
async function authenticateWithPasskey(options) {
    const assertion = await navigator.credentials.get({
        publicKey: {
            challenge: base64ToBuffer(options.challenge),
            rpId: options.rp_id,
            allowCredentials: options.allow_credentials.map(c => ({
                type: 'public-key',
                id: base64ToBuffer(c.id)
            })),
            userVerification: 'required'
        }
    });
    return assertion;
}

// Step 3: Exchange assertion for tokens
async function exchangePasskeyForToken(assertion) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                hint: 'passkey',
                credential_id: bufferToBase64(assertion.rawId),
                client_data_json: bufferToBase64(assertion.response.clientDataJSON),
                authenticator_data: bufferToBase64(assertion.response.authenticatorData),
                signature: bufferToBase64(assertion.response.signature),
                channel_id: siteId
            })
        }
    );
    return response.json();
}
```

## Session Bridge

Maintain session continuity between PWA Kit and SFRA storefronts.

### Concept

Session bridge uses special tokens to synchronize authentication state:

- `dwsgst` - Guest session token
- `dwsrst` - Registered session token

### PWA to SFRA Bridge

```javascript
// In PWA Kit: Get session bridge tokens
async function getSessionBridgeTokens(accessToken) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/session-bridge/token`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                channel_id: siteId,
                login_id: customerId
            })
        }
    );

    // Returns: { dwsgst, dwsrst }
    return response.json();
}

// Redirect to SFRA with tokens
function redirectToSFRA(dwsgst, dwsrst) {
    const sfraUrl = new URL('https://sfra.yoursite.com/');
    sfraUrl.searchParams.set('dwsgst', dwsgst);
    if (dwsrst) {
        sfraUrl.searchParams.set('dwsrst', dwsrst);
    }
    window.location.href = sfraUrl.toString();
}
```

### SFRA to PWA Bridge

```javascript
// In SFRA controller: Generate bridge tokens
var SLASAuthHelper = require('*/cartridge/scripts/helpers/slasAuthHelper');

function bridgeToPWA() {
    var bridgeTokens = SLASAuthHelper.getSessionBridgeTokens();

    response.redirect(
        'https://pwa.yoursite.com/callback' +
        '?dwsgst=' + bridgeTokens.dwsgst +
        (bridgeTokens.dwsrst ? '&dwsrst=' + bridgeTokens.dwsrst : '')
    );
}
```

### PWA Kit Callback Handler

```javascript
// In PWA Kit: Handle bridge callback
async function handleBridgeCallback(searchParams) {
    const dwsgst = searchParams.get('dwsgst');
    const dwsrst = searchParams.get('dwsrst');

    // Exchange bridge tokens for access token
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/session-bridge/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'session_bridge',
                channel_id: siteId,
                dwsgst: dwsgst,
                ...(dwsrst && { dwsrst: dwsrst })
            })
        }
    );

    const tokens = await response.json();
    // Store tokens and establish session
}
```

## Hybrid Authentication

Support both PWA Kit and SFRA with unified authentication.

### Four Lifecycle Events

| Event | Trigger | Action |
|-------|---------|--------|
| Login | User authenticates | Sync session to both platforms |
| Logout | User logs out | Clear sessions on both platforms |
| Session Start | New visitor | Create bridge tokens |
| Session Refresh | Token expiry | Refresh and re-sync |

### Implementation Pattern

```javascript
// Shared auth service
class HybridAuthService {
    async login(credentials) {
        // 1. Authenticate with SLAS
        const tokens = await this.slasLogin(credentials);

        // 2. Get session bridge tokens
        const bridgeTokens = await this.getSessionBridge(tokens.access_token);

        // 3. Sync to SFRA (set cookies or redirect)
        await this.syncToSFRA(bridgeTokens);

        return tokens;
    }

    async logout() {
        // 1. Revoke SLAS tokens
        await this.revokeTokens();

        // 2. Clear SFRA session
        await this.clearSFRASession();

        // 3. Clear local state
        this.clearLocalTokens();
    }
}
```

## Token Refresh

### Public Clients (Single-Use Refresh)

Public clients (no secret) receive single-use refresh tokens:

```javascript
async function refreshTokenPublic(refreshToken, clientId) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                channel_id: siteId
            })
        }
    );

    // Returns NEW refresh_token (old one is invalidated)
    return response.json();
}
```

### Private Clients (Reusable Refresh)

Private clients can reuse refresh tokens:

```javascript
async function refreshTokenPrivate(refreshToken, clientId, clientSecret) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                channel_id: siteId
            })
        }
    );

    // Same refresh_token can be used again
    return response.json();
}
```

## Trusted System on Behalf (TSOB)

Server-to-server authentication to act on behalf of a shopper.

### Use Cases

- Backend services accessing shopper data
- Order management systems
- Customer service applications

### Get Token on Behalf of Shopper

```javascript
async function getTSOBToken(shopperLoginId) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/trusted-system/token`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${btoa(clientId + ':' + clientSecret)}`
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                login_id: shopperLoginId,
                channel_id: siteId,
                usid: shopperUsid // Optional: reuse existing session
            })
        }
    );

    // Returns tokens that act as the specified shopper
    return response.json();
}
```

### Required Configuration

1. SLAS client must have TSOB enabled
2. Configure in SLAS Admin API or Business Manager
3. Secure the client secret (server-side only)

## JWT Validation

Validate SLAS tokens using JWKS (JSON Web Key Set).

### Get JWKS

```javascript
async function getJWKS() {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/jwks`
    );
    return response.json();
}
```

### Validate Token

```javascript
const jose = require('jose');

async function validateToken(accessToken) {
    // Get JWKS
    const jwksUrl = `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/jwks`;
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));

    // Verify token
    const { payload } = await jose.jwtVerify(accessToken, JWKS, {
        issuer: `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}`,
        audience: clientId
    });

    return payload;
}
```

### Token Claims

| Claim | Description |
|-------|-------------|
| `sub` | Subject (customer ID or guest ID) |
| `isb` | Identity subject binding |
| `iss` | Issuer |
| `aud` | Audience (client ID) |
| `exp` | Expiration time |
| `iat` | Issued at time |
| `scope` | Granted scopes |

## Best Practices

### Security

- Never expose client secrets in frontend code
- Use HTTPS for all token exchanges
- Validate tokens server-side for sensitive operations
- Implement proper CORS policies
- Store tokens securely (httpOnly cookies preferred)

### Token Management

- Implement proactive token refresh before expiry
- Handle refresh token rotation for public clients
- Clear tokens on logout from all storage locations
- Use short-lived access tokens where possible

### User Experience

- Provide fallback authentication methods
- Show clear error messages for auth failures
- Remember user's preferred auth method
- Handle session expiry gracefully

## Detailed References

- [Session Bridge Flows](references/SESSION-BRIDGE.md) - Detailed session bridge implementation
- [Token Lifecycle](references/TOKEN-LIFECYCLE.md) - Token expiry and refresh patterns
