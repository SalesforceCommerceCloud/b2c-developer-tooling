<!-- prettier-ignore-start -->
# Class OAuthFinalizedResponse

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.oauth.OAuthFinalizedResponse](dw.customer.oauth.OAuthFinalizedResponse.md)

Contains the combined responses from the third-party OAuth server when
finalizing the authentication.


Contains both the [OAuthAccessTokenResponse](dw.customer.oauth.OAuthAccessTokenResponse.md) 

and the [OAuthUserInfoResponse](dw.customer.oauth.OAuthUserInfoResponse.md)



## Property Summary

| Property | Description |
| --- | --- |
| [accessTokenResponse](#accesstokenresponse): [OAuthAccessTokenResponse](dw.customer.oauth.OAuthAccessTokenResponse.md) `(read-only)` | Returns the access token response |
| [userInfoResponse](#userinforesponse): [OAuthUserInfoResponse](dw.customer.oauth.OAuthUserInfoResponse.md) `(read-only)` | Returns the user info response |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAccessTokenResponse](dw.customer.oauth.OAuthFinalizedResponse.md#getaccesstokenresponse)() | Returns the access token response |
| [getUserInfoResponse](dw.customer.oauth.OAuthFinalizedResponse.md#getuserinforesponse)() | Returns the user info response |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### accessTokenResponse
- accessTokenResponse: [OAuthAccessTokenResponse](dw.customer.oauth.OAuthAccessTokenResponse.md) `(read-only)`
  - : Returns the access token response


---

### userInfoResponse
- userInfoResponse: [OAuthUserInfoResponse](dw.customer.oauth.OAuthUserInfoResponse.md) `(read-only)`
  - : Returns the user info response


---

## Method Details

### getAccessTokenResponse()
- getAccessTokenResponse(): [OAuthAccessTokenResponse](dw.customer.oauth.OAuthAccessTokenResponse.md)
  - : Returns the access token response

    **Returns:**
    - the access token response


---

### getUserInfoResponse()
- getUserInfoResponse(): [OAuthUserInfoResponse](dw.customer.oauth.OAuthUserInfoResponse.md)
  - : Returns the user info response

    **Returns:**
    - the user info response


---

<!-- prettier-ignore-end -->
