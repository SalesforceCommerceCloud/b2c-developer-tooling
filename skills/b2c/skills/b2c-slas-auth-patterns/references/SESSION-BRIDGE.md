# Session Bridge Reference

Detailed implementation patterns for session bridging between PWA Kit and SFRA.

## Token Types

| Token | Description | Duration |
|-------|-------------|----------|
| `dwsgst` | Guest session token | 30 minutes |
| `dwsrst` | Registered session token | 30 minutes |
| `dwsid` | SFRA session cookie | Session-based |

## PWA Kit to SFRA

### Step 1: Generate Bridge Tokens

```javascript
// commerce-sdk-isomorphic or direct API call
async function generateBridgeTokens(shopperToken) {
    const response = await shopperLogin.getSessionBridgeAccessToken({
        headers: {
            Authorization: `Bearer ${shopperToken.access_token}`
        },
        body: {
            channel_id: siteId,
            login_id: shopperToken.customer_id
        }
    });

    return {
        dwsgst: response.dwsgst,
        dwsrst: response.dwsrst // Only present if logged in
    };
}
```

### Step 2: Redirect with Tokens

Option A: URL Parameters (simple)

```javascript
function redirectToSFRA(bridgeTokens, targetPath) {
    const url = new URL(sfraBaseUrl + targetPath);
    url.searchParams.set('dwsgst', bridgeTokens.dwsgst);
    if (bridgeTokens.dwsrst) {
        url.searchParams.set('dwsrst', bridgeTokens.dwsrst);
    }
    window.location.href = url.toString();
}
```

Option B: POST Form (more secure)

```javascript
function redirectViaPOST(bridgeTokens, targetPath) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = sfraBaseUrl + '/SessionBridge-Establish';

    const addInput = (name, value) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    };

    addInput('dwsgst', bridgeTokens.dwsgst);
    if (bridgeTokens.dwsrst) {
        addInput('dwsrst', bridgeTokens.dwsrst);
    }
    addInput('redirect', targetPath);

    document.body.appendChild(form);
    form.submit();
}
```

### Step 3: SFRA Establishes Session

```javascript
// SFRA Controller: SessionBridge-Establish
var server = require('server');
var SLASBridge = require('*/cartridge/scripts/services/SLASBridge');

server.post('Establish', function(req, res, next) {
    var dwsgst = req.form.dwsgst;
    var dwsrst = req.form.dwsrst;
    var redirect = req.form.redirect || '/';

    try {
        // Exchange bridge tokens for session
        var result = SLASBridge.establishSession(dwsgst, dwsrst);

        if (result.success) {
            // Session established, dwsid cookie is set by platform
            res.redirect(redirect);
        } else {
            res.redirect('/login?error=bridge_failed');
        }
    } catch (e) {
        res.redirect('/login?error=bridge_error');
    }

    next();
});
```

## SFRA to PWA Kit

### Step 1: Generate Bridge Tokens in SFRA

```javascript
// SFRA Helper
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

function getBridgeTokensForPWA() {
    var customer = session.customer;
    var svc = LocalServiceRegistry.createService('slas.sessionbridge', {
        createRequest: function(svc, args) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');

            var params = 'channel_id=' + Site.current.ID;
            if (customer.authenticated) {
                params += '&login_id=' + customer.profile.credentials.login;
            }
            return params;
        },
        parseResponse: function(svc, response) {
            return JSON.parse(response.text);
        }
    });

    var result = svc.call();
    return result.ok ? result.object : null;
}
```

### Step 2: Redirect to PWA Kit

```javascript
// SFRA Controller: SessionBridge-ToPWA
server.get('ToPWA', function(req, res, next) {
    var SLASBridge = require('*/cartridge/scripts/services/SLASBridge');
    var targetPath = req.querystring.path || '/';

    var bridgeTokens = SLASBridge.getBridgeTokensForPWA();

    if (bridgeTokens) {
        var pwaUrl = 'https://pwa.yoursite.com/session-bridge/callback';
        pwaUrl += '?dwsgst=' + encodeURIComponent(bridgeTokens.dwsgst);
        if (bridgeTokens.dwsrst) {
            pwaUrl += '&dwsrst=' + encodeURIComponent(bridgeTokens.dwsrst);
        }
        pwaUrl += '&redirect=' + encodeURIComponent(targetPath);

        res.redirect(pwaUrl);
    } else {
        res.redirect('https://pwa.yoursite.com' + targetPath);
    }

    next();
});
```

### Step 3: PWA Kit Handles Callback

```javascript
// PWA Kit: pages/session-bridge/callback.jsx
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@salesforce/commerce-sdk-react';

export default function SessionBridgeCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = useAuth();

    useEffect(() => {
        async function establishSession() {
            const dwsgst = searchParams.get('dwsgst');
            const dwsrst = searchParams.get('dwsrst');
            const redirect = searchParams.get('redirect') || '/';

            try {
                // Exchange bridge tokens
                await auth.loginSessionBridge({ dwsgst, dwsrst });
                navigate(redirect);
            } catch (error) {
                console.error('Bridge failed:', error);
                navigate('/login?error=bridge_failed');
            }
        }

        establishSession();
    }, [searchParams]);

    return <div>Establishing session...</div>;
}
```

## Hybrid Navigation Component

```jsx
// PWA Kit: components/hybrid-link.jsx
import { useAuth } from '@salesforce/commerce-sdk-react';

export function HybridLink({ href, children, ...props }) {
    const auth = useAuth();

    const handleClick = async (e) => {
        // Check if href is SFRA
        if (href.includes('sfra.yoursite.com')) {
            e.preventDefault();

            // Get bridge tokens
            const tokens = await auth.getSessionBridgeTokens();

            // Build SFRA URL with tokens
            const url = new URL(href);
            url.searchParams.set('dwsgst', tokens.dwsgst);
            if (tokens.dwsrst) {
                url.searchParams.set('dwsrst', tokens.dwsrst);
            }

            window.location.href = url.toString();
        }
        // Otherwise, let normal navigation happen
    };

    return (
        <a href={href} onClick={handleClick} {...props}>
            {children}
        </a>
    );
}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_token` | Bridge token expired | Re-generate tokens |
| `session_mismatch` | Different customer | Clear and restart |
| `channel_mismatch` | Wrong site ID | Verify channel_id |
| `bridge_disabled` | Feature not enabled | Enable in SLAS config |

## Security Considerations

1. **Token Expiry**: Bridge tokens expire quickly (30 min) - generate fresh tokens before redirect
2. **HTTPS Only**: Always use HTTPS for token exchange
3. **Referrer Validation**: Validate source domain on callback endpoints
4. **Rate Limiting**: Implement rate limiting on bridge endpoints
5. **Token Usage**: Each bridge token should only be used once

## Testing

```bash
# Verify bridge token generation
curl -X POST "https://{shortCode}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/{orgId}/oauth2/session-bridge/token" \
  -H "Authorization: Bearer {access_token}" \
  -d "channel_id={siteId}&login_id={customerId}"
```
