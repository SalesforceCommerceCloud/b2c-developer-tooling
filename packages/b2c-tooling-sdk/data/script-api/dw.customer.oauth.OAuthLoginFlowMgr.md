<!-- prettier-ignore-start -->
# Class OAuthLoginFlowMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.oauth.OAuthLoginFlowMgr](dw.customer.oauth.OAuthLoginFlowMgr.md)

The OAuthLoginFlowMgr encapsulates interactions with third party
OAuth providers to support the Authorization Code Flow.

The way to use is:

- call [initiateOAuthLogin(String)](dw.customer.oauth.OAuthLoginFlowMgr.md#initiateoauthloginstring)
- redirect the user to the returned link
- when the user authenticates there the server will call back to  a URL configured on the provider's web site
- when processing the request made from the provider's web site  you have two choices - either call the [obtainAccessToken()](dw.customer.oauth.OAuthLoginFlowMgr.md#obtainaccesstoken)and [obtainUserInfo(String, String)](dw.customer.oauth.OAuthLoginFlowMgr.md#obtainuserinfostring-string)methods one after another separately (gives you more flexibility),  or call the [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin)method which internally  calls the other two (simpler to use).

Sample code for using it:

```
var finalizedResponse : OAuthFinalizedResponse = OAuthLoginFlowMgr.finalizeOAuthLogin();
var userInfo = finalizedResponse.userInfoResponse.userInfo;
```

or:

```
var accessTokenResponse : OAuthAccessTokenResponse = OAuthLoginFlowMgr.obtainAccessToken();
var userInfoResponse : OAuthUserInfoResponse = OAuthLoginFlowMgr.obtainUserInfo(
    accessTokenResponse.oauthProviderId, accessTokenResponse.accessToken);
var userInfo = userInfoResponse.userInfo;
```



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [OAuthLoginFlowMgr](#oauthloginflowmgr)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| static [finalizeOAuthLogin](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin)() | This method works in tandem with the [initiateOAuthLogin(String)](dw.customer.oauth.OAuthLoginFlowMgr.md#initiateoauthloginstring) method. |
| static [initiateOAuthLogin](dw.customer.oauth.OAuthLoginFlowMgr.md#initiateoauthloginstring)([String](TopLevel.String.md)) | This method works in tandem with another method - [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin). |
| static [obtainAccessToken](dw.customer.oauth.OAuthLoginFlowMgr.md#obtainaccesstoken)() | This method is called internally by [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin). |
| static [obtainUserInfo](dw.customer.oauth.OAuthLoginFlowMgr.md#obtainuserinfostring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | This method is called internally by [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### OAuthLoginFlowMgr()
- OAuthLoginFlowMgr()
  - : 


---

## Method Details

### finalizeOAuthLogin()
- static finalizeOAuthLogin(): [OAuthFinalizedResponse](dw.customer.oauth.OAuthFinalizedResponse.md)
  - : This method works in tandem with the [initiateOAuthLogin(String)](dw.customer.oauth.OAuthLoginFlowMgr.md#initiateoauthloginstring) method.
      After the user has been redirected to the URL returned by that method
      to the external OAuth2 provider and the user has interacted with the provider's
      site, the browser is redirected to a URL configured on the provider's web
      site. This URL should be that of a pipeline that contains
      a script invoking the finalizeOAuthLogin method.
      
      
      At this point the user has either been authenticated by the external provider
      or not (forgot password, or simply refused to provide credentials). If the user
      has been authenticated by the external provider and the provider returns an
      authentication code, this method exchanges the code for a token and with that
      token it requests from the provider the user information specified by the
      configured scope (id, first/last name, email, etc.).
      
      
      
      The method is aggregation of two other methods - [obtainAccessToken()](dw.customer.oauth.OAuthLoginFlowMgr.md#obtainaccesstoken)
      and [obtainUserInfo(String, String)](dw.customer.oauth.OAuthLoginFlowMgr.md#obtainuserinfostring-string)
      and is provided for convenience. You may want to
      use the two individual methods instead if you need more flexibility.
      
      
      
      This supports the Authorization Code Flow.


    **Returns:**
    - the user info on success, null otherwise


---

### initiateOAuthLogin(String)
- static initiateOAuthLogin(oauthProviderId: [String](TopLevel.String.md)): [URLRedirect](dw.web.URLRedirect.md)
  - : This method works in tandem with another method - [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin).
      It starts the process of authentication via an external OAuth2 provider. It
      takes one parameter - OAuthProviderId (as configured in the system). Outputs
      an URL pointing to the OAuth2 provider's web page to which the browser should
      redirect to initiate the actual user authentication or NULL if there is an
      invalid configuration or an error occurs.
      The method stores a few key/values in the session
      ([Session.getPrivacy()](dw.system.Session.md#getprivacy), implementation specific parameters and may change at any time)
      to be picked up by the [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin) method  when the provider redirects back.
      
      
      
      This supports the Authorization Code Flow.


    **Parameters:**
    - oauthProviderId - the OAuth provider id

    **Returns:**
    - URL to redirect to


---

### obtainAccessToken()
- static obtainAccessToken(): [OAuthAccessTokenResponse](dw.customer.oauth.OAuthAccessTokenResponse.md)
  - : This method is called internally by [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin).
      There are customer requests to expose a more granular way of
      doing the interactions that finalizeOAuthLogin is currently doing
      with the third party OAuth server to accommodate certain providers.
      
      
      
      This supports the Authorization Code Flow.


    **Returns:**
    - the access token response


---

### obtainUserInfo(String, String)
- static obtainUserInfo(oauthProviderId: [String](TopLevel.String.md), accessToken: [String](TopLevel.String.md)): [OAuthUserInfoResponse](dw.customer.oauth.OAuthUserInfoResponse.md)
  - : This method is called internally by [finalizeOAuthLogin()](dw.customer.oauth.OAuthLoginFlowMgr.md#finalizeoauthlogin).
      There are customer requests to expose a more granular way of
      doing the interactions that finalizeOAuthLogin is currently doing
      with the third party OAuth server to accommodate certain providers.
      
      
      
      This supports the Authorization Code Flow.


    **Parameters:**
    - oauthProviderId - the OAuth provider id
    - accessToken - the OAuth provider's access token

    **Returns:**
    - the user info response


---

<!-- prettier-ignore-end -->
