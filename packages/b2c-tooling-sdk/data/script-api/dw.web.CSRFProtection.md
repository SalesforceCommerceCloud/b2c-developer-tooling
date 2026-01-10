<!-- prettier-ignore-start -->
# Class CSRFProtection

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.CSRFProtection](dw.web.CSRFProtection.md)

Used to generate and validate CSRF tokens. CSRFProtection allows
applications to protect themselves against CSRF attacks, using
synchronizer tokens, a best practice. Once created, these tokens
are tied to a user’s session and valid for 60 minutes.


Usage:

Adding CSRF token to forms:


```
//CSRF token generation
<form ... action="<protected location>">
  <input name="foo" value="bar">
  <input name="${dw.web.CSRFProtection.getTokenName()}"
            value="${dw.web.CSRFProtection.generateToken()">
</form>
```


Then, in scripts call:


```
dw.web.CSRFProtection.validateRequest();
```



## Property Summary

| Property | Description |
| --- | --- |
| [tokenName](#tokenname): [String](TopLevel.String.md) `(read-only)` | Returns the system generated CSRF token name. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [generateToken](dw.web.CSRFProtection.md#generatetoken)() | Constructs a new unique CSRF token for this session. |
| static [getTokenName](dw.web.CSRFProtection.md#gettokenname)() | Returns the system generated CSRF token name. |
| static [validateRequest](dw.web.CSRFProtection.md#validaterequest)() | Verifies that a client request contains a valid CSRF token, and that  the token has not expired. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### tokenName
- tokenName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the system generated CSRF token name. Currently, this name is not user configurable. Must be used for
      [validateRequest()](dw.web.CSRFProtection.md#validaterequest) to work



---

## Method Details

### generateToken()
- static generateToken(): [String](TopLevel.String.md)
  - : Constructs a new unique CSRF token for this session.

    **Returns:**
    - a new CSRF token


---

### getTokenName()
- static getTokenName(): [String](TopLevel.String.md)
  - : Returns the system generated CSRF token name. Currently, this name is not user configurable. Must be used for
      [validateRequest()](dw.web.CSRFProtection.md#validaterequest) to work


    **Returns:**
    - System-generated CSRF token parameter name


---

### validateRequest()
- static validateRequest(): [Boolean](TopLevel.Boolean.md)
  - : Verifies that a client request contains a valid CSRF token, and that
      the token has not expired. Returns true if these conditions are met,
      and false otherwise


    **Returns:**
    - true if request contains a valid CSRF token, false otherwise


---

<!-- prettier-ignore-end -->
