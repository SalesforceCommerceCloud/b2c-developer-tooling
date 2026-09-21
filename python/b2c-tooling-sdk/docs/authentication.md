# Authentication

The SDK ships several authentication strategies, each implementing the
`AuthStrategy` protocol — an async `fetch(url, ...)` that injects credentials and
handles token retrieval, caching, retry, and refresh. Everything lives under
`b2c_tooling_sdk.auth` (and the common symbols are re-exported at the top level).

## Strategies at a glance

| Strategy | Class | Use it for |
| --- | --- | --- |
| OAuth client-credentials | `OAuthStrategy` | System (server-to-server) API access with a client ID + secret |
| JWT Bearer | `JwtOAuthStrategy` | System access using a signed JWT (certificate + key) instead of a secret |
| PKCE (interactive) | `PkceOAuthStrategy` | User/browser login with Authorization Code + PKCE |
| Implicit | `ImplicitOAuthStrategy` | Legacy interactive browser login |
| Basic | `BasicAuthStrategy` | WebDAV / OCAPI Basic auth with username + password |
| API key | `ApiKeyStrategy` | Sending a static API key header |

`OAuthMethod` values are `"client-credentials"`, `"jwt"`, `"user"` (PKCE with
implicit fallback), `"implicit"`, `"basic"`, and `"api-key"`; the full set is
available as `ALL_AUTH_METHODS`.

## OAuth client-credentials

The most common non-interactive strategy. Tokens are minted from Account Manager
and cached in-process (single-flight per identity + scope set):

```python
import asyncio

from b2c_tooling_sdk.auth import OAuthStrategy, OAuthConfig


async def main() -> None:
    auth = OAuthStrategy(
        OAuthConfig(
            client_id="your-client-id",
            client_secret="your-client-secret",
            scopes=["sfcc.products"],
        )
    )
    response = await auth.fetch("https://your-instance.demandware.net/s/-/dw/data/v23_2/sites")
    print(response.status_code)


asyncio.run(main())
```

## JWT Bearer

Uses a signed JWT (client certificate + private key) instead of a client secret:

```python
from b2c_tooling_sdk.auth import JwtOAuthStrategy, JwtOAuthConfig

auth = JwtOAuthStrategy(
    JwtOAuthConfig(
        client_id="your-client-id",
        cert_path="/path/to/cert.pem",
        key_path="/path/to/key.pem",
        passphrase=None,
        scopes=["sfcc.products"],
    )
)
```

## PKCE interactive login

`PkceOAuthStrategy` performs the Authorization Code + PKCE browser flow. In
practice you rarely instantiate it directly — use `create_user_auth_strategy`,
which returns a `PkceWithImplicitFallbackStrategy` that transparently falls back
to the implicit flow when the PKCE grant is unavailable, and persists the
resulting session to the shared session store (so a subsequent CLI or Python run
reuses it).

```python
from b2c_tooling_sdk.auth import AuthCredentials, create_user_auth_strategy

auth = create_user_auth_strategy(
    AuthCredentials(
        client_id="your-public-client-id",
        redirect_uri="http://localhost:8080/callback",
    )
)
```

## Implicit, Basic, and API-key

```python
from b2c_tooling_sdk.auth import (
    BasicAuthStrategy,
    ApiKeyStrategy,
    ImplicitOAuthStrategy,
    ImplicitOAuthConfig,
)

basic = BasicAuthStrategy("username", "password")
api_key = ApiKeyStrategy("my-api-key")
implicit = ImplicitOAuthStrategy(ImplicitOAuthConfig(client_id="your-client-id"))
```

## Resolving a strategy from credentials

Rather than picking a class by hand, hand a flat `AuthCredentials` bundle to
`resolve_auth_strategy`. It selects the best available method from the
`allowed_methods` you permit (defaulting to the full precedence order):

```python
from b2c_tooling_sdk.auth import AuthCredentials, resolve_auth_strategy

auth = resolve_auth_strategy(
    AuthCredentials(
        client_id="your-client-id",
        client_secret="your-client-secret",
        scopes=["sfcc.products"],
    ),
    allowed_methods=["client-credentials", "jwt"],
)
```

To discover, without side effects, which methods a given credential bundle could
satisfy, use `check_available_auth_methods`.

## Sharing sessions with the CLI

The auth-session store lives in the **same** `auth-sessions.json` file used by
the `@salesforce/b2c-cli` application. Interactive strategies write their tokens
there; you can also inspect it directly:

```python
from b2c_tooling_sdk.auth import (
    find_auth_session,
    is_auth_session_token_valid,
    list_auth_sessions,
)

session = find_auth_session("your-client-id")
if session and is_auth_session_token_valid(session):
    print("Reusing the token created by `b2c auth login`")

for s in list_auth_sessions():
    print(s.client_id, s.flow, "expires", s.expires_at)
```

Because the store is shared, the recommended workflow is: log in once
interactively with the CLI (`b2c auth login`), then run Python automation that
picks up the same session with no browser prompt. See
[CLI Interoperability](cli-interop.md) for file locations and the on-disk format.

## API reference

See the [auth section of the API reference](api-reference.md#authentication) for
every class and helper.
