<!-- prettier-ignore-start -->
# Class AgentUserStatusCodes

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.AgentUserStatusCodes](dw.customer.AgentUserStatusCodes.md)

AgentUserStatusCodes contains constants representing status codes that can be
used with a [Status](dw.system.Status.md) object to indicate the success or failure of the agent
user login process.


**See Also:**
- [Status](dw.system.Status.md)


## All Known Subclasses
[AgentUserStatusCodes](dw.system.AgentUserStatusCodes.md)
## Constant Summary

| Constant | Description |
| --- | --- |
| [AGENT_USER_NOT_AVAILABLE](#agent_user_not_available): [String](TopLevel.String.md) = "AGENT_USER_NOT_AVAILABLE" | Indicates that the agent user is not available. |
| [AGENT_USER_NOT_LOGGED_IN](#agent_user_not_logged_in): [String](TopLevel.String.md) = "AGENT_USER_NOT_LOGGED_IN" | Indicates that the agent user is not logged in. |
| [CREDENTIALS_INVALID](#credentials_invalid): [String](TopLevel.String.md) = "CREDENTIALS_INVALID" | Indicates that the given agent user login or password was wrong. |
| [CUSTOMER_DISABLED](#customer_disabled): [String](TopLevel.String.md) = "CUSTOMER_DISABLED" | Indicates that the customer is disabled. |
| [CUSTOMER_UNREGISTERED](#customer_unregistered): [String](TopLevel.String.md) = "CUSTOMER_UNREGISTERED" | Indicates that the customer is either not registered or not registered with the current site. |
| [INSECURE_CONNECTION](#insecure_connection): [String](TopLevel.String.md) = "INSECURE_CONNECTION" | Indicates that the current connection is not secure (HTTP instead of HTTPS)  and the server is configured to require a secure connection. |
| [INSUFFICIENT_PERMISSION](#insufficient_permission): [String](TopLevel.String.md) = "INSUFFICIENT_PERMISSION" | Indicates that the given agent user does not have the permission  'Login\_Agent' which is required to login to the storefront as an agent  user. |
| [LOGIN_SUCCESSFUL](#login_successful): [String](TopLevel.String.md) = "LOGIN_SUCCESSFUL" | Indicates that the agent user login was successful. |
| [NO_STOREFRONT](#no_storefront): [String](TopLevel.String.md) = "NO_STOREFRONT" | Indicates that the current context is not a storefront request. |
| [PASSWORD_EXPIRED](#password_expired): [String](TopLevel.String.md) = "PASSWORD_EXPIRED" | Indicates that the given agent user password has expired and needs to be  changed in the Business Manager. |
| [USER_DISABLED](#user_disabled): [String](TopLevel.String.md) = "USER_DISABLED" | Indicates that the agent user account has been disabled in the Business  Manager. |
| [USER_LOCKED](#user_locked): [String](TopLevel.String.md) = "USER_LOCKED" | Indicates that the agent user account is locked, because the maximum  number of failed login attempts was exceeded. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [AgentUserStatusCodes](#agentuserstatuscodes)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### AGENT_USER_NOT_AVAILABLE

- AGENT_USER_NOT_AVAILABLE: [String](TopLevel.String.md) = "AGENT_USER_NOT_AVAILABLE"
  - : Indicates that the agent user is not available.


---

### AGENT_USER_NOT_LOGGED_IN

- AGENT_USER_NOT_LOGGED_IN: [String](TopLevel.String.md) = "AGENT_USER_NOT_LOGGED_IN"
  - : Indicates that the agent user is not logged in.


---

### CREDENTIALS_INVALID

- CREDENTIALS_INVALID: [String](TopLevel.String.md) = "CREDENTIALS_INVALID"
  - : Indicates that the given agent user login or password was wrong.


---

### CUSTOMER_DISABLED

- CUSTOMER_DISABLED: [String](TopLevel.String.md) = "CUSTOMER_DISABLED"
  - : Indicates that the customer is disabled.


---

### CUSTOMER_UNREGISTERED

- CUSTOMER_UNREGISTERED: [String](TopLevel.String.md) = "CUSTOMER_UNREGISTERED"
  - : Indicates that the customer is either not registered or not registered with the current site.


---

### INSECURE_CONNECTION

- INSECURE_CONNECTION: [String](TopLevel.String.md) = "INSECURE_CONNECTION"
  - : Indicates that the current connection is not secure (HTTP instead of HTTPS)
      and the server is configured to require a secure connection.



---

### INSUFFICIENT_PERMISSION

- INSUFFICIENT_PERMISSION: [String](TopLevel.String.md) = "INSUFFICIENT_PERMISSION"
  - : Indicates that the given agent user does not have the permission
      'Login\_Agent' which is required to login to the storefront as an agent
      user.



---

### LOGIN_SUCCESSFUL

- LOGIN_SUCCESSFUL: [String](TopLevel.String.md) = "LOGIN_SUCCESSFUL"
  - : Indicates that the agent user login was successful.


---

### NO_STOREFRONT

- NO_STOREFRONT: [String](TopLevel.String.md) = "NO_STOREFRONT"
  - : Indicates that the current context is not a storefront request.


---

### PASSWORD_EXPIRED

- PASSWORD_EXPIRED: [String](TopLevel.String.md) = "PASSWORD_EXPIRED"
  - : Indicates that the given agent user password has expired and needs to be
      changed in the Business Manager.



---

### USER_DISABLED

- USER_DISABLED: [String](TopLevel.String.md) = "USER_DISABLED"
  - : Indicates that the agent user account has been disabled in the Business
      Manager.



---

### USER_LOCKED

- USER_LOCKED: [String](TopLevel.String.md) = "USER_LOCKED"
  - : Indicates that the agent user account is locked, because the maximum
      number of failed login attempts was exceeded.



---

## Constructor Details

### AgentUserStatusCodes()
- AgentUserStatusCodes()
  - : 


---

<!-- prettier-ignore-end -->
