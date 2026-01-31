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
| Hybrid Auth | B2C 25.3+ | Built-in platform auth sync |
| TSOB | System integration | Backend service calls |

## Passwordless Email OTP

Send one-time passwords via email for passwordless login.

### Flow Overview

1. Call `/oauth2/passwordless/login` with callback URI
2. SLAS POSTs `pwdless_login_token` to your callback
3. Your app sends OTP to shopper via email
4. Shopper enters OTP, app exchanges for tokens

### Step 1: Initiate Passwordless Login

```javascript
// POST /shopper/auth/v1/organizations/{org}/oauth2/passwordless/login
async function initiatePasswordlessLogin(email, siteId) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/passwordless/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                user_id: email,
                mode: 'callback',
                channel_id: siteId,
                callback_uri: 'https://yoursite.com/api/passwordless/callback'
            })
        }
    );

    // SLAS will POST to your callback_uri with pwdless_login_token
    return response.json();
}
```

### Step 2: Handle Callback and Send OTP

Your callback endpoint receives `pwdless_login_token`. Generate an OTP and send it to the user:

```javascript
// Your callback endpoint (receives POST from SLAS)
app.post('/api/passwordless/callback', async (req, res) => {
    const { pwdless_login_token, user_id } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store token + OTP mapping (e.g., Redis with 10 min TTL)
    await redis.setex(`pwdless:${otp}`, 600, JSON.stringify({
        token: pwdless_login_token,
        email: user_id
    }));

    // Send OTP via email (configure in SLAS Admin UI)
    await sendOTPEmail(user_id, otp);

    res.status(200).send('OK');
});
```

### Step 3: Exchange OTP for Tokens

```javascript
// POST /shopper/auth/v1/organizations/{org}/oauth2/passwordless/token
async function exchangeOTPForToken(otp, clientId, clientSecret, siteId) {
    // Retrieve stored token
    const stored = JSON.parse(await redis.get(`pwdless:${otp}`));
    if (!stored) throw new Error('Invalid or expired OTP');

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
                pwdless_login_token: stored.token,
                channel_id: siteId
            })
        }
    );

    // Returns: { access_token, refresh_token, ... }
    return response.json();
}
```

### Rate Limits

- 6 requests per user per 10 minutes
- 1,000 requests/month per endpoint on non-production tenants

## Passwordless SMS OTP

Send OTP via SMS using Marketing Cloud or custom integration.

### Using Marketing Cloud

Configure SMS through Salesforce Marketing Cloud:

1. Set up Marketing Cloud connector
2. Configure SMS journey with OTP template
3. Trigger via SLAS callback (same flow as email OTP)

### Custom SMS Provider

Use the same callback flow as email, but send via SMS provider:

```javascript
// In your callback handler
const twilio = require('twilio')(accountSid, authToken);

async function sendOTPSMS(phoneNumber, otp) {
    await twilio.messages.create({
        body: `Your login code is: ${otp}`,
        from: '+1234567890',
        to: phoneNumber
    });
}
```

## Passkeys (FIDO2/WebAuthn)

Enable biometric authentication using passkeys.

**Important:** Passkey registration requires **prior identity verification via OTP**. Users must first verify their email before registering a passkey.

### Registration Flow (3 Steps)

```javascript
// Step 1: Verify identity via OTP first
// Use the Email OTP flow above to verify the user

// Step 2: Start passkey registration (requires valid access token)
async function startPasskeyRegistration(accessToken) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/webauthn/register/start`,
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

// Step 3: Create credential using WebAuthn API
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

// Step 4: Complete registration with SLAS
async function finishPasskeyRegistration(accessToken, credential) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/webauthn/register/finish`,
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
async function startPasskeyAuth() {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/webauthn/authenticate/start`,
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

// Step 3: Complete authentication and get tokens
async function finishPasskeyAuth(assertion) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/webauthn/authenticate/finish`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
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

### Token Types

Session bridge uses signed tokens generated from SFRA script APIs:

- `dwsgst` - Guest session token (from `Session.generateGuestSessionSignature()`)
- `dwsrst` - Registered session token (from `Session.generateRegisteredSessionSignature()`)

**Note:** DWSID is deprecated for registered shoppers.

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
var Session = require('dw/system/Session');

function bridgeToPWA() {
    var dwsgst = Session.generateGuestSessionSignature();
    var dwsrst = customer.authenticated ?
        Session.generateRegisteredSessionSignature() : null;

    response.redirect(
        'https://pwa.yoursite.com/callback' +
        '?dwsgst=' + dwsgst +
        (dwsrst ? '&dwsrst=' + dwsrst : '')
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
    // Use hint=sb-guest for guest, hint=sb-user for registered
    const hint = dwsrst ? 'sb-user' : 'sb-guest';

    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/session-bridge/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'session_bridge',
                hint: hint,
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

## Hybrid Authentication (B2C 25.3+)

**Hybrid Auth replaces Plugin SLAS** for hybrid PWA/SFRA storefronts. It's built directly into the B2C platform and provides automatic session synchronization.

### Benefits

- No manual session bridge implementation needed
- Automatic sync between PWA and SFRA
- Simplified token management
- Built-in platform support

### Migration from Plugin SLAS

If using Plugin SLAS, migrate to Hybrid Auth:

1. Upgrade to B2C Commerce 25.3+
2. Enable Hybrid Auth in Business Manager
3. Remove Plugin SLAS cartridge
4. Update storefront to use platform auth

## Token Refresh

**Important:** The `channel_id` parameter is **required** for guest token refresh.

### Public Clients (Single-Use Refresh)

Public clients (no secret) receive single-use refresh tokens:

```javascript
async function refreshTokenPublic(refreshToken, clientId, siteId) {
    const response = await fetch(
        `https://${shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${orgId}/oauth2/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                channel_id: siteId  // REQUIRED
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
async function refreshTokenPrivate(refreshToken, clientId, clientSecret, siteId) {
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
                channel_id: siteId  // REQUIRED
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

### Important Constraints

**3-Second Protection Window:** Multiple TSOB calls for the same shopper within 3 seconds return HTTP 409:

```
"Tenant id <id> has already performed a login operation for user id <user_id> in the last 3 seconds."
```

Handle this in your code:

```javascript
async function getTSOBTokenWithRetry(shopperLoginId, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await getTSOBToken(shopperLoginId);
        } catch (error) {
            if (error.status === 409 && i < maxRetries - 1) {
                await new Promise(r => setTimeout(r, 3000));
                continue;
            }
            throw error;
        }
    }
}
```

### Required Configuration

1. SLAS client must have TSOB enabled (`sfcc.ts_ext_on_behalf_of` scope)
2. Configure in SLAS Admin API or Business Manager
3. Secure the client secret (server-side only)
4. Keep `login_id` length under 60 characters

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
| `tsob` | TSOB token type (for trusted system tokens) |

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
- Always include `channel_id` in refresh requests

### User Experience

- Provide fallback authentication methods
- Show clear error messages for auth failures
- Remember user's preferred auth method
- Handle session expiry gracefully

## Detailed References

- [Session Bridge Flows](references/SESSION-BRIDGE.md) - Detailed session bridge implementation
- [Token Lifecycle](references/TOKEN-LIFECYCLE.md) - Token expiry and refresh patterns
