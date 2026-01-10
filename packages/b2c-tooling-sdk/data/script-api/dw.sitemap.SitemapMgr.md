<!-- prettier-ignore-start -->
# Class SitemapMgr

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.sitemap.SitemapMgr](dw.sitemap.SitemapMgr.md)

[SitemapMgr](dw.sitemap.SitemapMgr.md) is used to access and modify custom sitemap files.


To access custom sitemap files, use methods [getCustomSitemapFiles()](dw.sitemap.SitemapMgr.md#getcustomsitemapfiles).


To delete custom sitemap files, use methods [deleteCustomSitemapFile(SitemapFile)](dw.sitemap.SitemapMgr.md#deletecustomsitemapfilesitemapfile),
[deleteCustomSitemapFiles(String)](dw.sitemap.SitemapMgr.md#deletecustomsitemapfilesstring) and [deleteCustomSitemapFiles()](dw.sitemap.SitemapMgr.md#deletecustomsitemapfiles).


To add custom sitemap files, use methods [addCustomSitemapFile(String, File)](dw.sitemap.SitemapMgr.md#addcustomsitemapfilestring-file). The file will be copied from
WebDAV ([File](dw.io.File.md) represent a file in WebDAV) to the appservers shared file system.


Please note that all provided methods are operating in appservers shared file system. These modifications are visible
via "Custom Sitemaps" tab under _Merchant Tools_ => _SEO_ => _Sitemaps - Custom Sitemaps_ in
Business Manager. To publish all changes, execute job under Merchant Tools => SEO => Sitemaps => Job.



## Property Summary

| Property | Description |
| --- | --- |
| [customSitemapFiles](#customsitemapfiles): [Map](dw.util.Map.md) `(read-only)` | Reads all existing custom sitemap files from files system of the appservers custom sitemap directory into memory  and returns them in a Map containing mappings like  <ul>  <li>Hostname 1 => \[SitemapFile hostname1\_sitemapfile1, SitemapFile hostname1\_sitemapfile2\]</li>  <li>Hostname 2 => \[SitemapFile hostname2\_sitemapfile1\]</li>  </ul> |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| static [addCustomSitemapFile](dw.sitemap.SitemapMgr.md#addcustomsitemapfilestring-file)([String](TopLevel.String.md), [File](dw.io.File.md)) | Adds the given [File](dw.io.File.md) to the appservers custom sitemap directory. |
| static [deleteCustomSitemapFile](dw.sitemap.SitemapMgr.md#deletecustomsitemapfilesitemapfile)([SitemapFile](dw.sitemap.SitemapFile.md)) | Deletes the given custom sitemap file from the appservers shared file system. |
| static [deleteCustomSitemapFiles](dw.sitemap.SitemapMgr.md#deletecustomsitemapfiles)() | Deletes all custom sitemap files for all hostnames from the appservers shared file system. |
| static [deleteCustomSitemapFiles](dw.sitemap.SitemapMgr.md#deletecustomsitemapfilesstring)([String](TopLevel.String.md)) | Deletes all custom sitemap files for the given hostname from the appservers shared file system. |
| static [getCustomSitemapFiles](dw.sitemap.SitemapMgr.md#getcustomsitemapfiles)() | Reads all existing custom sitemap files from files system of the appservers custom sitemap directory into memory  and returns them in a Map containing mappings like  <ul>  <li>Hostname 1 => \[SitemapFile hostname1\_sitemapfile1, SitemapFile hostname1\_sitemapfile2\]</li>  <li>Hostname 2 => \[SitemapFile hostname2\_sitemapfile1\]</li>  </ul> |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### customSitemapFiles
- customSitemapFiles: [Map](dw.util.Map.md) `(read-only)`
  - : Reads all existing custom sitemap files from files system of the appservers custom sitemap directory into memory
      and returns them in a Map containing mappings like
      
      - Hostname 1 =>\[SitemapFile hostname1\_sitemapfile1, SitemapFile hostname1\_sitemapfile2\]
      - Hostname 2 =>\[SitemapFile hostname2\_sitemapfile1\]



---

## Method Details

### addCustomSitemapFile(String, File)
- static addCustomSitemapFile(hostName: [String](TopLevel.String.md), file: [File](dw.io.File.md)): void
  - : Adds the given [File](dw.io.File.md) to the appservers custom sitemap directory. All content of the appservers
      custom sitemap directory is considered by the system job "Create Sitemap Schedule".
      
      
      The files are added to the directory which is accessible via "Custom Sitemaps" tab under _Merchant Tools_ =>
      _SEO_ => _Sitemaps - Custom Sitemaps_ in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.


    **Parameters:**
    - hostName - The hostName to copy the `File` to. The hostName must be configured in sites alias             file.
    - file - The `File` to copy.

    **Throws:**
    - Exception - 


---

### deleteCustomSitemapFile(SitemapFile)
- static deleteCustomSitemapFile(sitemapFile: [SitemapFile](dw.sitemap.SitemapFile.md)): void
  - : Deletes the given custom sitemap file from the appservers shared file system.
      
      
      The file is deleted from the directory which is accessible via "Custom Sitemaps" tab under _Merchant Tools_
      => _SEO_ => _Sitemaps - Custom Sitemaps_ in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.


    **Parameters:**
    - sitemapFile - - The sitemapFile to delete.


---

### deleteCustomSitemapFiles()
- static deleteCustomSitemapFiles(): void
  - : Deletes all custom sitemap files for all hostnames from the appservers shared file system.
      
      
      The files are deleted from the directory which is accessible via "Custom Sitemaps" tab under _Merchant
       Tools_ => _SEO_ => _Sitemaps - Custom Sitemaps_ in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.



---

### deleteCustomSitemapFiles(String)
- static deleteCustomSitemapFiles(hostName: [String](TopLevel.String.md)): void
  - : Deletes all custom sitemap files for the given hostname from the appservers shared file system.
      
      
      The files are deleted from the directory which is accessible via "Custom Sitemaps" tab under _Merchant
       Tools_ => _SEO_ => _Sitemaps - Custom Sitemaps_ in Business Manager. To publish that change, execute job under Merchant Tools => SEO => Sitemaps => Job.


    **Parameters:**
    - hostName - The hostName to delete the custom sitemap files for.


---

### getCustomSitemapFiles()
- static getCustomSitemapFiles(): [Map](dw.util.Map.md)
  - : Reads all existing custom sitemap files from files system of the appservers custom sitemap directory into memory
      and returns them in a Map containing mappings like
      
      - Hostname 1 =>\[SitemapFile hostname1\_sitemapfile1, SitemapFile hostname1\_sitemapfile2\]
      - Hostname 2 =>\[SitemapFile hostname2\_sitemapfile1\]


    **Returns:**
    - The created map containing the list of SitemapFiles.


---

<!-- prettier-ignore-end -->
