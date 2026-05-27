# Set Up OAuth Credentials

OAuth credentials enable advanced features like **Sandbox Management** and **API Browser**.

## What You Need

Add these fields to your `dw.json`:

```json
{
  "hostname": "your-sandbox.demandware.net",
  "username": "your-username",
  "password": "your-password",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "shortCode": "your-short-code"
}
```

## Getting OAuth Credentials

### 1. Log in to Account Manager
Visit [https://account.demandware.com/](https://account.demandware.com/)

### 2. Create an API Client
- Navigate to **API Client** section
- Click **Add API Client**
- Configure the client with these scopes:
  - `sfcc.sandboxes.rw` (for sandbox management)
  - `sfcc.shopper-*` (for SCAPI browsing)

### 3. Copy Credentials
After creating the client, you'll receive:
- **Client ID**: Unique identifier for your API client
- **Client Secret**: Secret key (save this immediately!)
- **Short Code**: Your organization's short code

### 4. Add to dw.json
```json
{
  "clientId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "clientSecret": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "shortCode": "your_short_code"
}
```

## What OAuth Enables

✅ **Sandbox Explorer**
- Create and delete sandboxes
- Start, stop, and restart sandboxes
- Extend sandbox expiration
- Open Business Manager directly

✅ **API Browser**
- Browse SCAPI OpenAPI specifications
- View interactive Swagger UI documentation
- Test API endpoints

## Optional Step

OAuth is **optional** for basic development. You can skip this step if you only need:
- WebDAV browsing
- Cartridge deployment
- Code Sync

---

When you're ready, click **Refresh** in the Sandbox Explorer to verify your OAuth setup!
