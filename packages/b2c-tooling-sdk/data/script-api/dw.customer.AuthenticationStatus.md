<!-- prettier-ignore-start -->
# Class AuthenticationStatus

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.AuthenticationStatus](dw.customer.AuthenticationStatus.md)

Holds the status of an authentication process.


## Constant Summary

| Constant | Description |
| --- | --- |
| [AUTH_OK](#auth_ok): [String](TopLevel.String.md) = "AUTH_OK" | Authentication was successful |
| [ERROR_CUSTOMER_DISABLED](#error_customer_disabled): [String](TopLevel.String.md) = "ERROR_CUSTOMER_DISABLED" | customer could be found, but is disabled. |
| [ERROR_CUSTOMER_LOCKED](#error_customer_locked): [String](TopLevel.String.md) = "ERROR_CUSTOMER_LOCKED" | customer could be found, but is locked (too many failed login attempts). |
| [ERROR_CUSTOMER_NOT_FOUND](#error_customer_not_found): [String](TopLevel.String.md) = "ERROR_CUSTOMER_NOT_FOUND" | customer could not be found |
| [ERROR_PASSWORD_EXPIRED](#error_password_expired): [String](TopLevel.String.md) = "ERROR_PASSWORD_EXPIRED" | Password does match, but is expired. |
| [ERROR_PASSWORD_MISMATCH](#error_password_mismatch): [String](TopLevel.String.md) = "ERROR_PASSWORD_MISMATCH" | the used password is not correct |
| [ERROR_UNKNOWN](#error_unknown): [String](TopLevel.String.md) = "ERROR_UNKNOWN" | Any other error |

## Property Summary

| Property | Description |
| --- | --- |
| [authenticated](#authenticated): [Boolean](TopLevel.Boolean.md) `(read-only)` | checks whether the authentication was successful or not |
| [customer](#customer): [Customer](dw.customer.Customer.md) `(read-only)` | The customer, corresponding to the login used during authentication. |
| [status](#status): [String](TopLevel.String.md) `(read-only)` | the status code (see the constants above) |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getCustomer](dw.customer.AuthenticationStatus.md#getcustomer)() | The customer, corresponding to the login used during authentication. |
| [getStatus](dw.customer.AuthenticationStatus.md#getstatus)() | the status code (see the constants above) |
| [isAuthenticated](dw.customer.AuthenticationStatus.md#isauthenticated)() | checks whether the authentication was successful or not |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### AUTH_OK

- AUTH_OK: [String](TopLevel.String.md) = "AUTH_OK"
  - : Authentication was successful


---

### ERROR_CUSTOMER_DISABLED

- ERROR_CUSTOMER_DISABLED: [String](TopLevel.String.md) = "ERROR_CUSTOMER_DISABLED"
  - : customer could be found, but is disabled. Password was not verified.


---

### ERROR_CUSTOMER_LOCKED

- ERROR_CUSTOMER_LOCKED: [String](TopLevel.String.md) = "ERROR_CUSTOMER_LOCKED"
  - : customer could be found, but is locked (too many failed login attempts). Password was verified before.


---

### ERROR_CUSTOMER_NOT_FOUND

- ERROR_CUSTOMER_NOT_FOUND: [String](TopLevel.String.md) = "ERROR_CUSTOMER_NOT_FOUND"
  - : customer could not be found


---

### ERROR_PASSWORD_EXPIRED

- ERROR_PASSWORD_EXPIRED: [String](TopLevel.String.md) = "ERROR_PASSWORD_EXPIRED"
  - : Password does match, but is expired.


---

### ERROR_PASSWORD_MISMATCH

- ERROR_PASSWORD_MISMATCH: [String](TopLevel.String.md) = "ERROR_PASSWORD_MISMATCH"
  - : the used password is not correct


---

### ERROR_UNKNOWN

- ERROR_UNKNOWN: [String](TopLevel.String.md) = "ERROR_UNKNOWN"
  - : Any other error


---

## Property Details

### authenticated
- authenticated: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : checks whether the authentication was successful or not


---

### customer
- customer: [Customer](dw.customer.Customer.md) `(read-only)`
  - : The customer, corresponding to the login used during authentication. This customer is not logged in after authentication.


---

### status
- status: [String](TopLevel.String.md) `(read-only)`
  - : the status code (see the constants above)


---

## Method Details

### getCustomer()
- getCustomer(): [Customer](dw.customer.Customer.md)
  - : The customer, corresponding to the login used during authentication. This customer is not logged in after authentication.

    **Returns:**
    - the customer described by the login


---

### getStatus()
- getStatus(): [String](TopLevel.String.md)
  - : the status code (see the constants above)

    **Returns:**
    - the status code


---

### isAuthenticated()
- isAuthenticated(): [Boolean](TopLevel.Boolean.md)
  - : checks whether the authentication was successful or not

    **Returns:**
    - the when the authentication was successful


---

<!-- prettier-ignore-end -->
