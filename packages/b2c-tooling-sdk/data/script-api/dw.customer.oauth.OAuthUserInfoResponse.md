<!-- prettier-ignore-start -->
# Class OAuthUserInfoResponse

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.oauth.OAuthUserInfoResponse](dw.customer.oauth.OAuthUserInfoResponse.md)

Contains the response from the third-party OAuth server when
requesting user info. Refer to the corresponding OAuth provider documentation
regarding what the format might be (in most cases it would be JSON).
The data returned would also vary depending on the scope.



## Property Summary

| Property | Description |
| --- | --- |
| [errorStatus](#errorstatus): [String](TopLevel.String.md) `(read-only)` | Returns the error status  In cases of errors - more detailed error information  can be seen in the error log files (specificity of error details vary by OAuth provider). |
| [userInfo](#userinfo): [String](TopLevel.String.md) `(read-only)` | Returns the user info as a String. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getErrorStatus](dw.customer.oauth.OAuthUserInfoResponse.md#geterrorstatus)() | Returns the error status  In cases of errors - more detailed error information  can be seen in the error log files (specificity of error details vary by OAuth provider). |
| [getUserInfo](dw.customer.oauth.OAuthUserInfoResponse.md#getuserinfo)() | Returns the user info as a String. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### errorStatus
- errorStatus: [String](TopLevel.String.md) `(read-only)`
  - : Returns the error status
      In cases of errors - more detailed error information
      can be seen in the error log files (specificity of error details vary by OAuth provider).



---

### userInfo
- userInfo: [String](TopLevel.String.md) `(read-only)`
  - : Returns the user info as a String. Refer to the corresponding OAuth provider documentation
      regarding what the format might be (in most cases it would be JSON).
      The data returned would also vary depending on the configured 'scope'.



---

## Method Details

### getErrorStatus()
- getErrorStatus(): [String](TopLevel.String.md)
  - : Returns the error status
      In cases of errors - more detailed error information
      can be seen in the error log files (specificity of error details vary by OAuth provider).


    **Returns:**
    - the error status


---

### getUserInfo()
- getUserInfo(): [String](TopLevel.String.md)
  - : Returns the user info as a String. Refer to the corresponding OAuth provider documentation
      regarding what the format might be (in most cases it would be JSON).
      The data returned would also vary depending on the configured 'scope'.


    **Returns:**
    - the user info


---

<!-- prettier-ignore-end -->
