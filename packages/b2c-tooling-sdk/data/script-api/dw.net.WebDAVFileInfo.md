<!-- prettier-ignore-start -->
# Class WebDAVFileInfo

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.net.WebDAVFileInfo](dw.net.WebDAVFileInfo.md)

Simple class representing a file on a remote WebDAV location.  The class
possesses only read-only attributes of the file and does not permit any
manipulation of the file itself.  Instances of this class are returned
by [WebDAVClient.propfind(String)](dw.net.WebDAVClient.md#propfindstring) which is used to get a
listing of files in a WebDAV directory.


**Note:** when this class is used with sensitive data, be careful in persisting sensitive information to disk.



## Property Summary

| Property | Description |
| --- | --- |
| [contentType](#contenttype): [String](TopLevel.String.md) `(read-only)` | Returns the content type of the file. |
| [creationDate](#creationdate): [Date](TopLevel.Date.md) `(read-only)` | Returns the creationDate of the file. |
| [directory](#directory): [Boolean](TopLevel.Boolean.md) `(read-only)` | Identifies if the file is a directory. |
| [name](#name): [String](TopLevel.String.md) `(read-only)` | Returns the name of the file. |
| [path](#path): [String](TopLevel.String.md) `(read-only)` | Returns the path of the file. |
| [size](#size): [Number](TopLevel.Number.md) `(read-only)` | Returns the size of the file. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getContentType](dw.net.WebDAVFileInfo.md#getcontenttype)() | Returns the content type of the file. |
| [getCreationDate](dw.net.WebDAVFileInfo.md#getcreationdate)() | Returns the creationDate of the file. |
| [getName](dw.net.WebDAVFileInfo.md#getname)() | Returns the name of the file. |
| [getPath](dw.net.WebDAVFileInfo.md#getpath)() | Returns the path of the file. |
| [getSize](dw.net.WebDAVFileInfo.md#getsize)() | Returns the size of the file. |
| [isDirectory](dw.net.WebDAVFileInfo.md#isdirectory)() | Identifies if the file is a directory. |
| [lastModified](dw.net.WebDAVFileInfo.md#lastmodified)() | Returns the lastModified date of the file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### contentType
- contentType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the content type of the file.


---

### creationDate
- creationDate: [Date](TopLevel.Date.md) `(read-only)`
  - : Returns the creationDate of the file.


---

### directory
- directory: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Identifies if the file is a directory.


---

### name
- name: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the file.


---

### path
- path: [String](TopLevel.String.md) `(read-only)`
  - : Returns the path of the file.


---

### size
- size: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the size of the file.


---

## Method Details

### getContentType()
- getContentType(): [String](TopLevel.String.md)
  - : Returns the content type of the file.

    **Returns:**
    - the content type of the file.


---

### getCreationDate()
- getCreationDate(): [Date](TopLevel.Date.md)
  - : Returns the creationDate of the file.

    **Returns:**
    - the creationDate of the file.


---

### getName()
- getName(): [String](TopLevel.String.md)
  - : Returns the name of the file.

    **Returns:**
    - the name of the file.


---

### getPath()
- getPath(): [String](TopLevel.String.md)
  - : Returns the path of the file.

    **Returns:**
    - the path of the file.


---

### getSize()
- getSize(): [Number](TopLevel.Number.md)
  - : Returns the size of the file.

    **Returns:**
    - the size of the file.


---

### isDirectory()
- isDirectory(): [Boolean](TopLevel.Boolean.md)
  - : Identifies if the file is a directory.

    **Returns:**
    - true if the file is a directory, false otherwise.


---

### lastModified()
- lastModified(): [Date](TopLevel.Date.md)
  - : Returns the lastModified date of the file.

    **Returns:**
    - the lastModified date of the file.


---

<!-- prettier-ignore-end -->
