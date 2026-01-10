<!-- prettier-ignore-start -->
# Class Port

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.ws.Port](dw.ws.Port.md)

This class represents a port to a Service Endpoint Interface. This
class provides access to operations the service provides. Use the
WSUtil class to perform operations on the port such as setting
timeout values and configuring security.


Developers should set a low timeout to ensure responsiveness
of the site and avoid thread exhaustion (see [WSUtil.setRequestTimeout(Number, Object)](dw.ws.WSUtil.md#setrequesttimeoutnumber-object)).
The default request timeout is 15 minutes when the web reference is used in a job,
and 2 minutes otherwise. If the timeout of the calling script is lower,
the script timeout is used.


**See Also:**
- [WSUtil](dw.ws.WSUtil.md)


## Constant Summary

| Constant | Description |
| --- | --- |
| [ENCODING](#encoding): [String](TopLevel.String.md) | Property constant for controlling the content type encoding of an outgoing message. |
| [ENDPOINT_ADDRESS_PROPERTY](#endpoint_address_property): [String](TopLevel.String.md) | The target service endpoint address. |
| [PASSWORD_PROPERTY](#password_property): [String](TopLevel.String.md) | Password for authentication. |
| [SESSION_MAINTAIN_PROPERTY](#session_maintain_property): [String](TopLevel.String.md) | This boolean property is used by a service client to indicate whether or not it wants to  participate in a session with a service endpoint. |
| [USERNAME_PROPERTY](#username_property): [String](TopLevel.String.md) | User name for authentication. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [Port](#port)() |  |

## Method Summary

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### ENCODING

- ENCODING: [String](TopLevel.String.md)
  - : Property constant for controlling the content type encoding of an outgoing message.

    **See Also:**
    - [WSUtil.setProperty(String, Object, Object)](dw.ws.WSUtil.md#setpropertystring-object-object)


---

### ENDPOINT_ADDRESS_PROPERTY

- ENDPOINT_ADDRESS_PROPERTY: [String](TopLevel.String.md)
  - : The target service endpoint address. When using this property, the URI
      scheme for the endpoint address specification must correspond to the
      protocol/transport binding for the binding in use.


    **See Also:**
    - [WSUtil.setProperty(String, Object, Object)](dw.ws.WSUtil.md#setpropertystring-object-object)


---

### PASSWORD_PROPERTY

- PASSWORD_PROPERTY: [String](TopLevel.String.md)
  - : Password for authentication. This property is used with the USERNAME\_PROPERTY.
      You can also use the  [WSUtil.setUserNamePassword(String, String, Object)](dw.ws.WSUtil.md#setusernamepasswordstring-string-object) method instead of using these
      properties.


    **See Also:**
    - [WSUtil.setUserNamePassword(String, String, Object)](dw.ws.WSUtil.md#setusernamepasswordstring-string-object)
    - [WSUtil.setProperty(String, Object, Object)](dw.ws.WSUtil.md#setpropertystring-object-object)


---

### SESSION_MAINTAIN_PROPERTY

- SESSION_MAINTAIN_PROPERTY: [String](TopLevel.String.md)
  - : This boolean property is used by a service client to indicate whether or not it wants to
      participate in a session with a service endpoint. If this property is set to true, the service client indicates
      that it wants the session to be maintained. If set to false, the session is not maintained. The default value
      for this property is false.


    **See Also:**
    - [WSUtil.setProperty(String, Object, Object)](dw.ws.WSUtil.md#setpropertystring-object-object)


---

### USERNAME_PROPERTY

- USERNAME_PROPERTY: [String](TopLevel.String.md)
  - : User name for authentication. This property is used with the PASSWORD\_PROPERTY.
      You can also use the [WSUtil.setUserNamePassword(String, String, Object)](dw.ws.WSUtil.md#setusernamepasswordstring-string-object) method instead of using these
      properties.


    **See Also:**
    - [WSUtil.setUserNamePassword(String, String, Object)](dw.ws.WSUtil.md#setusernamepasswordstring-string-object)
    - [WSUtil.setProperty(String, Object, Object)](dw.ws.WSUtil.md#setpropertystring-object-object)


---

## Constructor Details

### Port()
- Port()
  - : 


---

<!-- prettier-ignore-end -->
