<!-- prettier-ignore-start -->
# Class Stub

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.rpc.Stub](dw.rpc.Stub.md)

This is the base class for all service stubs accessible
through a WebReference object. The Stub provides access to the WSDL operations.


Demandware recommends a low timeout to ensure responsiveness
of the site and to avoid thread exhaustion. Use the Services module
in Business Manager to set timeout values, not the methods for this class.
The Services module provides better analytics and timeout management.


The default timeout, if not set, is 15 minutes when the web service is used in a job,
and 2 minutes otherwise. If the timeout of the calling script is lower,
the script timeout is used.


```
 // get WebReference
    var webref : WebReference = webreferences.myWSDLname;
 // get service stub
    var stub : Stub = webref.defaultService;
```


**See Also:**
- [WebReference](dw.rpc.WebReference.md)
- [SOAPUtil](dw.rpc.SOAPUtil.md)

**Deprecated:**
:::warning
This class is deprecated, please use webreferences2 instead (see also [Port](dw.ws.Port.md)).
:::

## Constant Summary

| Constant | Description |
| --- | --- |
| ~~[CONNECTION_TIMEOUT](#connection_timeout): [String](TopLevel.String.md)~~ | This property allows the user to set the web service connection timeout value in milliseconds. |
| ~~[ENDPOINT_ADDRESS_PROPERTY](#endpoint_address_property): [String](TopLevel.String.md)~~ | Standard property: target service endpoint address. |
| ~~[PASSWORD_PROPERTY](#password_property): [String](TopLevel.String.md)~~ | Standard property: password for authentication. |
| ~~[SESSION_MAINTAIN_PROPERTY](#session_maintain_property): [String](TopLevel.String.md)~~ | Standard property: this boolean property is used by a service  client to indicate whether or not it wants to participate in  a session with a service endpoint. |
| ~~[USERNAME_PROPERTY](#username_property): [String](TopLevel.String.md)~~ | Standard property: user name for authentication. |

## Property Summary

| Property | Description |
| --- | --- |
| ~~[password](#password): [String](TopLevel.String.md)~~ | Returns the password. |
| ~~[timeout](#timeout): [Number](TopLevel.Number.md)~~ | Returns the current read timeout value in milliseconds for this Stub. |
| ~~[username](#username): [String](TopLevel.String.md)~~ | Returns the user name. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Stub](#stub)() |  |

## Method Summary

| Method | Description |
| --- | --- |
| ~~[_getProperty](dw.rpc.Stub.md#_getpropertystring)([String](TopLevel.String.md))~~ | Gets the value of a specific configuration property. |
| ~~[_setProperty](dw.rpc.Stub.md#_setpropertystring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md))~~ | Sets the name and value of a configuration property  for this Stub instance. |
| ~~[getPassword](dw.rpc.Stub.md#getpassword)()~~ | Returns the password. |
| ~~[getTimeout](dw.rpc.Stub.md#gettimeout)()~~ | Returns the current read timeout value in milliseconds for this Stub. |
| ~~[getUsername](dw.rpc.Stub.md#getusername)()~~ | Returns the user name. |
| ~~[setHeader](dw.rpc.Stub.md#setheaderstring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md))~~ | Sets an additional SOAP header value for the next  operation. |
| ~~[setPassword](dw.rpc.Stub.md#setpasswordstring)([String](TopLevel.String.md))~~ | Sets the password. |
| ~~[setTimeout](dw.rpc.Stub.md#settimeoutnumber)([Number](TopLevel.Number.md))~~ | Sets the timeout in milliseconds for the next call through this Stub. |
| ~~[setUsername](dw.rpc.Stub.md#setusernamestring)([String](TopLevel.String.md))~~ | Sets the user name. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CONNECTION_TIMEOUT

- ~~CONNECTION_TIMEOUT: [String](TopLevel.String.md)~~
  - : This property allows the user to set the web service connection timeout value in milliseconds. By default,
      the web service connection timeout is 5000 milliseconds (5 seconds). The minimum allowed value is 100 milliseconds
      and the maximum allowed value is 15000 milliseconds (15 seconds). Demandware recommends setting timeout values
      in Business Manager Services module as it provides better analytics and timeout management.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### ENDPOINT_ADDRESS_PROPERTY

- ~~ENDPOINT_ADDRESS_PROPERTY: [String](TopLevel.String.md)~~
  - : Standard property: target service endpoint address. The
      URI scheme for the endpoint address specification must
      correspond to the protocol/transport binding for this
      stub class.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### PASSWORD_PROPERTY

- ~~PASSWORD_PROPERTY: [String](TopLevel.String.md)~~
  - : Standard property: password for authentication.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### SESSION_MAINTAIN_PROPERTY

- ~~SESSION_MAINTAIN_PROPERTY: [String](TopLevel.String.md)~~
  - : Standard property: this boolean property is used by a service
      client to indicate whether or not it wants to participate in
      a session with a service endpoint. If this property is set to
      true, the service client indicates that it wants the session
      to be maintained. If set to false, the session is not maintained.
      The default value for this property is false.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### USERNAME_PROPERTY

- ~~USERNAME_PROPERTY: [String](TopLevel.String.md)~~
  - : Standard property: user name for authentication.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

## Property Details

### password
- ~~password: [String](TopLevel.String.md)~~
  - : Returns the password.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### timeout
- ~~timeout: [Number](TopLevel.Number.md)~~
  - : Returns the current read timeout value in milliseconds for this Stub.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### username
- ~~username: [String](TopLevel.String.md)~~
  - : Returns the user name.
      
      
      **Note:** this method handles sensitive security-related data.
      Pay special attention to PCI DSS v3. requirements 2, 4, and 12.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

## Constructor Details

### Stub()
- Stub()
  - : 


---

## Method Details

### _getProperty(String)
- ~~_getProperty(name: [String](TopLevel.String.md)): [Object](TopLevel.Object.md)~~
  - : Gets the value of a specific configuration property.

    **Parameters:**
    - name - Name of the property whose value is to be           retrieved

    **Returns:**
    - Value of the configuration property

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### _setProperty(String, Object)
- ~~_setProperty(name: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): void~~
  - : Sets the name and value of a configuration property
      for this Stub instance. If the Stub instance contains
      a value for the same property, the old value is replaced.
      
      **Note:** the `_setProperty` method may not
      perform a validity check on a configured property value. An
      example is the standard property for the target service
      endpoint address, which is not checked for validity in the
      `_setProperty` method.
      In this case, stub configuration errors are detected at
      the remote method invocation.


    **Parameters:**
    - name - Name of the configuration property
    - value - Value of the property

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### getPassword()
- ~~getPassword(): [String](TopLevel.String.md)~~
  - : Returns the password.

    **Returns:**
    - the password.
      
      
      **Note:** this method handles sensitive security-related data.
      Pay special attention to PCI DSS v3. requirements 2, 4, and 12.


    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### getTimeout()
- ~~getTimeout(): [Number](TopLevel.Number.md)~~
  - : Returns the current read timeout value in milliseconds for this Stub.

    **Returns:**
    - the current timeout value for this Stub.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### getUsername()
- ~~getUsername(): [String](TopLevel.String.md)~~
  - : Returns the user name.
      
      
      **Note:** this method handles sensitive security-related data.
      Pay special attention to PCI DSS v3. requirements 2, 4, and 12.


    **Returns:**
    - the user name.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setHeader(String, String, Object)
- ~~setHeader(namespace: [String](TopLevel.String.md), name: [String](TopLevel.String.md), value: [Object](TopLevel.Object.md)): void~~
  - : Sets an additional SOAP header value for the next
      operation.


    **Parameters:**
    - namespace - the namespace to use.
    - name - the name of the header item.
    - value - the value for the header item.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setPassword(String)
- ~~setPassword(password: [String](TopLevel.String.md)): void~~
  - : Sets the password.

    **Parameters:**
    - password - the password to set.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setTimeout(Number)
- ~~setTimeout(timeout: [Number](TopLevel.Number.md)): void~~
  - : Sets the timeout in milliseconds for the next call through this Stub.
      
      
      This timeout value controls "read timeout" (how
      long, after connecting, it will wait without any data being read).
      To control "connection timeout" you use the [_setProperty(String, Object)](dw.rpc.Stub.md#_setpropertystring-object)
      method where the name parameter is [CONNECTION_TIMEOUT](dw.rpc.Stub.md#connection_timeout).


    **Parameters:**
    - timeout - the timeout for the next call through  this stub.

    **See Also:**
    - [_setProperty(String, Object)](dw.rpc.Stub.md#_setpropertystring-object)
    - [CONNECTION_TIMEOUT](dw.rpc.Stub.md#connection_timeout)

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

### setUsername(String)
- ~~setUsername(username: [String](TopLevel.String.md)): void~~
  - : Sets the user name.

    **Parameters:**
    - username - the user name to set.

    **Deprecated:**
:::warning
use webreferences2 instead
:::

---

<!-- prettier-ignore-end -->
