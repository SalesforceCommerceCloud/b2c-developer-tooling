<!-- prettier-ignore-start -->
# Class Credentials

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.customer.Credentials](dw.customer.Credentials.md)

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
In such cases the password-related properties of the Credentials will be empty.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## Property Summary

| Property | Description |
| --- | --- |
| ~~[authenticationProviderID](#authenticationproviderid): [String](TopLevel.String.md)~~ | Returns the authentication provider ID. |
| [enabled](#enabled): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this customer is enabled and can log in. |
| [enabledFlag](#enabledflag): [Boolean](TopLevel.Boolean.md) | Identifies if this customer is enabled and can log in - same as isEnabled(). |
| ~~[externalID](#externalid): [String](TopLevel.String.md)~~ | Returns the external ID of the customer. |
| [locked](#locked): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if this customer is temporarily locked out because of invalid  login attempts. |
| [login](#login): [String](TopLevel.String.md) | Returns the login of the user. |
| [passwordAnswer](#passwordanswer): [String](TopLevel.String.md) | Returns the answer to the password question for the customer. |
| [passwordQuestion](#passwordquestion): [String](TopLevel.String.md) | Returns the password question for the customer. |
| [passwordSet](#passwordset): [Boolean](TopLevel.Boolean.md) `(read-only)` | Returns whether the password is set. |
| [remainingLoginAttempts](#remainingloginattempts): [Number](TopLevel.Number.md) `(read-only)` | Returns the number of consecutive failed logins after which this customer  will be temporarily locked out and prevented from logging in to the  current site. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [createResetPasswordToken](dw.customer.Credentials.md#createresetpasswordtoken)() | Generate a random token which can be used for resetting the password of the underlying Customer. |
| ~~[getAuthenticationProviderID](dw.customer.Credentials.md#getauthenticationproviderid)()~~ | Returns the authentication provider ID. |
| [getEnabledFlag](dw.customer.Credentials.md#getenabledflag)() | Identifies if this customer is enabled and can log in - same as isEnabled(). |
| ~~[getExternalID](dw.customer.Credentials.md#getexternalid)()~~ | Returns the external ID of the customer. |
| [getLogin](dw.customer.Credentials.md#getlogin)() | Returns the login of the user. |
| [getPasswordAnswer](dw.customer.Credentials.md#getpasswordanswer)() | Returns the answer to the password question for the customer. |
| [getPasswordQuestion](dw.customer.Credentials.md#getpasswordquestion)() | Returns the password question for the customer. |
| [getRemainingLoginAttempts](dw.customer.Credentials.md#getremainingloginattempts)() | Returns the number of consecutive failed logins after which this customer  will be temporarily locked out and prevented from logging in to the  current site. |
| [isEnabled](dw.customer.Credentials.md#isenabled)() | Identifies if this customer is enabled and can log in. |
| [isLocked](dw.customer.Credentials.md#islocked)() | Identifies if this customer is temporarily locked out because of invalid  login attempts. |
| [isPasswordSet](dw.customer.Credentials.md#ispasswordset)() | Returns whether the password is set. |
| ~~[setAuthenticationProviderID](dw.customer.Credentials.md#setauthenticationprovideridstring)([String](TopLevel.String.md))~~ | Sets the authentication provider ID corresponding to an OAuth provider configured in the system. |
| [setEnabledFlag](dw.customer.Credentials.md#setenabledflagboolean)([Boolean](TopLevel.Boolean.md)) | Sets the enabled status of the customer. |
| ~~[setExternalID](dw.customer.Credentials.md#setexternalidstring)([String](TopLevel.String.md))~~ | Sets the external ID of the customer at the authentication provider. |
| ~~[setLogin](dw.customer.Credentials.md#setloginstring)([String](TopLevel.String.md))~~ | Sets the login value for the customer. |
| [setLogin](dw.customer.Credentials.md#setloginstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Sets the login value for the customer, and also re-encrypt the customer  password based on the new login. |
| [setPassword](dw.customer.Credentials.md#setpasswordstring-string-boolean)([String](TopLevel.String.md), [String](TopLevel.String.md), [Boolean](TopLevel.Boolean.md)) | Sets the password of an authenticated customer.<br/>   The method can be called for externally authenticated customers as well but  these customers will still be externally authenticated so calling the method  for such customers does not have an immediate practical benefit. |
| [setPasswordAnswer](dw.customer.Credentials.md#setpasswordanswerstring)([String](TopLevel.String.md)) | Sets the answer to the password question for the customer. |
| [setPasswordQuestion](dw.customer.Credentials.md#setpasswordquestionstring)([String](TopLevel.String.md)) | Sets the password question for the customer. |
| [setPasswordWithToken](dw.customer.Credentials.md#setpasswordwithtokenstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Set the password of the specified customer to the specified value. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### authenticationProviderID
- ~~authenticationProviderID: [String](TopLevel.String.md)~~
  - : Returns the authentication provider ID.

    **Deprecated:**
:::warning
As of release 17.2, replaced by methods on the new class [ExternalProfile](dw.customer.ExternalProfile.md)
which can be obtained from [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles)

Until the method is fully removed from the API it will get the Authentication Provider from
the first element of the [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles) collection

:::

---

### enabled
- enabled: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this customer is enabled and can log in.


---

### enabledFlag
- enabledFlag: [Boolean](TopLevel.Boolean.md)
  - : Identifies if this customer is enabled and can log in - same as isEnabled().


---

### externalID
- ~~externalID: [String](TopLevel.String.md)~~
  - : Returns the external ID of the customer.

    **Deprecated:**
:::warning
As of release 17.2, replaced by methods on the new class [ExternalProfile](dw.customer.ExternalProfile.md)
which can be obtained from [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles)

Until the method is fully removed from the API it will get the External ID from
the first element of the [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles) collection

:::

---

### locked
- locked: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if this customer is temporarily locked out because of invalid
      login attempts.  If customer locking is not enabled, this method always
      returns false.



---

### login
- login: [String](TopLevel.String.md)
  - : Returns the login of the user. It must be unique.


---

### passwordAnswer
- passwordAnswer: [String](TopLevel.String.md)
  - : Returns the answer to the password question for the customer. The answer is used
      with the password question to confirm the identity of a customer when
      they are trying to fetch their password.



---

### passwordQuestion
- passwordQuestion: [String](TopLevel.String.md)
  - : Returns the password question for the customer. The password question is
      used with the password answer to confirm the identity of a customer when
      they are trying to fetch their password.



---

### passwordSet
- passwordSet: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Returns whether the password is set. Creating externally authenticated customers
      results in customers with credentials for which the password is not set.



---

### remainingLoginAttempts
- remainingLoginAttempts: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the number of consecutive failed logins after which this customer
      will be temporarily locked out and prevented from logging in to the
      current site. This value is based on the number of previous invalid
      logins for this customer and customer site preferences defining the
      limits.
      
      If this customer is already locked out, this method will always return 0.
      If customer locking is disabled altogether, or if the system cannot
      determine the number of failed login attempts for this customer, then
      this method will return a negative number.



---

## Method Details

### createResetPasswordToken()
- createResetPasswordToken(): [String](TopLevel.String.md)
  - : Generate a random token which can be used for resetting the password of the underlying Customer. The token is
      guaranteed to be unique and will be valid for 30 minutes. Any token previously generated for this customer will
      be invalidated.


    **Returns:**
    - The generated token.


---

### getAuthenticationProviderID()
- ~~getAuthenticationProviderID(): [String](TopLevel.String.md)~~
  - : Returns the authentication provider ID.

    **Returns:**
    - the authentication provider ID.

    **Deprecated:**
:::warning
As of release 17.2, replaced by methods on the new class [ExternalProfile](dw.customer.ExternalProfile.md)
which can be obtained from [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles)

Until the method is fully removed from the API it will get the Authentication Provider from
the first element of the [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles) collection

:::

---

### getEnabledFlag()
- getEnabledFlag(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this customer is enabled and can log in - same as isEnabled().

    **Returns:**
    - true if the customer is enabled and can log in, false otherwise.


---

### getExternalID()
- ~~getExternalID(): [String](TopLevel.String.md)~~
  - : Returns the external ID of the customer.

    **Returns:**
    - the external ID of the customer.

    **Deprecated:**
:::warning
As of release 17.2, replaced by methods on the new class [ExternalProfile](dw.customer.ExternalProfile.md)
which can be obtained from [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles)

Until the method is fully removed from the API it will get the External ID from
the first element of the [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles) collection

:::

---

### getLogin()
- getLogin(): [String](TopLevel.String.md)
  - : Returns the login of the user. It must be unique.

    **Returns:**
    - the login of the user.


---

### getPasswordAnswer()
- getPasswordAnswer(): [String](TopLevel.String.md)
  - : Returns the answer to the password question for the customer. The answer is used
      with the password question to confirm the identity of a customer when
      they are trying to fetch their password.


    **Returns:**
    - the answer to the password question for the customer.


---

### getPasswordQuestion()
- getPasswordQuestion(): [String](TopLevel.String.md)
  - : Returns the password question for the customer. The password question is
      used with the password answer to confirm the identity of a customer when
      they are trying to fetch their password.


    **Returns:**
    - the password question for the customer.


---

### getRemainingLoginAttempts()
- getRemainingLoginAttempts(): [Number](TopLevel.Number.md)
  - : Returns the number of consecutive failed logins after which this customer
      will be temporarily locked out and prevented from logging in to the
      current site. This value is based on the number of previous invalid
      logins for this customer and customer site preferences defining the
      limits.
      
      If this customer is already locked out, this method will always return 0.
      If customer locking is disabled altogether, or if the system cannot
      determine the number of failed login attempts for this customer, then
      this method will return a negative number.


    **Returns:**
    - The number of consecutive failed logins after which this customer
              will be locked out.



---

### isEnabled()
- isEnabled(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this customer is enabled and can log in.

    **Returns:**
    - true if the customer is enabled and can log in, false otherwise.


---

### isLocked()
- isLocked(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if this customer is temporarily locked out because of invalid
      login attempts.  If customer locking is not enabled, this method always
      returns false.


    **Returns:**
    - true if the customer is locked, false otherwise.


---

### isPasswordSet()
- isPasswordSet(): [Boolean](TopLevel.Boolean.md)
  - : Returns whether the password is set. Creating externally authenticated customers
      results in customers with credentials for which the password is not set.


    **Returns:**
    - true if the password is set.


---

### setAuthenticationProviderID(String)
- ~~setAuthenticationProviderID(authenticationProviderID: [String](TopLevel.String.md)): void~~
  - : Sets the authentication provider ID corresponding to an OAuth provider configured in the system.

    **Parameters:**
    - authenticationProviderID - the authentication Provider ID to set.

    **Deprecated:**
:::warning
As of release 17.2, replaced by methods on the new class [ExternalProfile](dw.customer.ExternalProfile.md)
which can be obtained from [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles)

Until the method is fully removed from the API it will set the Authentication Provider on
the first element of the [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles) collection if there is only one.
It will create the collection and add an element if no elements are present.
It will not change anything and will log an error if there are more than one elements in the collection.

:::

---

### setEnabledFlag(Boolean)
- setEnabledFlag(enabledFlag: [Boolean](TopLevel.Boolean.md)): void
  - : Sets the enabled status of the customer.

    **Parameters:**
    - enabledFlag - controls if a customer is enabled or not.


---

### setExternalID(String)
- ~~setExternalID(externalID: [String](TopLevel.String.md)): void~~
  - : Sets the external ID of the customer at the authentication provider.
      The value is provided by the authentication provider during the
      OAuth authentication and is unique within that provider.


    **Parameters:**
    - externalID - the external ID to set.

    **Deprecated:**
:::warning
As of release 17.2, replaced by methods on the new class [ExternalProfile](dw.customer.ExternalProfile.md)
which can be obtained from [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles)

Until the method is fully removed from the API it will set the ExternalID on
the first element of the [Customer.getExternalProfiles()](dw.customer.Customer.md#getexternalprofiles) collection if there is only one.
It will create the collection and add an element if no elements are present.
It will not change anything and will log an error if there are more than one elements in the collection.

:::

---

### setLogin(String)
- ~~setLogin(login: [String](TopLevel.String.md)): void~~
  - : Sets the login value for the customer.
      
      IMPORTANT: This method should no longer be used for the following
      reasons:
      
      
      - It changes the login without re-encrypting the password. (The  customer password is stored internally using a one-way encryption scheme  which uses the login as one of its inputs. Therefore changing the login  requires re-encrypting the password.)
      - It does not validate the structure of the login to ensure that it  only uses acceptable characters.
      - It does not correctly prevent duplicate logins. If the passed login  matches a different customer's login exactly, then this method will throw  an exception. However, it does not prevent the creation of inexact matches,  where two customers have a login differing only by alphabetic case (e.g.  "JaneDoe" and "janedoe")


    **Parameters:**
    - login - The login value for the customer.

    **Deprecated:**
:::warning
Use [setLogin(String, String)](dw.customer.Credentials.md#setloginstring-string)
:::

---

### setLogin(String, String)
- setLogin(newLogin: [String](TopLevel.String.md), currentPassword: [String](TopLevel.String.md)): [Boolean](TopLevel.Boolean.md)
  - : Sets the login value for the customer, and also re-encrypt the customer
      password based on the new login. Customer login must be a sequence of
      letters, numbers, and the following characters: space, period, ampersand,
      underscore and dash.
      
      This method fails to set the login and returns false in the following
      cases:
      
      
      - newLogin is of an invalid form (e.g. contains invalid characters).
      - currentPassword is not the customer's correct password.
      - newLogin is already in use by another customer (i.e. there is another  customer in the system with the exact same login name or a name differing  only by alphabetic case.)
      
      
      If newLogin is the same as the existing login, the method does nothing and
      returns true, regardless of whether currentPassword is the correct
      password.


    **Parameters:**
    - newLogin - The login value for the customer.
    - currentPassword - The customer's current password in plain-text.

    **Returns:**
    - true if setting the login succeeded, false otherwise.


---

### setPassword(String, String, Boolean)
- setPassword(newPassword: [String](TopLevel.String.md), oldPassword: [String](TopLevel.String.md), verifyOldPassword: [Boolean](TopLevel.Boolean.md)): [Status](dw.system.Status.md)
  - : Sets the password of an authenticated customer.
      
      
      The method can be called for externally authenticated customers as well but
      these customers will still be externally authenticated so calling the method
      for such customers does not have an immediate practical benefit. If such customers
      are converted back to regularly authenticated (via login and password) the new password
      will be used.
      
      
      
      Method call will fail under any of these conditions:
      
      - customer is not registered
      - customer is not authenticated
      - verifyOldPassword=true &&oldPassword is empty
      - verifyOldPassword=true and oldPassword does not match the existing password
      - newPassword is empty
      - newPassword does not meet acceptance criteria


    **Parameters:**
    - newPassword - the new password
    - oldPassword - the old password (optional, only needed if 'verifyOldPassword' is set to 'true'
    - verifyOldPassword - whether the oldPassword should be verified

    **Returns:**
    - Status the status of the operation (OK or ERROR). If status is Error, there will be additional information in the Status message


---

### setPasswordAnswer(String)
- setPasswordAnswer(answer: [String](TopLevel.String.md)): void
  - : Sets the answer to the password question for the customer.

    **Parameters:**
    - answer - the answer to the password question.


---

### setPasswordQuestion(String)
- setPasswordQuestion(question: [String](TopLevel.String.md)): void
  - : Sets the password question for the customer.

    **Parameters:**
    - question - the password question.


---

### setPasswordWithToken(String, String)
- setPasswordWithToken(token: [String](TopLevel.String.md), newPassword: [String](TopLevel.String.md)): [Status](dw.system.Status.md)
  - : Set the password of the specified customer to the specified value. This operation will fail if the specified
      token is invalid (i.e. not associated with the specified Customer), the token is expired, or the password does
      not satisfy system password requirements.


    **Parameters:**
    - token - The token required for performing the password reset.
    - newPassword - The new password. Must meet all requirements for passwords

    **Returns:**
    - Status the status of the operation (OK or ERROR). If status is Error, there will be additional
              information in the Status message



---

<!-- prettier-ignore-end -->
