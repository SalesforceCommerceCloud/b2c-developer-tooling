<!-- prettier-ignore-start -->
# Class FTPFileInfo

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.FTPFileInfo](dw.net.FTPFileInfo.md)

The class is used to store information about a remote file.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.


**Deprecated:**
:::warning
The FTPClient is deprecated. Use [SFTPClient](dw.net.SFTPClient.md) for a secure alternative.
:::

## Property Summary

| Property | Description |
| --- | --- |
| [directory](#directory): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the file is a directory. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the file. |
| [size](#size): [Number](TopLevel.Number.md) `(read-only)` | Returns the size of the file. |
| [timestamp](#timestamp): [Date](TopLevel.Date.md) `(read-only)` | Returns the timestamp of the file. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [FTPFileInfo](#ftpfileinfostring-number-boolean-date)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md), [Date](TopLevel.Date.md)) | Constructs the FTPFileInfo instance. |

## Method Summary

| Method | Description |
| --- | --- |
| [getDirectory](dw.net.FTPFileInfo.md#getdirectory)() | Identifies if the file is a directory. |
| [getName](dw.net.FTPFileInfo.md#getname)() | Returns the name of the file. |
| [getSize](dw.net.FTPFileInfo.md#getsize)() | Returns the size of the file. |
| [getTimestamp](dw.net.FTPFileInfo.md#gettimestamp)() | Returns the timestamp of the file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### directory
- directory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the file is a directory.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the file.


---

### size
- size: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the size of the file.


---

### timestamp
- timestamp: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the timestamp of the file.


---

## Constructor Details

### FTPFileInfo(String, Number, Boolean, Date)
- FTPFileInfo(name: [String](TopLevel.String.md), size: [Number](TopLevel.Number.md), directory: [Boolean](TopLevel.Boolean.md), timestamp: [Date](TopLevel.Date.md))
  - : Constructs the FTPFileInfo instance.

    **Parameters:**
    - name - the name of the file.
    - size - the size of the file.
    - directory - controls if the file is a directory.
    - timestamp - the timestamp of the file.


---

## Method Details

### getDirectory()
- getDirectory(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the file is a directory.

    **Returns:**
    - true if the file is a directory, false otherwise.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the file.

    **Returns:**
    - the name of the file.


---

### getSize()
- getSize(): [Number](TopLevel.Number.md)
  - : Returns the size of the file.

    **Returns:**
    - the size of the file.


---

### getTimestamp()
- getTimestamp(): [Date](TopLevel.Date.md)
  - : Returns the timestamp of the file.

    **Returns:**
    - the timestamp of the file.


---

<!-- prettier-ignore-end -->
