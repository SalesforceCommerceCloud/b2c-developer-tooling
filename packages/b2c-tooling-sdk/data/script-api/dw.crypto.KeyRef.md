<!-- prettier-ignore-start -->
# Class KeyRef

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.crypto.KeyRef](dw.crypto.KeyRef.md)

This class is used as a reference to a private key in the keystore
which can be managed in the Business Manager.


**Note:** this class handles sensitive security-related data.
Pay special attention to PCI DSS v3. requirements 2, 4, and 12.



## Constructor Summary

| Constructor | Description |
| --- | --- |
| [KeyRef](#keyrefstring)([String](TopLevel.String.md)) | Creates a `KeyRef` from the passed alias. |
| ~~[KeyRef](#keyrefstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md))~~ | Creates a `KeyRef` from the passed alias. |

## Method Summary

| Method | Description |
| --- | --- |
| [toString](dw.crypto.KeyRef.md#tostring)() | Returns the string representation of this KeyRef. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constructor Details

### KeyRef(String)
- KeyRef(alias: [String](TopLevel.String.md))
  - : Creates a `KeyRef` from the passed alias. No check
      is made whether the alias is actually referring to a key in the keystore,
      this check is made when the `KeyRef` is used.


    **Parameters:**
    - alias - an alias that should refer to a key in the keystore.


---

### KeyRef(String, String)
- ~~KeyRef(alias: [String](TopLevel.String.md), password: [String](TopLevel.String.md))~~
  - : Creates a `KeyRef` from the passed alias. No check
      is made whether the alias is actually referring to a key in the keystore,
      this check is made when the `KeyRef` is used.


    **Parameters:**
    - alias - an alias that should refer to a key in the keystore.
    - password - the password that should be used to get the key from the keystore.

    **Deprecated:**
:::warning
use [KeyRef(String)](dw.crypto.KeyRef.md#keyrefstring) instead
:::

---

## Method Details

### toString()
- toString(): [String](TopLevel.String.md)
  - : Returns the string representation of this KeyRef.

    **Returns:**
    - The string representation of this KeyRef.


---

<!-- prettier-ignore-end -->
