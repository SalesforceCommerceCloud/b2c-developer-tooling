<!-- prettier-ignore-start -->
# Class OAuthAccessTokenResponse

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.oauth.OAuthAccessTokenResponse](dw.customer.oauth.OAuthAccessTokenResponse.md)

Contains OAuth-related artifacts from the HTTP response from the third-party
OAuth server when requesting an access token



## Property Summary

| Property | Description |
| --- | --- |
| [IDToken](#idtoken): [String](TopLevel.String.md) `(read-only)` | Returns the ID token, if available |
| [accessToken](#accesstoken): [String](TopLevel.String.md) `(read-only)` | Returns the access token |
| [accessTokenExpiry](#accesstokenexpiry): [Number](TopLevel.Number.md) `(read-only)` | Returns the access token expiration |
| [errorStatus](#errorstatus): [String](TopLevel.String.md) `(read-only)` | Returns the error status. |
| [extraTokens](#extratokens): [Map](dw.util.Map.md) `(read-only)` | Returns a map of additional tokens found in the response. |
| [oauthProviderId](#oauthproviderid): [String](TopLevel.String.md) `(read-only)` | Returns the OAuth provider id |
| [refreshToken](#refreshtoken): [String](TopLevel.String.md) `(read-only)` | Returns the refresh token |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAccessToken](dw.customer.oauth.OAuthAccessTokenResponse.md#getaccesstoken)() | Returns the access token |
| [getAccessTokenExpiry](dw.customer.oauth.OAuthAccessTokenResponse.md#getaccesstokenexpiry)() | Returns the access token expiration |
| [getErrorStatus](dw.customer.oauth.OAuthAccessTokenResponse.md#geterrorstatus)() | Returns the error status. |
| [getExtraTokens](dw.customer.oauth.OAuthAccessTokenResponse.md#getextratokens)() | Returns a map of additional tokens found in the response. |
| [getIDToken](dw.customer.oauth.OAuthAccessTokenResponse.md#getidtoken)() | Returns the ID token, if available |
| [getOauthProviderId](dw.customer.oauth.OAuthAccessTokenResponse.md#getoauthproviderid)() | Returns the OAuth provider id |
| [getRefreshToken](dw.customer.oauth.OAuthAccessTokenResponse.md#getrefreshtoken)() | Returns the refresh token |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### IDToken
- IDToken: [String](TopLevel.String.md) `(read-only)`
  - : Returns the ID token, if available


---

### accessToken
- accessToken: [String](TopLevel.String.md) `(read-only)`
  - : Returns the access token


---

### accessTokenExpiry
- accessTokenExpiry: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the access token expiration


---

### errorStatus
- errorStatus: [String](TopLevel.String.md) `(read-only)`
  - : Returns the error status.
      In cases of errors - more detailed error information
      can be seen in the error log files (specifity of error details vary by OAuth provider).



---

### extraTokens
- extraTokens: [Map](dw.util.Map.md) `(read-only)`
  - : Returns a map of additional tokens found in the response.


---

### oauthProviderId
- oauthProviderId: [String](TopLevel.String.md) `(read-only)`
  - : Returns the OAuth provider id


---

### refreshToken
- refreshToken: [String](TopLevel.String.md) `(read-only)`
  - : Returns the refresh token


---

## Method Details

### getAccessToken()
- getAccessToken(): [String](TopLevel.String.md)
  - : Returns the access token

    **Returns:**
    - the access token, if available, null otherwise


---

### getAccessTokenExpiry()
- getAccessTokenExpiry(): [Number](TopLevel.Number.md)
  - : Returns the access token expiration

    **Returns:**
    - the access token expiration


---

### getErrorStatus()
- getErrorStatus(): [String](TopLevel.String.md)
  - : Returns the error status.
      In cases of errors - more detailed error information
      can be seen in the error log files (specifity of error details vary by OAuth provider).


    **Returns:**
    - the error status, if available, null otherwise


---

### getExtraTokens()
- getExtraTokens(): [Map](dw.util.Map.md)
  - : Returns a map of additional tokens found in the response.

    **Returns:**
    - Additional tokens provided by the token end-point.  May be null or empty.


---

### getIDToken()
- getIDToken(): [String](TopLevel.String.md)
  - : Returns the ID token, if available

    **Returns:**
    - the ID token, if available, null otherwise


---

### getOauthProviderId()
- getOauthProviderId(): [String](TopLevel.String.md)
  - : Returns the OAuth provider id

    **Returns:**
    - the OAuth provider id


---

### getRefreshToken()
- getRefreshToken(): [String](TopLevel.String.md)
  - : Returns the refresh token

    **Returns:**
    - the refresh token, if available, null otherwise


---

<!-- prettier-ignore-end -->
