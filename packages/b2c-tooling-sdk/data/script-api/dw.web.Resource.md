<!-- prettier-ignore-start -->
# Class Resource

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.Resource](dw.web.Resource.md)

Library class which provides methods for retrieving messages from properties
resource bundles which contain locale-specific strings. When your program
needs a locale-specific String, it loads it from the resource bundle that is
appropriate for the user's current locale. In this way, the program code is
largely independent of the user's locale.


In Commerce Cloud Digital, resources are associated with the templates of a cartridge.
These bundles consist of properties files with a common name defined in the
template/resources directory of a site cartridge. For example:


- templates/resources/message.properties
- templates/resources/message\_en.properties
- templates/resources/message\_en\_US.properties
- templates/resources/message\_de\_DE.properties


Resource bundle lookup generally follows the same rules as the Java
ResourceBundle class, where the locale used for lookup is based on the
current request. See method javadoc for additional details.


Properties resource files are assumed to use the UTF-8 character
encoding. Unicode escape sequences are also supported.



## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [msg](dw.web.Resource.md#msgstring)([String](TopLevel.String.md)) | Returns the message from the default properties resource bundle (base  name "message") corresponding to the specified key and the request  locale. |
| static [msg](dw.web.Resource.md#msgstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the message from the default properties resource bundle (base  name "message") corresponding to the specified key and the request  locale. |
| static [msg](dw.web.Resource.md#msgstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the message from the specified properties resource bundle. |
| static [msgf](dw.web.Resource.md#msgfstring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object...](TopLevel.Object.md)) | Returns the message from the specified properties resource bundle, with  the provided arguments substituted for the message argument placeholders  (specified using the Java MessageFormat approach). |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Method Details

### msg(String)
- static msg(key: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the message from the default properties resource bundle (base
      name "message") corresponding to the specified key and the request
      locale.
      
      This method is equivalent to msg(String, null).


    **Parameters:**
    - key - resource bundle message key

    **Returns:**
    - the resource bundle message or the key itself if no message is
              defined.


    **See Also:**
    - [msg(String, String)](dw.web.Resource.md#msgstring-string)


---

### msg(String, String)
- static msg(key: [String](TopLevel.String.md), defaultMessage: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the message from the default properties resource bundle (base
      name "message") corresponding to the specified key and the request
      locale. If no message for the key is found, returns the default message
      if it is not null, otherwise returns the key itself.
      
      This method is equivalent to msg(key, null, defaultMessage).


    **Parameters:**
    - key - resource bundle message key
    - defaultMessage - default message to return if no message             corresponding to the key is found

    **Returns:**
    - the resource bundle message or default message

    **See Also:**
    - [msg(String, String, String)](dw.web.Resource.md#msgstring-string-string)


---

### msg(String, String, String)
- static msg(key: [String](TopLevel.String.md), bundleName: [String](TopLevel.String.md), defaultMessage: [String](TopLevel.String.md)): [String](TopLevel.String.md)
  - : Returns the message from the specified properties resource bundle. The
      resource bundle is located by iterating the site cartridges and looking
      for a bundle with the specified name in the cartridge template/resources
      directory. If it finds a bundle, it tries to return a message from the
      bundle using standard Java ResourceBundle logic. If a message is found in
      that cartridge's bundle, it is returned, otherwise, the next cartridge is
      examined.
      
      The method throws an exception if the key is null.


    **Parameters:**
    - key - resource bundle message key
    - bundleName - base bundle name, if null, default bundle name,             "message", is used
    - defaultMessage - default message to return if no message             corresponding to the key is found and defaultMessage is not             null

    **Returns:**
    - the resource bundle message or default message


---

### msgf(String, String, String, Object...)
- static msgf(key: [String](TopLevel.String.md), bundleName: [String](TopLevel.String.md), defaultMessage: [String](TopLevel.String.md), args: [Object...](TopLevel.Object.md)): [String](TopLevel.String.md)
  - : Returns the message from the specified properties resource bundle, with
      the provided arguments substituted for the message argument placeholders
      (specified using the Java MessageFormat approach).
      
      If null is passed for the varargs argument, this method is equivalent to
      msg(key, bundleName, defaultMessage).


    **Parameters:**
    - key - resource bundle message key
    - bundleName - base bundle name, if null, default bundle name,             "message", is used
    - defaultMessage - default message to return if no message             corresponding to the key is found and defaultMessage is not             null
    - args - optional list of arguments or a collection, which are             included into the result string

    **Returns:**
    - the resource bundle message or default message

    **See Also:**
    - [msg(String, String, String)](dw.web.Resource.md#msgstring-string-string)


---

<!-- prettier-ignore-end -->
