<!-- prettier-ignore-start -->
# Class SFTPFileInfo

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.SFTPFileInfo](dw.net.SFTPFileInfo.md)

The class is used to store information about a remote file.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## Property Summary

| Property | Description |
| --- | --- |
| [directory](#directory): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the file is a directory. |
| [modificationTime](#modificationtime): [Date](TopLevel.Date.md) `(read-only)` | Returns the last modification time of the file/directory. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the file/directory. |
| [size](#size): [Number](TopLevel.Number.md) `(read-only)` | Returns the size of the file/directory. |

## Constructor Summary

| Constructor | Description |
| --- | --- |
| [SFTPFileInfo](#sftpfileinfostring-number-boolean-number)([String](TopLevel.String.md), [Number](TopLevel.Number.md), [Boolean](TopLevel.Boolean.md), [Number](TopLevel.Number.md)) | Constructs the SFTPFileInfo instance. |

## Method Summary

| Method | Description |
| --- | --- |
| [getDirectory](dw.net.SFTPFileInfo.md#getdirectory)() | Identifies if the file is a directory. |
| [getModificationTime](dw.net.SFTPFileInfo.md#getmodificationtime)() | Returns the last modification time of the file/directory. |
| [getName](dw.net.SFTPFileInfo.md#getname)() | Returns the name of the file/directory. |
| [getSize](dw.net.SFTPFileInfo.md#getsize)() | Returns the size of the file/directory. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### directory
- directory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the file is a directory.


---

### modificationTime
- modificationTime: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the last modification time of the file/directory.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the file/directory.


---

### size
- size: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the size of the file/directory.


---

## Constructor Details

### SFTPFileInfo(String, Number, Boolean, Number)
- SFTPFileInfo(name: [String](TopLevel.String.md), size: [Number](TopLevel.Number.md), directory: [Boolean](TopLevel.Boolean.md), mtime: [Number](TopLevel.Number.md))
  - : Constructs the SFTPFileInfo instance.

    **Parameters:**
    - name - the name of the file.
    - size - the size of the file.
    - directory - controls if the file is a directory.
    - mtime - last modification time.


---

## Method Details

### getDirectory()
- getDirectory(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the file is a directory.

    **Returns:**
    - true if the file is a directory, false otherwise.


---

### getModificationTime()
- getModificationTime(): [Date](TopLevel.Date.md)
  - : Returns the last modification time of the file/directory.

    **Returns:**
    - the last modification time.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the file/directory.

    **Returns:**
    - the name.


---

### getSize()
- getSize(): [Number](TopLevel.Number.md)
  - : Returns the size of the file/directory.

    **Returns:**
    - the size.


---

<!-- prettier-ignore-end -->
