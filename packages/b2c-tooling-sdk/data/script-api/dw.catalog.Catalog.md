<!-- prettier-ignore-start -->
# Class Catalog

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.object.PersistentObject](dw.object.PersistentObject.md)
    - [dw.object.ExtensibleObject](dw.object.ExtensibleObject.md)
      - [dw.catalog.Catalog](dw.catalog.Catalog.md)

Represents a Commerce Cloud Digital Catalog. Catalogs are containers of products
and other product-related information and can be shared between sites. Every
product in the system is contained in (or "owned by") exactly one catalog.
Every site has a single "site catalog" which defines the products that are
available to purchase on that site. The static method
[CatalogMgr.getSiteCatalog()](dw.catalog.CatalogMgr.md#getsitecatalog) returns the site catalog for
the current site.


Catalogs are organized into a tree of categories with a single top-level root
category. Products are assigned to categories within catalogs. They can be
assigned to categories in their owning catalog, or other catalogs. They can
be assigned to multiple categories within the same catalog. Products that are
not assigned to any categories are considered "uncategorized." A product has
a single "classification category" in some catalog, and one
"primary category" per catalog. The classification category defines the
attribute set of the product. The primary category is used as standard
presentation context within that catalog in the storefront.


While Commerce Cloud Digital does not currently distinguish different
catalog types, it is common practice to have two general types of catalog:


- "Product catalogs" typically contain detailed product information and are  frequently generated from some backend PIM system.
- "Site Catalogs" define the category structure of the storefront and  contain primarily the assignments of these categories to the products defined  in the product catalogs. The site catalog is assigned to the site.



In addition to products and categories, catalogs contain recommendations,
shared variation attributes which can be used by multiple master products,
and shared product options which can be used by multiple option products.



## Property Summary

| Property | Description |
| --- | --- |
| [ID](#id): [String](TopLevel.String.md) `(read-only)` | Returns the value of attribute 'id'. |
| [description](#description): [String](TopLevel.String.md) `(read-only)` | Returns the value of the localized extensible object attribute  "shortDescription" for the current locale. |
| [displayName](#displayname): [String](TopLevel.String.md) `(read-only)` | Returns the value of the localized extensible object attribute  "displayName" for the current locale. |
| [root](#root): [Category](dw.catalog.Category.md) `(read-only)` | Returns the object for the relation 'root'. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getDescription](dw.catalog.Catalog.md#getdescription)() | Returns the value of the localized extensible object attribute  "shortDescription" for the current locale. |
| [getDisplayName](dw.catalog.Catalog.md#getdisplayname)() | Returns the value of the localized extensible object attribute  "displayName" for the current locale. |
| [getID](dw.catalog.Catalog.md#getid)() | Returns the value of attribute 'id'. |
| [getRoot](dw.catalog.Catalog.md#getroot)() | Returns the object for the relation 'root'. |

### Methods inherited from class ExtensibleObject

[describe](dw.object.ExtensibleObject.md#describe), [getCustom](dw.object.ExtensibleObject.md#getcustom)
### Methods inherited from class PersistentObject

[getCreationDate](dw.object.PersistentObject.md#getcreationdate), [getLastModified](dw.object.PersistentObject.md#getlastmodified), [getUUID](dw.object.PersistentObject.md#getuuid)
### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### ID
- ID: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of attribute 'id'.


---

### description
- description: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of the localized extensible object attribute
      "shortDescription" for the current locale.



---

### displayName
- displayName: [String](TopLevel.String.md) `(read-only)`
  - : Returns the value of the localized extensible object attribute
      "displayName" for the current locale.



---

### root
- root: [Category](dw.catalog.Category.md) `(read-only)`
  - : Returns the object for the relation 'root'.


---

## Method Details

### getDescription()
- getDescription(): [String](TopLevel.String.md)
  - : Returns the value of the localized extensible object attribute
      "shortDescription" for the current locale.


    **Returns:**
    - The value of the attribute for the current locale,
                   or null if it wasn't found.



---

### getDisplayName()
- getDisplayName(): [String](TopLevel.String.md)
  - : Returns the value of the localized extensible object attribute
      "displayName" for the current locale.


    **Returns:**
    - The value of the attribute for the current locale,
                   or null if it wasn't found.



---

### getID()
- getID(): [String](TopLevel.String.md)
  - : Returns the value of attribute 'id'.

    **Returns:**
    - the value of the attribute 'id'


---

### getRoot()
- getRoot(): [Category](dw.catalog.Category.md)
  - : Returns the object for the relation 'root'.

    **Returns:**
    - the object for the relation 'root'.


---

<!-- prettier-ignore-end -->
