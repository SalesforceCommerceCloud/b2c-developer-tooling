<!-- prettier-ignore-start -->
# Class MediaFile

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.content.MediaFile](dw.content.MediaFile.md)

This class represents references to media content (such as images)
located within Commerce Cloud Digital or on external systems.


Parameter `transform`:


Some methods allow the specification of image transformation parameters. Image
transformation is only performed if the Dynamic Imaging Service (DIS) is available
for the Commerce Cloud Digital instance, otherwise a standard static content URL
is returned. The to-be-transformed image needs to be hosted on Commerce Cloud
Digital.


Image transformation parameters are specified as JavaScript object literal. They
are translated into URL parameters. See [Create Image Transformation URLs.](https://help.salesforce.com/s/articleView?id=cc.b2c\_creating\_image\_transformation\_urls.htm)


| Type of transformation | Parameters | Description |
| --- |--- |--- |
| Scale an image |           `scaleWidth`<br/>          `scaleHeight`<br/>          `scaleMode`       |           The `scaleWidth` and `scaleHeight` parameters          are both integers; setting one of these parameters triggers a          scaling operation. If both are provided, the one that scales the          image less is used to calculate the scale factor. The image is then          automatically cropped accord to the second dimension, with a          centered position of the cropped area. If the parameter would scale          the image larger, only this operation is applied, if the image          remains within acceptable pixel dimensions.<p/>           Note: `scaleMode` can only be used in combination with `scaleHeight` and `scaleWidth`.<p/>           The `scaleMode` parameter can be set to `cut`          or `fit`. The default `scaleMode` is          `cut`, the behavior of which is explained above. If you          specify `fit` as the `scaleMode`, the system          scales the image into the given box of dimensions while keeping the          aspect ratio (possibly resulting in a smaller image in one          dimension).       |
| Overlay an image |           `imageX`<br/>          `imageY`<br/>          `imageURI`       |           The `imageX` and `imageY` parameters are both          integers. Valid values for these parameters are 0 or greater.<p/>           Supported formats are `png`, `jpg`, `jp2`, and          `gif`.<p/>           The `imageURI` parameter can be set to the absolute path          of the overlaid image. The value of the `imageURI`          parameter must be given in proper URL encoding, and it cannot exceed          400 characters in length. The path may include query string          parameters, which supports dynamically generating the overlaid image          itself through this service; that is, the overlaid image can itself          be a transformed image.<p/>           If the overlaid image extends over the primary image's boundaries,          the overlaid image is cropped so that it fits directly over the          primary image.       |
| Crop an image |           `cropX`<br/>          `cropY`<br/>          `cropWidth`<br/>          `cropHeight`       |           The `cropX`, `cropY`, `cropWidth`,          `cropHeight` parameters are integers. All four parameters          must be specified to trigger a cropping operation.<p/>           Valid values for the `cropX` and `cropY`          parameters are 0 or greater. If the crop location defined by          `cropX` and `cropY` is outside the image area,          nothing is cropped.<p/>           Valid values for the `cropWidth` and          `cropHeight` parameters are 10 or greater. If the          `cropWidth` and `cropHeight` parameters          specify a size that is greater than the original image, the crop          area is reduced to the actual image area. If `cropWidth`          and `cropHeight` are 0 or less, no transformation is          applied.       |
| Format an image | `format` |           The `format` parameter specifies the target format of          image. Supported formats are `png`, `jpg`, `jp2`, and          `gif`. If no target format is specified, no format          conversion is performed.<p/>           The attribute value must reference the source image. Source image's          format is recognized by the file extension which must be          `tif`, `tiff`, `jpg`,          `jpeg`, `png`, or `gif`.<p/>           In the generated URL the file extension of the target format is used          in the URL path. This is to make sure the image is loaded from an          URL with a matching file extension. The source format is provided as          URL parameter.       |
| Adjust image compression quality | `quality` |           The `quality` parameter specifies a quality setting for `jpg` and `jp2` images,          and specifies the compression level for `png` images.<p/>           For `jpg` and `jp2` images, you can set values from 1–100 for the highest quality.          The default quality is 80. If you're not changing the default quality, you don't need to pass in a value.<p/>           For `png` images, the quality setting has no effect on the appearance of the `png`, since the compression is always lossless.          Instead you can use the quality setting to set the zlib compression level and filter-type for PNG images.          The tens digit sets the zlib compression level(1-9). The ones digit sets the filter type.<p/>           If the `png` setting is not present or set to 0, it uses a default value of 75.          If this setting is set to 100, it actually equals the quality setting 90.       |
| Adjust Metadata stripping | `strip` |           The `strip` parameter specifies if metadata like EXIF and color profiles is          stripped from the image during transformation.<p/>           Valid values for the `strip` parameter are between `true` and `false`.          The default is `true`       |
| Change background color | `bgcolor(color) or bgcolor(color+alpha)` |           The `bgcolor` parameter specifies the background color for images that support transparency          as well as JPEG images when being converted from a format that supports transparency.          Optionally, alpha setting for PNG images are also supported.<p/>           `bgcolor` expects a 6 digit hexadecimal value of RGB with an optional          two hexadecimal characters representing alpha value that determines transparency.<p/>           FF0000 = Red<p/>           FF000077 = Red with 50% transparency<p/>           Alpha values are optional. When the alpha value is omitted, the resulting color is opaque.          Alpha values are only valid when the image output format is PNG.       |


Example:

   The following code

   `var url = product.getImage('thumbnail', 0).getImageURL({scaleWidth: 100, format: 'jpg'});`

   will produce an image transformation URL like

   `http://<image server host name>/.../on/demandware.static/.../<path to image>/image.jpg?sw=100&sfrm=png`.



## Property Summary

| Property | Description |
| --- | --- |
| [URL](#url): [URL](dw.web.URL.md) `(read-only)` | Returns an URL to the referenced media file. |
| [absURL](#absurl): [URL](dw.web.URL.md) `(read-only)` | Returns an absolute URL to the referenced media file. |
| [alt](#alt): [String](TopLevel.String.md) `(read-only)` | Returns the alternative text assigned to the media file in current  requests locale. |
| [httpURL](#httpurl): [URL](dw.web.URL.md) `(read-only)` | Returns an absolute URL to the referenced media file. |
| [httpsURL](#httpsurl): [URL](dw.web.URL.md) `(read-only)` | Returns an absolute URL to the referenced media file. |
| [title](#title): [String](TopLevel.String.md) `(read-only)` | Returns the title assigned to the media file in current requests locale. |
| ~~[url](#url): [URL](dw.web.URL.md)~~ `(read-only)` | Returns an URL to the referenced media file. |
| [viewType](#viewtype): [String](TopLevel.String.md) `(read-only)` | Returns the view type annotation for the media file. |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| [getAbsImageURL](dw.content.MediaFile.md#getabsimageurlobject)([Object](TopLevel.Object.md)) | Returns an URL to the referenced image file. |
| [getAbsURL](dw.content.MediaFile.md#getabsurl)() | Returns an absolute URL to the referenced media file. |
| [getAlt](dw.content.MediaFile.md#getalt)() | Returns the alternative text assigned to the media file in current  requests locale. |
| [getHttpImageURL](dw.content.MediaFile.md#gethttpimageurlobject)([Object](TopLevel.Object.md)) | Returns an URL to the referenced image file. |
| [getHttpURL](dw.content.MediaFile.md#gethttpurl)() | Returns an absolute URL to the referenced media file. |
| [getHttpsImageURL](dw.content.MediaFile.md#gethttpsimageurlobject)([Object](TopLevel.Object.md)) | Returns an URL to the referenced image file. |
| [getHttpsURL](dw.content.MediaFile.md#gethttpsurl)() | Returns an absolute URL to the referenced media file. |
| [getImageURL](dw.content.MediaFile.md#getimageurlobject)([Object](TopLevel.Object.md)) | Returns an URL to the referenced image file. |
| [getTitle](dw.content.MediaFile.md#gettitle)() | Returns the title assigned to the media file in current requests locale. |
| [getURL](dw.content.MediaFile.md#geturl)() | Returns an URL to the referenced media file. |
| ~~[getUrl](dw.content.MediaFile.md#geturl)()~~ | Returns an URL to the referenced media file. |
| [getViewType](dw.content.MediaFile.md#getviewtype)() | Returns the view type annotation for the media file. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Property Details

### URL
- URL: [URL](dw.web.URL.md) `(read-only)`
  - : Returns an URL to the referenced media file. The
      returned URL is a relative URL.



---

### absURL
- absURL: [URL](dw.web.URL.md) `(read-only)`
  - : Returns an absolute URL to the referenced media file. The
      protocol for the reference is the current protocol of the current
      HTTP request.



---

### alt
- alt: [String](TopLevel.String.md) `(read-only)`
  - : Returns the alternative text assigned to the media file in current
      requests locale. If no alternative text was assigned or if no defaulting
      rule was defined, the method returns null.



---

### httpURL
- httpURL: [URL](dw.web.URL.md) `(read-only)`
  - : Returns an absolute URL to the referenced media file. The
      protocol is http.



---

### httpsURL
- httpsURL: [URL](dw.web.URL.md) `(read-only)`
  - : Returns an absolute URL to the referenced media file. The
      protocol is https.



---

### title
- title: [String](TopLevel.String.md) `(read-only)`
  - : Returns the title assigned to the media file in current requests locale.
      If no title was assigned or if no defaulting rule was defined, the
      method returns null.



---

### url
- ~~url: [URL](dw.web.URL.md)~~ `(read-only)`
  - : Returns an URL to the referenced media file. The
      returned URL is a relative URL.


    **Deprecated:**
:::warning
Use [getURL()](dw.content.MediaFile.md#geturl) instead.
:::

---

### viewType
- viewType: [String](TopLevel.String.md) `(read-only)`
  - : Returns the view type annotation for the media file. The method returns
      null, if the media file has no view type annotation.



---

## Method Details

### getAbsImageURL(Object)
- getAbsImageURL(transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Returns an URL to the referenced image file. Image transformation
      can be applied to the image. The protocol for the reference is the
      current protocol of the current HTTP request.
      
      Image transformation can only be applied to images that are hosted on
      Commerce Cloud Digital.


    **Parameters:**
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - an absolute URL to the referenced media file. The
      protocol for the reference is the current protocol of the current
      HTTP request. If the referenced media file is hosted externally,
      an URL to the external file is returned.



---

### getAbsURL()
- getAbsURL(): [URL](dw.web.URL.md)
  - : Returns an absolute URL to the referenced media file. The
      protocol for the reference is the current protocol of the current
      HTTP request.


    **Returns:**
    - an absolute URL to the referenced media file. The
      protocol for the reference is the current protocol of the current
      HTTP request.



---

### getAlt()
- getAlt(): [String](TopLevel.String.md)
  - : Returns the alternative text assigned to the media file in current
      requests locale. If no alternative text was assigned or if no defaulting
      rule was defined, the method returns null.


    **Returns:**
    - the alternative text annotated to this media file or null


---

### getHttpImageURL(Object)
- getHttpImageURL(transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Returns an URL to the referenced image file. Image transformation
      can be applied to the image. The protocol is http.
      
      Image transformation can only be applied to images that are hosted on
      Commerce Cloud Digital.


    **Parameters:**
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - an absolute URL to the referenced media file. The
      protocol is http. If the referenced media file is hosted externally,
      an URL to the external file is returned.



---

### getHttpURL()
- getHttpURL(): [URL](dw.web.URL.md)
  - : Returns an absolute URL to the referenced media file. The
      protocol is http.


    **Returns:**
    - an absolute URL to the referenced media file. The
      protocol is http.



---

### getHttpsImageURL(Object)
- getHttpsImageURL(transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Returns an URL to the referenced image file. Image transformation
      can be applied to the image. The protocol is https.
      
      Image transformation can only be applied to images that are hosted on
      Commerce Cloud Digital.


    **Parameters:**
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - an absolute URL to the referenced media file. The
      protocol is https. If the referenced media file is hosted externally,
      an URL to the external file is returned.



---

### getHttpsURL()
- getHttpsURL(): [URL](dw.web.URL.md)
  - : Returns an absolute URL to the referenced media file. The
      protocol is https.


    **Returns:**
    - an absolute URL to the referenced media file. The
      protocol is https.



---

### getImageURL(Object)
- getImageURL(transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Returns an URL to the referenced image file. Image transformation
      can be applied to the image.
      
      Image transformation can only be applied to images that are hosted on
      Commerce Cloud Digital.


    **Parameters:**
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - an URL to the referenced media file. The
      returned URL is a relative URL. If the referenced media file is hosted
      externally, an URL to the external file is returned.



---

### getTitle()
- getTitle(): [String](TopLevel.String.md)
  - : Returns the title assigned to the media file in current requests locale.
      If no title was assigned or if no defaulting rule was defined, the
      method returns null.


    **Returns:**
    - the title annotated to this media file or null


---

### getURL()
- getURL(): [URL](dw.web.URL.md)
  - : Returns an URL to the referenced media file. The
      returned URL is a relative URL.


    **Returns:**
    - an URL to the referenced media file. The
      returned URL is a relative URL.



---

### getUrl()
- ~~getUrl(): [URL](dw.web.URL.md)~~
  - : Returns an URL to the referenced media file. The
      returned URL is a relative URL.


    **Returns:**
    - an URL to the referenced media file. The
      returned URL is a relative URL.


    **Deprecated:**
:::warning
Use [getURL()](dw.content.MediaFile.md#geturl) instead.
:::

---

### getViewType()
- getViewType(): [String](TopLevel.String.md)
  - : Returns the view type annotation for the media file. The method returns
      null, if the media file has no view type annotation.


    **Returns:**
    - the view type annotated to this media file or null


---

<!-- prettier-ignore-end -->
