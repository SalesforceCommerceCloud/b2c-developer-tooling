# SLAS Shopper Login

The `b2c_tooling_sdk.slas` subpackage retrieves **shopper** access tokens from
the SLAS (Shopper Login and API Access Service) Shopper Login service. It
supports both public (PKCE) and private (`client_credentials` / HTTP Basic)
client flows, for guest and registered customers.

This subpackage is intentionally **not** re-exported from the top-level
`b2c_tooling_sdk` package — import it directly:

```python
from b2c_tooling_sdk.slas import get_guest_token, get_registered_token
```

(Blocking twins live in `b2c_tooling_sdk.sync` — `from b2c_tooling_sdk.sync
import get_guest_token`.)

## Guest tokens

Provide a `SlasTokenConfig` with your SCAPI short code, organization ID, SLAS
client ID, site ID, and redirect URI. A public client omits `slas_client_secret`;
a private client provides it.

```python
from b2c_tooling_sdk.slas import get_guest_token, SlasTokenConfig

token = await get_guest_token(
    SlasTokenConfig(
        short_code="abcd1234",
        organization_id="f_ecom_zzte_053",
        slas_client_id="your-slas-client-id",
        site_id="RefArch",
        redirect_uri="http://localhost:3000/callback",
        # slas_client_secret="..."   # omit for a public (PKCE) client
    )
)

print(token.access_token)  # shopper JWT
print(token.usid, token.customer_id, token.expires_in)
```

The result is a `SlasTokenResponse` with `access_token`, `refresh_token`,
`expires_in`, `token_type`, `usid`, `customer_id`, and an optional `id_token`.

## Registered customer tokens

`get_registered_token` takes a `SlasRegisteredLoginConfig` (a `SlasTokenConfig`
plus `shopper_login` and `shopper_password`):

```python
from b2c_tooling_sdk.slas import get_registered_token, SlasRegisteredLoginConfig

token = await get_registered_token(
    SlasRegisteredLoginConfig(
        short_code="abcd1234",
        organization_id="f_ecom_zzte_053",
        slas_client_id="your-slas-client-id",
        site_id="RefArch",
        redirect_uri="http://localhost:3000/callback",
        shopper_login="jdoe@example.com",
        shopper_password="s3cret",
    )
)
```

## PKCE helpers

For public clients the SDK generates the PKCE code verifier and challenge for
you internally. If you are wiring your own flow, the helpers are exported
directly:

```python
from b2c_tooling_sdk.slas import generate_code_verifier, generate_code_challenge

verifier = generate_code_verifier()
challenge = generate_code_challenge(verifier)
```

## API reference

See the [SLAS section of the API reference](api-reference.md#slas-shopper-login).
