<!-- prettier-ignore-start -->
# Class SitemapFile

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.sitemap.SitemapFile](dw.sitemap.SitemapFile.md)

Instances of this class represent sitemap files located in the appservers shared file system. Methods are used to get
details of a sitemap file, such as the hostname it is associated with.



## Property Summary

| Property | Description |
| --- | --- |
| [fileName](#filename): [String](TopLevel.String.md) `(read-only)` | Returns the name of the file e.g. |
| [fileSize](#filesize): [Number](TopLevel.Number.md) `(read-only)` | Returns the size of the file in bytes. |
| [fileURL](#fileurl): [String](TopLevel.String.md) `(read-only)` | Returns the URL used to access this file in a storefront request. |
| [hostName](#hostname): [String](TopLevel.String.md) `(read-only)` | Returns the host name this file is associated with. |
| [valid](#valid): [Boolean](TopLevel.Boolean.md) `(read-only)` | Checks if this instance of sitemap file is valid. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getFileName](dw.sitemap.SitemapFile.md#getfilename)() | Returns the name of the file e.g. |
| [getFileSize](dw.sitemap.SitemapFile.md#getfilesize)() | Returns the size of the file in bytes. |
| [getFileURL](dw.sitemap.SitemapFile.md#getfileurl)() | Returns the URL used to access this file in a storefront request. |
| [getHostName](dw.sitemap.SitemapFile.md#gethostname)() | Returns the host name this file is associated with. |
| [isValid](dw.sitemap.SitemapFile.md#isvalid)() | Checks if this instance of sitemap file is valid. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### fileName
- fileName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the name of the file e.g. sitemap\_index.xml


---

### fileSize
- fileSize: [Number](TopLevel.Number.md) `(read-only)`
  - : Returns the size of the file in bytes.


---

### fileURL
- fileURL: [String](TopLevel.String.md) `(read-only)`
  - : Returns the URL used to access this file in a storefront request.


---

### hostName
- hostName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the host name this file is associated with.


---

### valid
- valid: [Boolean](TopLevel.Boolean.md) `(read-only)`
  - : Checks if this instance of sitemap file is valid. Examples for invalid files are:
      
      - file size >10mb
      
      Additional violations might be added later.



---

## Method Details

### getFileName()
- getFileName(): [String](TopLevel.String.md)
  - : Returns the name of the file e.g. sitemap\_index.xml

    **Returns:**
    - The file's name, never `null`.


---

### getFileSize()
- getFileSize(): [Number](TopLevel.Number.md)
  - : Returns the size of the file in bytes.

    **Returns:**
    - The fileSize in bytes.


---

### getFileURL()
- getFileURL(): [String](TopLevel.String.md)
  - : Returns the URL used to access this file in a storefront request.

    **Returns:**
    - The fileURL, never `null`.


---

### getHostName()
- getHostName(): [String](TopLevel.String.md)
  - : Returns the host name this file is associated with.

    **Returns:**
    - The hostname, never `null`.


---

### isValid()
- isValid(): [Boolean](TopLevel.Boolean.md)
  - : Checks if this instance of sitemap file is valid. Examples for invalid files are:
      
      - file size >10mb
      
      Additional violations might be added later.


    **Returns:**
    - `true` if the {@code SitemapFile} is valid, `false` otherwise.


---

<!-- prettier-ignore-end -->
