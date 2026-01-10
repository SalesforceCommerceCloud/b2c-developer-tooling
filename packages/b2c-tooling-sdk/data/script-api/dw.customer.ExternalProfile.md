<!-- prettier-ignore-start -->
# Class ExternalProfile

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.ExternalProfile](dw.customer.ExternalProfile.md)

Represents the credentials of a customer.

Since 13.6 it is possible to have customers who are not authenticated through a
login and password but through an external authentication provider via the OAuth2 protocol.

In such cases, the AuthenticationProviderID will point to an OAuth provider configured in the system
and the ExternalID will be the unique identifier of the customer on the Authentication Provider's system.

For example, if an authentication provider with ID "Google123" is configured pointing to Google
and the customer has a logged in into Google in the past and has created a profile there, Google
assigns a unique number identifier to that customer. If the storefront is configured to allow
authentication through Google and a new customer logs into the storefront using Google,
the AuthenticationProviderID property of his Credentials will contain "Google123" and
the ExternalID property will contain whatever unique identifier Google has assigned to him.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## Property Summary

| Property | Description |
| --- | --- |
| [authenticationProviderID](#authenticationproviderid): [String](TopLevel.String.md) `(read-only)` | Returns the authentication provider ID. |
| [customer](#customer): [Customer](dw.customer.Customer.md) `(read-only)` | Returns the customer object related to this profile. |
| [email](#email): [String](TopLevel.String.md) | Returns the customer's email address. |
| [externalID](#externalid): [String](TopLevel.String.md) `(read-only)` | Returns the external ID. |
| [lastLoginTime](#lastlogintime): [Date](TopLevel.Date.md) `(read-only)` | Returns the last login time of the customer through the external provider |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAuthenticationProviderID](dw.customer.ExternalProfile.md#getauthenticationproviderid)() | Returns the authentication provider ID. |
| [getCustomer](dw.customer.ExternalProfile.md#getcustomer)() | Returns the customer object related to this profile. |
| [getEmail](dw.customer.ExternalProfile.md#getemail)() | Returns the customer's email address. |
| [getExternalID](dw.customer.ExternalProfile.md#getexternalid)() | Returns the external ID. |
| [getLastLoginTime](dw.customer.ExternalProfile.md#getlastlogintime)() | Returns the last login time of the customer through the external provider |
| [setEmail](dw.customer.ExternalProfile.md#setemailstring)([String](TopLevel.String.md)) | Sets the customer's email address. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### authenticationProviderID
- authenticationProviderID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the authentication provider ID.


---

### customer
- customer: [Customer](dw.customer.Customer.md) `(read-only)`
  - : Returns the customer object related to this profile.


---

### email
- email: [String](TopLevel.String.md)
  - : Returns the customer's email address.


---

### externalID
- externalID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the external ID.


---

### lastLoginTime
- lastLoginTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the last login time of the customer through the external provider


---

## Method Details

### getAuthenticationProviderID()
- getAuthenticationProviderID(): [String](TopLevel.String.md)
  - : Returns the authentication provider ID.

    **Returns:**
    - the authentication provider ID.


---

### getCustomer()
- getCustomer(): [Customer](dw.customer.Customer.md)
  - : Returns the customer object related to this profile.

    **Returns:**
    - customer object related to profile.


---

### getEmail()
- getEmail(): [String](TopLevel.String.md)
  - : Returns the customer's email address.

    **Returns:**
    - the customer's email address.


---

### getExternalID()
- getExternalID(): [String](TopLevel.String.md)
  - : Returns the external ID.

    **Returns:**
    - the external ID.


---

### getLastLoginTime()
- getLastLoginTime(): [Date](TopLevel.Date.md)
  - : Returns the last login time of the customer through the external provider

    **Returns:**
    - the time, when the customer was last logged in through this external provider


---

### setEmail(String)
- setEmail(email: [String](TopLevel.String.md)): void
  - : Sets the customer's email address.

    **Parameters:**
    - email - the customer's email address.


---

<!-- prettier-ignore-end -->
