# Passkeys (FIDO2/WebAuthn)

Enable biometric authentication using passkeys.

**Important:** Passkey registration requires **prior identity verification via OTP**. Users must first verify their email before registering a passkey.

## Registration Flow (3 Steps)

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

## Authentication Flow

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
