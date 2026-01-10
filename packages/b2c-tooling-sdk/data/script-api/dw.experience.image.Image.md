<!-- prettier-ignore-start -->
# Class Image

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.experience.image.Image](dw.experience.image.Image.md)

This class represents an image with additional configuration capabilities (e.g. optional focal point).
Furthermore it provides access to meta data of the referenced image file.


**See Also:**
- [FocalPoint](dw.experience.image.FocalPoint.md)
- [ImageMetaData](dw.experience.image.ImageMetaData.md)


## Property Summary

| Property | Description |
| --- | --- |
| [file](#file): [MediaFile](dw.content.MediaFile.md) `(read-only)` | Returns the image media file from the current site's library. |
| [focalPoint](#focalpoint): [FocalPoint](dw.experience.image.FocalPoint.md) `(read-only)` | Returns the focal point of the image. |
| [metaData](#metadata): [ImageMetaData](dw.experience.image.ImageMetaData.md) `(read-only)` | Returns the meta data of the physical image file. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getFile](dw.experience.image.Image.md#getfile)() | Returns the image media file from the current site's library. |
| [getFocalPoint](dw.experience.image.Image.md#getfocalpoint)() | Returns the focal point of the image. |
| [getMetaData](dw.experience.image.Image.md#getmetadata)() | Returns the meta data of the physical image file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### file
- file: [MediaFile](dw.content.MediaFile.md) `(read-only)`
  - : Returns the image media file from the current site's library.


---

### focalPoint
- focalPoint: [FocalPoint](dw.experience.image.FocalPoint.md) `(read-only)`
  - : Returns the focal point of the image.


---

### metaData
- metaData: [ImageMetaData](dw.experience.image.ImageMetaData.md) `(read-only)`
  - : Returns the meta data of the physical image file. This meta data is obtained when
      the respective component attribute was saved from Page Designer, i.e. the underlying
      image is not queried for the meta data every time [getMetaData()](dw.experience.image.Image.md#getmetadata) is called
      but only on store of the related component attribute.



---

## Method Details

### getFile()
- getFile(): [MediaFile](dw.content.MediaFile.md)
  - : Returns the image media file from the current site's library.

    **Returns:**
    - the image media file, or null if not found


---

### getFocalPoint()
- getFocalPoint(): [FocalPoint](dw.experience.image.FocalPoint.md)
  - : Returns the focal point of the image.

    **Returns:**
    - the focal point, or null if not found


---

### getMetaData()
- getMetaData(): [ImageMetaData](dw.experience.image.ImageMetaData.md)
  - : Returns the meta data of the physical image file. This meta data is obtained when
      the respective component attribute was saved from Page Designer, i.e. the underlying
      image is not queried for the meta data every time [getMetaData()](dw.experience.image.Image.md#getmetadata) is called
      but only on store of the related component attribute.


    **Returns:**
    - the meta data of the image, or null if no meta data was provided with the respective component attribute


---

<!-- prettier-ignore-end -->
