<!-- prettier-ignore-start -->
# Class AgentUserMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.AgentUserMgr](dw.customer.AgentUserMgr.md)

Provides helper methods for handling agent user functionality (login and logout)
Pay attention to appropriate legal and regulatory requirements related to this functionality.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [loginAgentUser](dw.customer.AgentUserMgr.md#loginagentuserstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Logs in an agent user (which for example is authorized to login on-behalf of a customer for  instance to place an order). |
| static [loginOnBehalfOfCustomer](dw.customer.AgentUserMgr.md#loginonbehalfofcustomercustomer)([Customer](dw.customer.Customer.md)) | This method logs the specified customer into the current session if the  current agent user has the functional permission 'Login\_On\_Behalf' in the  current site. |
| static [logoutAgentUser](dw.customer.AgentUserMgr.md#logoutagentuser)() | Performs a logout of the agent user and the current customer which are attached to the current session. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### loginAgentUser(String, String)
- static loginAgentUser(login: [String](TopLevel.String.md), password: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : Logs in an agent user (which for example is authorized to login on-behalf of a customer for
      instance to place an order). The login is only allowed during a secure protocol
      request (https) and only in the storefront context. The user must have the permission 'Login\_Agent'.
      
      When the login is successful, a new session will be created. Any objects that need
      to be preserved in the session need to bet set on the session afterwards.
      
      A Status object is returned which signals whether the login was successful or not.
      In case of a login failure the status object contains the reason for this.
      See [AgentUserStatusCodes](dw.customer.AgentUserStatusCodes.md) for more information.


    **Parameters:**
    - login - the login name for the agent user.
    - password - the password for the agent user.

    **Returns:**
    - the login status (OK if successful, error code otherwise).


---

### loginOnBehalfOfCustomer(Customer)
- static loginOnBehalfOfCustomer(customer: [Customer](dw.customer.Customer.md)): [Status](dw.system.Status.md)
  - : This method logs the specified customer into the current session if the
      current agent user has the functional permission 'Login\_On\_Behalf' in the
      current site.
      
      The dwcustomer cookie will not be set.
      The login is only allowed during a secure protocol request (https).
      A Status object is returned indicating whether the login was successful or not (and indicating the
      failure reason). See [AgentUserStatusCodes](dw.customer.AgentUserStatusCodes.md) for more information.
      Error conditions include:
      
      - if the method is not called in the storefront context
      - if the given customer is not a registered customer (anonymous)
      - if the given customer is not registered for the current site
      - if the given customer is disabled
      - if there is no agent user at the current session
      - if the agent user is not logged in
      - if the agent user has not the functional permission 'Login\_On\_Behalf'


    **Parameters:**
    - customer - The customer, which should be logged instead of the agent user

    **Returns:**
    - the login status (OK if successful, error code otherwise).


---

### logoutAgentUser()
- static logoutAgentUser(): [Status](dw.system.Status.md)
  - : Performs a logout of the agent user and the current customer which are attached to the current session.
      The logout is only allowed during a secure protocol request (https) and only in the storefront context.


    **Returns:**
    - the logout status (OK if successful, error code otherwise).


---

<!-- prettier-ignore-end -->
