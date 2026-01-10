<!-- prettier-ignore-start -->
# Class URLUtils

- [TopLevel.Object](TopLevel.Object.md)
  - [dw.web.URLUtils](dw.web.URLUtils.md)

URL utility class. Methods in this class generate URLs used in Commerce Cloud Digital.


Site related information in the generated URLs is determined from the current HTTP request.


Methods belong to two groups: generating absolute and relative URLs. Absolute URL methods
are further subdivided into those creating URLs with specified protocol and those
using protocol information from the request. Corresponding to the protocol, the host name
from the HTTP/HTTPS host preference is used. If preference is not set, the host name from the
current request is included in resulting absolute URL.


URLs do not include a session ID anymore. The appendSID argument therefore does not have any effect.


When creating a pipeline URL with one of the methods url(), http(), https() or abs() by default
the generated URL is a Commerce Cloud Digital URL ("/on/demandware.store/..."). If search friendly URLs are
enabled (old or new) the methods generate search friendly URLs. Search friendly URLs are only generated for
certain pipeline names. Here a list of these pipeline names:

- Product-Show with a 'pid' parameter \[productID\] - search friendly URL for a product
- Product-ShowInCategory with the 'cgid' parameter \[categoryID\] and 'pid' parameter \[productID\] - search friendly URL for a product shown in a specific category
- Search-Show with a 'cgid' parameter \[categoryID\] - search friendly URL for a category
- Search-Show with a 'pid' parameter \[productID\] - search friendly URL for a product
- Search-ShowContent with a 'fdid' parameter \[folderID\] - search friendly URL for a folder (ONLY works with new storefront URLs)
- Page-Show with a 'cid' parameter \[contentID\] - search friendly URL for a content page


Parameter `transform`:


Some methods allow the specification of image transformation parameters. Image
transformation is only performed if the Dynamic Imaging Service (DIS) is available
for the Commerce Cloud Digital instance. Otherwise a standard static content URL is returned.
The to-be-transformed image needs to be hosted on Digital.


Image transformation parameters are specified as JavaScript object literal. They
are translated into URL parameters. See [Create Image Transformation URLs.](https://help.salesforce.com/s/articleView?id=cc.b2c\_creating\_image\_transformation\_urls.htm)


| Type of transformation | Parameters | Description |
| --- |--- |--- |
| Scale an image |           `scaleWidth`<br/>          `scaleHeight`<br/>          `scaleMode`       |           The `scaleWidth` and `scaleHeight` parameters          are both integers; setting one of these parameters triggers a          scaling operation. If both are provided, the one that scales the          image less is used to calculate the scale factor. The image is then          automatically cropped accord to the second dimension, with a          centered position of the cropped area. If the parameter would scale          the image larger, only this operation is applied, if the image          remains within acceptable pixel dimensions.<p/>           Note: `scaleMode` can only be used in combination with `scaleHeight` and `scaleWidth`.<p/>           The `scaleMode` parameter can be set to `cut`          or `fit`. The default `scaleMode` is          `cut`, the behavior of which is explained above. If you          specify `fit` as the `scaleMode`, the system          scales the image into the given box of dimensions while keeping the          aspect ratio (possibly resulting in a smaller image in one          dimension).       |
| Overlay an image |           `imageX`<br/>          `imageY`<br/>          `imageURI`       |           The `imageX` and `imageY` parameters are both          integers. Valid values for these parameters are 0 or greater.<p/>           Supported formats are `png`, `jpg`, `jp2`, and          `gif`.<p/>           The `imageURI` parameter can be set to the absolute path          of the overlaid image. The value of the `imageURI`          parameter must be given in proper URL encoding, and it cannot exceed          400 characters in length. The path may include query string          parameters, which supports dynamically generating the overlaid image          itself through this service; that is, the overlaid image can itself          be a transformed image.<p/>           If the overlaid image extends over the primary image's boundaries,          the overlaid image is cropped so that it fits directly over the          primary image.       |
| Crop an image |           `cropX`<br/>          `cropY`<br/>          `cropWidth`<br/>          `cropHeight`       |           The `cropX`, `cropY`, `cropWidth`,          `cropHeight` parameters are integers. All four parameters          must be specified to trigger a cropping operation.<p/>           Valid values for the `cropX` and `cropY`          parameters are 0 or greater. If the crop location defined by          `cropX` and `cropY` is outside the image area,          nothing is cropped.<p/>           Valid values for the `cropWidth` and          `cropHeight` parameters are 10 or greater. If the          `cropWidth` and `cropHeight` parameters          specify a size that is greater than the original image, the crop          area is reduced to the actual image area. If `cropWidth`          and `cropHeight` are 0 or less, no transformation is          applied.       |
| Format an image | `format` |           The `format` parameter specifies the target format of the          image. Supported formats are `png`, `jpg`, `jp2`, and          `gif`. If no target format is specified, no format          conversion is performed.<p/>           The source image file is references with attribute          `relPath`. Source image's format is recognized by the          file extension which must be `tif`, `tiff`,          `jpg`, `jpeg`, `png`, or          `gif`.<p/>           In the generated URL the file extension of the target format is used          in the URL path. This is to make sure the image is loaded from an          URL with a matching file extension. The source format is provided as          URL parameter.       |
| Adjust image compression quality | `quality` |           The `quality` parameter specifies a quality setting for `jpg` and `jp2` images,          and specifies the compression level for `png` images.<p/>           For `jpg` and `jp2` images, you can set values from 1–100 for the highest quality.          The default quality is 80. If you're not changing the default quality, you don't need to pass in a value.<p/>           For `png` images, the quality setting has no effect on the appearance of the `png`, since the compression is always lossless.          Instead you can use the quality setting to set the zlib compression level and filter-type for PNG images.          The tens digit sets the zlib compression level(1-9). The ones digit sets the filter type.<p/>           If the `png` setting is not present or set to 0, it uses a default value of 75.          If this setting is set to 100, it actually equals the quality setting 90.       |
| Adjust Metadata stripping | `strip` |           The `strip` parameter specifies if metadata like EXIF and color profiles is          stripped from the image during transformation.<p/>           Valid values for the `strip` parameter are between `true` and `false`.          The default is `true`       |
| Change background color | `bgcolor(color) or bgcolor(color+alpha)` |           The `bgcolor` parameter specifies the background color for images that support transparency          as well as JPEG images when being converted from a format that supports transparency.          Optionally, alpha setting for PNG images are also supported.<p/>           `bgcolor` expects a 6 digit hexadecimal value of RGB with an optional          two hexadecimal characters representing alpha value that determines transparency.<p/>           FF0000 = Red<p/>           FF000077 = Red with 50% transparency<p/>           Alpha values are optional. When the alpha value is omitted, the resulting color is opaque.          Alpha values are only valid when the image output format is PNG.       |


Example:

   The following code

   `var url = URLUtils.imageURL('/somepath/image.png', {scaleWidth: 100, format: 'jpg'});`

   will produce an image transformation URL like

   `http://<image server host name>/.../on/demandware.static/.../somepath/image.jpg?sw=100&sfrm=png`.



## Constant Summary

| Constant | Description |
| --- | --- |
| [CONTEXT_CATALOG](#context_catalog): [String](TopLevel.String.md) = "ContextCatalog" | ID for a catalog context. |
| [CONTEXT_LIBRARY](#context_library): [String](TopLevel.String.md) = "ContextLibrary" | ID for a library context. |
| [CONTEXT_SITE](#context_site): [String](TopLevel.String.md) = "ContextSite" | ID for a site context (= assigned cartridges). |

## Constructor Summary

This class does not have a constructor, so you cannot create it directly.
## Method Summary

| Method | Description |
| --- | --- |
| ~~static [abs](dw.web.URLUtils.md#absboolean-urlaction-urlparameter)([Boolean](TopLevel.Boolean.md), [URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md))~~ | Return an absolute URL with protocol and host from current request. |
| ~~static [abs](dw.web.URLUtils.md#absboolean-string-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md), [String...](TopLevel.String.md))~~ | Return an absolute URL with protocol and host from current request. |
| static [abs](dw.web.URLUtils.md#absurlaction-urlparameter)([URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md)) | Return an absolute URL with protocol and host from the current request. |
| static [abs](dw.web.URLUtils.md#absstring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Return an absolute URL with protocol and host from current request. |
| static [absImage](dw.web.URLUtils.md#absimagestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to absStatic( String ) this method returns a static URL for a resource  in the current site. |
| static [absImage](dw.web.URLUtils.md#absimagestring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to absStatic( String, String, String ) this method returns a static URL for a resource  in the current site. |
| static [absStatic](dw.web.URLUtils.md#absstaticstring)([String](TopLevel.String.md)) | The method returns a static URL for a resource in the current site. |
| static [absStatic](dw.web.URLUtils.md#absstaticstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the absolute URL to the static location of the specified context. |
| ~~static [absWebRoot](dw.web.URLUtils.md#abswebroot)()~~ | Return an absolute web root URL with protocol and host same as the current request. |
| static [continueURL](dw.web.URLUtils.md#continueurl)() | Return a URL, which can be used in combination with an Interaction Continue Node, to  continue the user interface flow. |
| static [home](dw.web.URLUtils.md#home)() | Generates a hostname-only url if an alias is set, or an url to the Home-Show    pipeline in the default format using the protocol of the incoming request. |
| ~~static [http](dw.web.URLUtils.md#httpboolean-urlaction-urlparameter)([Boolean](TopLevel.Boolean.md), [URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md))~~ | Return an absolute URL with HTTP protocol. |
| ~~static [http](dw.web.URLUtils.md#httpboolean-string-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md), [String...](TopLevel.String.md))~~ | Return an absolute URL with HTTP protocol. |
| static [http](dw.web.URLUtils.md#httpurlaction-urlparameter)([URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md)) | Return an absolute URL with HTTP protocol. |
| static [http](dw.web.URLUtils.md#httpstring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Return an absolute URL with HTTP protocol. |
| static [httpContinue](dw.web.URLUtils.md#httpcontinue)() | Return a URL, which can be used in combination with an Interaction Continue Node, to  continue the user interface flow. |
| static [httpHome](dw.web.URLUtils.md#httphome)() | Generates a hostname-only url if an alias is set, or an url to the Home-Show    pipeline in the default format using the HTTP protocol. |
| static [httpImage](dw.web.URLUtils.md#httpimagestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpStatic( String ) this method returns a static URL for a resource  in the current site. |
| static [httpImage](dw.web.URLUtils.md#httpimagestring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpStatic( String ) this method returns a static URL for a resource  in the current site. |
| static [httpImage](dw.web.URLUtils.md#httpimagestring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpStatic( String, String, String ) this method returns a static URL for a resource  in the current site. |
| static [httpImage](dw.web.URLUtils.md#httpimagestring-string-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpStatic( String, String, String ) this method returns a static URL for a resource  in the current site. |
| static [httpStatic](dw.web.URLUtils.md#httpstaticstring)([String](TopLevel.String.md)) | The method returns a static URL for a resource in the current site. |
| static [httpStatic](dw.web.URLUtils.md#httpstaticstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | The method returns a static URL for a resource in the current site. |
| static [httpStatic](dw.web.URLUtils.md#httpstaticstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the absolute URL to the static location of the specified context. |
| static [httpStatic](dw.web.URLUtils.md#httpstaticstring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the absolute URL to the static location of the specified context. |
| ~~static [httpWebRoot](dw.web.URLUtils.md#httpwebroot)()~~ | Return an absolute web root URL with HTTP protocol and host information from current  request. |
| ~~static [https](dw.web.URLUtils.md#httpsboolean-urlaction-urlparameter)([Boolean](TopLevel.Boolean.md), [URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md))~~ | Return an absolute URL with HTTPS protocol. |
| ~~static [https](dw.web.URLUtils.md#httpsboolean-string-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md), [String...](TopLevel.String.md))~~ | Return an absolute URL with HTTPS protocol. |
| static [https](dw.web.URLUtils.md#httpsurlaction-urlparameter)([URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md)) | Return an absolute URL with HTTPS protocol. |
| static [https](dw.web.URLUtils.md#httpsstring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Return an absolute URL with HTTPS protocol. |
| static [httpsContinue](dw.web.URLUtils.md#httpscontinue)() | Return a URL, which can be used in combination with an Interaction Continue Node, to  continue the user interface flow. |
| static [httpsHome](dw.web.URLUtils.md#httpshome)() | Generates a hostname-only url if an alias is set, or an url to the Home-Show    pipeline in the default format using the HTTPS protocol. |
| static [httpsImage](dw.web.URLUtils.md#httpsimagestring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpsStatic( String ) this method returns a static URL for a resource  in the current site. |
| static [httpsImage](dw.web.URLUtils.md#httpsimagestring-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpsStatic( String ) this method returns a static URL for a resource  in the current site. |
| static [httpsImage](dw.web.URLUtils.md#httpsimagestring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpsStatic( String, String, String ) this method returns a static URL for a resource  in the current site. |
| static [httpsImage](dw.web.URLUtils.md#httpsimagestring-string-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to httpsStatic( String, String, String ) this method returns a static URL for a resource  in the current site. |
| static [httpsStatic](dw.web.URLUtils.md#httpsstaticstring)([String](TopLevel.String.md)) | The method returns a static URL for a resource in the current site. |
| static [httpsStatic](dw.web.URLUtils.md#httpsstaticstring-string)([String](TopLevel.String.md), [String](TopLevel.String.md)) | The method returns a static URL for a resource in the current site. |
| static [httpsStatic](dw.web.URLUtils.md#httpsstaticstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the absolute URL to the static location of the specified context. |
| static [httpsStatic](dw.web.URLUtils.md#httpsstaticstring-string-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the absolute URL to the static location of the specified context. |
| ~~static [httpsWebRoot](dw.web.URLUtils.md#httpswebroot)()~~ | Return an absolute web root URL with HTTPS protocol and host and domain information from the current  request. |
| static [imageURL](dw.web.URLUtils.md#imageurlstring-object)([String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to staticURL( String ) this method returns a static URL for a resource  in the current site. |
| static [imageURL](dw.web.URLUtils.md#imageurlstring-string-string-object)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md), [Object](TopLevel.Object.md)) | Similar to staticURL( String, String, String ) this method returns a static URL for a resource  in the current site. |
| static [sessionRedirect](dw.web.URLUtils.md#sessionredirectstring-url)([String](TopLevel.String.md), [URL](dw.web.URL.md)) | This method is used to create a URL that redirects to a location in  the current site with another host name. |
| static [sessionRedirectHttpOnly](dw.web.URLUtils.md#sessionredirecthttponlystring-url)([String](TopLevel.String.md), [URL](dw.web.URL.md)) | This method is used to create a URL that redirects to a location in  the current site with another host name. |
| static [staticURL](dw.web.URLUtils.md#staticurlstring)([String](TopLevel.String.md)) | The method returns a static URL for a resource in the current site. |
| static [staticURL](dw.web.URLUtils.md#staticurlstring-string-string)([String](TopLevel.String.md), [String](TopLevel.String.md), [String](TopLevel.String.md)) | Returns the relative URL to the static location of the specified context. |
| ~~static [url](dw.web.URLUtils.md#urlboolean-urlaction-urlparameter)([Boolean](TopLevel.Boolean.md), [URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md))~~ | Return a relative URL. |
| ~~static [url](dw.web.URLUtils.md#urlboolean-string-string)([Boolean](TopLevel.Boolean.md), [String](TopLevel.String.md), [String...](TopLevel.String.md))~~ | Return a relative URL. |
| static [url](dw.web.URLUtils.md#urlurlaction-urlparameter)([URLAction](dw.web.URLAction.md), [URLParameter...](dw.web.URLParameter.md)) | Return a relative URL. |
| static [url](dw.web.URLUtils.md#urlstring-string)([String](TopLevel.String.md), [String...](TopLevel.String.md)) | Return a relative URL. |
| ~~static [webRoot](dw.web.URLUtils.md#webroot)()~~ | Return a relative web root URL. |

### Methods inherited from class Object

[assign](TopLevel.Object.md#assignobject-object), [create](TopLevel.Object.md#createobject), [create](TopLevel.Object.md#createobject-object), [defineProperties](TopLevel.Object.md#definepropertiesobject-object), [defineProperty](TopLevel.Object.md#definepropertyobject-object-object), [entries](TopLevel.Object.md#entriesobject), [freeze](TopLevel.Object.md#freezeobject), [fromEntries](TopLevel.Object.md#fromentriesiterable), [getOwnPropertyDescriptor](TopLevel.Object.md#getownpropertydescriptorobject-object), [getOwnPropertyNames](TopLevel.Object.md#getownpropertynamesobject), [getOwnPropertySymbols](TopLevel.Object.md#getownpropertysymbolsobject), [getPrototypeOf](TopLevel.Object.md#getprototypeofobject), [hasOwnProperty](TopLevel.Object.md#hasownpropertystring), [is](TopLevel.Object.md#isobject-object), [isExtensible](TopLevel.Object.md#isextensibleobject), [isFrozen](TopLevel.Object.md#isfrozenobject), [isPrototypeOf](TopLevel.Object.md#isprototypeofobject), [isSealed](TopLevel.Object.md#issealedobject), [keys](TopLevel.Object.md#keysobject), [preventExtensions](TopLevel.Object.md#preventextensionsobject), [propertyIsEnumerable](TopLevel.Object.md#propertyisenumerablestring), [seal](TopLevel.Object.md#sealobject), [setPrototypeOf](TopLevel.Object.md#setprototypeofobject-object), [toLocaleString](TopLevel.Object.md#tolocalestring), [toString](TopLevel.Object.md#tostring), [valueOf](TopLevel.Object.md#valueof), [values](TopLevel.Object.md#valuesobject)
## Constant Details

### CONTEXT_CATALOG

- CONTEXT_CATALOG: [String](TopLevel.String.md) = "ContextCatalog"
  - : ID for a catalog context. See staticURL() method.


---

### CONTEXT_LIBRARY

- CONTEXT_LIBRARY: [String](TopLevel.String.md) = "ContextLibrary"
  - : ID for a library context. See staticURL() method.


---

### CONTEXT_SITE

- CONTEXT_SITE: [String](TopLevel.String.md) = "ContextSite"
  - : ID for a site context (= assigned cartridges). See staticURL() method.


---

## Method Details

### abs(Boolean, URLAction, URLParameter...)
- ~~static abs(appendSID: [Boolean](TopLevel.Boolean.md), action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)~~
  - : Return an absolute URL with protocol and host from current request.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding abs() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - URL action
    - params - URL parameters

    **Returns:**
    - an absolute URL with protocol and host from current request.

    **Deprecated:**
:::warning
Use [abs(URLAction, URLParameter...)](dw.web.URLUtils.md#absurlaction-urlparameter) instead.
:::

---

### abs(Boolean, String, String...)
- ~~static abs(appendSID: [Boolean](TopLevel.Boolean.md), action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)~~
  - : Return an absolute URL with protocol and host from current request.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding method abs() without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - an absolute URL with protocol and host from current request.

    **Deprecated:**
:::warning
Use [abs(String, String...)](dw.web.URLUtils.md#absstring-string) instead.
:::

---

### abs(URLAction, URLParameter...)
- static abs(action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)
  - : Return an absolute URL with protocol and host from the current request.

    **Parameters:**
    - action - URL action
    - params - URL parameters

    **Returns:**
    - an absolute URL with protocol and host from the current request.


---

### abs(String, String...)
- static abs(action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Return an absolute URL with protocol and host from current request.

    **Parameters:**
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, for example: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - an absolute URL with protocol and host from current request.


---

### absImage(String, Object)
- static absImage(relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to absStatic( String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.


    **Parameters:**
    - relPath - the relative path of the file
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - the URL for the specified image resource


---

### absImage(String, String, String, Object)
- static absImage(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to absStatic( String, String, String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - URL for the specified location


---

### absStatic(String)
- static absStatic(relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : The method returns a static URL for a resource in the current site. Site
      resources are actually located in the cartridges associated with the site.
      This resources are typically logos, button images, CSS files and JavaScript
      files. The method will transform the given relative path to include cache
      related information, which enables better cache control.
      
      The created URL is an absolute URL with same protocol as the current incoming
      request.
      
      Note: This method replaces the original mechanisms of using the webroot()
      method to construct a URL. The new method is better integrated into the
      overall cache management.


    **Parameters:**
    - relPath - the relative path of the file

    **Returns:**
    - the URL for the specified location


---

### absStatic(String, String, String)
- static absStatic(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns the absolute URL to the static location of the specified context. The context
      can be either a specific catalog (URLUtils.CONTEXT\_CATALOG),
      a content library (URLUtils.CONTEXT\_LIBRARY) or a site (URLUtils.CONTEXT\_SITE).
      Respectively either a URL to images in a catalog, a library or a site are created.
      
      
      The contextID parameter is optional and only used for context CONTEXT\_CATALOG, where
      is specifies the ID of a specific catalog. If defined, the static URL for the specified
      catalog is returned. If not defined, the static URL for the current site catalog
      is returned (or null if no site catalog is defined). 
      
      For context CONTEXT\_SITE and context CONTEXT\_LIBRARY, the contextID parameter is
      ignored and the static URL for the current site / site library is returned.
      
      
      Parameter relPath can be defined to specify the relative path within the context-specific
      path.
      
      
      The method returns an absolute URL with the same protocol as the current request.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library

    **Returns:**
    - URL for the specified location


---

### absWebRoot()
- ~~static absWebRoot(): [URL](dw.web.URL.md)~~
  - : Return an absolute web root URL with protocol and host same as the current request.
      
      Note: The use of this method is deprecated. The method absStatic() should
      be used instead. It provides better cache integration.


    **Returns:**
    - an absolute web root URL with protocol, host from current request.

    **Deprecated:**
:::warning
Use [absStatic(String)](dw.web.URLUtils.md#absstaticstring) or [absStatic(String, String, String)](dw.web.URLUtils.md#absstaticstring-string-string) instead.
:::

---

### continueURL()
- static continueURL(): [URL](dw.web.URL.md)
  - : Return a URL, which can be used in combination with an Interaction Continue Node, to
      continue the user interface flow.


    **Returns:**
    - an absolute URL with protocol and host from current context request.


---

### home()
- static home(): [URL](dw.web.URL.md)
  - : Generates a hostname-only url if an alias is set, or an url to the Home-Show
        pipeline in the default format using the protocol of the incoming request.


    **Returns:**
    - a hostname-only url if an alias is set, or an url to the Home-Show
        pipeline in the default format using the protocol of the incoming request.
        Uses the default locale of the site making the request.



---

### http(Boolean, URLAction, URLParameter...)
- ~~static http(appendSID: [Boolean](TopLevel.Boolean.md), action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)~~
  - : Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding http() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - URL action
    - params - URL parameters

    **Returns:**
    - an absolute URL with HTTP protocol.

    **Deprecated:**
:::warning
Use [http(URLAction, URLParameter...)](dw.web.URLUtils.md#httpurlaction-urlparameter) instead.
:::

---

### http(Boolean, String, String...)
- ~~static http(appendSID: [Boolean](TopLevel.Boolean.md), action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)~~
  - : Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding http() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - an absolute URL with HTTP protocol.

    **Deprecated:**
:::warning
Use [http(String, String...)](dw.web.URLUtils.md#httpstring-string) instead.
:::

---

### http(URLAction, URLParameter...)
- static http(action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)
  - : Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.


    **Parameters:**
    - action - URL action
    - params - URL parameters

    **Returns:**
    - an absolute URL with HTTP protocol.


---

### http(String, String...)
- static http(action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.


    **Parameters:**
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - an absolute URL with HTTP protocol.


---

### httpContinue()
- static httpContinue(): [URL](dw.web.URL.md)
  - : Return a URL, which can be used in combination with an Interaction Continue Node, to
      continue the user interface flow. For security reasons the httpContinue() function returns
      a HTTPS continue URL if the interaction flow has started with a HTTPS request. Otherwise a
      HTTP continue URL is returned.
      If an HTTP/HTTPS host is configured in the preferences the returned URL will include that
      host, otherwise, the host from current request is used.


    **Returns:**
    - an absolute URL with HTTP protocol.


---

### httpHome()
- static httpHome(): [URL](dw.web.URL.md)
  - : Generates a hostname-only url if an alias is set, or an url to the Home-Show
        pipeline in the default format using the HTTP protocol.


    **Returns:**
    - a hostname-only url if an alias is set, or an url to the Home-Show
        pipeline in the default format using the HTTP protocol.



---

### httpImage(String, Object)
- static httpImage(relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpStatic( String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.


    **Parameters:**
    - relPath - the relative path of the file
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - the URL for the specified location


---

### httpImage(String, String, Object)
- static httpImage(host: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpStatic( String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - relPath - the relative path of the file
    - transform - Object with transformation parameters

    **Returns:**
    - the URL for the specified location


---

### httpImage(String, String, String, Object)
- static httpImage(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpStatic( String, String, String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - URL for the specified location


---

### httpImage(String, String, String, String, Object)
- static httpImage(host: [String](TopLevel.String.md), context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpStatic( String, String, String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library
    - transform - Object with transformation parameters

    **Returns:**
    - URL for the specified location


---

### httpStatic(String)
- static httpStatic(relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : The method returns a static URL for a resource in the current site. Site
      resources are actually located in the cartridges associated with the site.
      This resources are typically logos, button images, CSS files and JavaScript
      files. The method will transform the given relative path to include cache
      related information, which enables better cache control.
      
      
      The created URL is an absolute URL with HTTP protocol.
      
      
      Note: This method replaces the original mechanisms of using the webroot()
      method to construct a URL. The new method is better integrated into the
      overall cache management.


    **Parameters:**
    - relPath - the relative path of the file

    **Returns:**
    - the URL for the specified location


---

### httpStatic(String, String)
- static httpStatic(host: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : The method returns a static URL for a resource in the current site. Site
      resources are actually located in the cartridges associated with the site.
      This resources are typically logos, button images, CSS files and JavaScript
      files. The method will transform the given relative path to include cache
      related information, which enables better cache control.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.
      
      
      The created URL is an absolute URL with HTTP protocol.
      
      
      Note: This method replaces the original mechanisms of using the webroot()
      method to construct a URL. The new method is better integrated into the
      overall cache management.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - relPath - the relative path of the file

    **Returns:**
    - the URL for the specified location


---

### httpStatic(String, String, String)
- static httpStatic(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns the absolute URL to the static location of the specified context. The context
      can be either a specific catalog (URLUtils.CONTEXT\_CATALOG),
      a content library (URLUtils.CONTEXT\_LIBRARY) or a site (URLUtils.CONTEXT\_SITE).
      Respectively either a URL to images in a catalog, a library or a site are created.
      
      
      The contextID parameter is optional and only used for context CONTEXT\_CATALOG, where
      is specifies the ID of a specific catalog. If defined, the static URL for the specified
      catalog is returned. If not defined, the static URL for the current site catalog
      is returned (or null if no site catalog is defined). 
      
      For context CONTEXT\_SITE and context CONTEXT\_LIBRARY, the contextID parameter is
      ignored and the static URL for the current site / site library is returned.
      
      
      Parameter relPath can be defined to specify the relative path within the context-specific
      path.
      
      
      The method returns an absolute URL with HTTP protocol.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library

    **Returns:**
    - URL for the specified location


---

### httpStatic(String, String, String, String)
- static httpStatic(host: [String](TopLevel.String.md), context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns the absolute URL to the static location of the specified context. The context
      can be either a specific catalog (URLUtils.CONTEXT\_CATALOG),
      a content library (URLUtils.CONTEXT\_LIBRARY) or a site (URLUtils.CONTEXT\_SITE).
      Respectively either a URL to images in a catalog, a library or a site are created.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.
      
      
      The contextID parameter is optional and only used for context CONTEXT\_CATALOG, where
      is specifies the ID of a specific catalog. If defined, the static URL for the specified
      catalog is returned. If not defined, the static URL for the current site catalog
      is returned (or null if no site catalog is defined). 
      
      For context CONTEXT\_SITE and context CONTEXT\_LIBRARY, the contextID parameter is
      ignored and the static URL for the current site / site library is returned.
      
      
      Parameter relPath can be defined to specify the relative path within the context-specific
      path.
      
      
      The method returns an absolute URL with HTTP protocol.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library

    **Returns:**
    - URL for the specified location


---

### httpWebRoot()
- ~~static httpWebRoot(): [URL](dw.web.URL.md)~~
  - : Return an absolute web root URL with HTTP protocol and host information from current
      request. If an HTTP host is configured in the preferences the returned URL will include
      that host.
      
      Note: The use of this method is deprecated. The method httpStatic() should
      be used instead. It provides better cache integration.


    **Returns:**
    - an absolute web root URL with HTTP protocol and host information from the current
      request.


    **Deprecated:**
:::warning
Use the [httpStatic(String)](dw.web.URLUtils.md#httpstaticstring) or [httpStatic(String, String, String)](dw.web.URLUtils.md#httpstaticstring-string-string) methods instead.
:::

---

### https(Boolean, URLAction, URLParameter...)
- ~~static https(appendSID: [Boolean](TopLevel.Boolean.md), action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)~~
  - : Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding https() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - URL action
    - params - URL parameters

    **Returns:**
    - an absolute URL with HTTPS protocol.

    **Deprecated:**
:::warning
Use the [https(URLAction, URLParameter...)](dw.web.URLUtils.md#httpsurlaction-urlparameter) method instead.
:::

---

### https(Boolean, String, String...)
- ~~static https(appendSID: [Boolean](TopLevel.Boolean.md), action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)~~
  - : Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding https() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - an absolute URL with HTTPS protocol.

    **Deprecated:**
:::warning
Use the [https(String, String...)](dw.web.URLUtils.md#httpsstring-string) method instead.
:::

---

### https(URLAction, URLParameter...)
- static https(action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)
  - : Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.


    **Parameters:**
    - action - URL action
    - params - URL parameters

    **Returns:**
    - an absolute URL with HTTPS protocol.


---

### https(String, String...)
- static https(action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
      the returned URL will include that host, otherwise, the host from current request is used.


    **Parameters:**
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - an absolute URL with HTTPS protocol.


---

### httpsContinue()
- static httpsContinue(): [URL](dw.web.URL.md)
  - : Return a URL, which can be used in combination with an Interaction Continue Node, to
      continue the user interface flow. An absolute URL with HTTPS protocol is returned.
      If an HTTPS host is configured in the preferences the returned URL will include that
      host, otherwise, the host from current request is used.


    **Returns:**
    - an absolute URL with HTTPS protocol.


---

### httpsHome()
- static httpsHome(): [URL](dw.web.URL.md)
  - : Generates a hostname-only url if an alias is set, or an url to the Home-Show
        pipeline in the default format using the HTTPS protocol.


    **Returns:**
    - a hostname-only url if an alias is set, or an url to the Home-Show
        pipeline in the default format using the HTTPS protocol..



---

### httpsImage(String, Object)
- static httpsImage(relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpsStatic( String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.


    **Parameters:**
    - relPath - the relative path of the file
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - the URL for the specified location


---

### httpsImage(String, String, Object)
- static httpsImage(host: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpsStatic( String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - relPath - the relative path of the file
    - transform - Object with transformation parameters

    **Returns:**
    - the URL for the specified location


---

### httpsImage(String, String, String, Object)
- static httpsImage(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpsStatic( String, String, String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - URL for the specified location


---

### httpsImage(String, String, String, String, Object)
- static httpsImage(host: [String](TopLevel.String.md), context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to httpsStatic( String, String, String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library
    - transform - Object with transformation parameters

    **Returns:**
    - URL for the specified location


---

### httpsStatic(String)
- static httpsStatic(relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : The method returns a static URL for a resource in the current site. Site
      resources are actually located in the cartridges associated with the site.
      This resources are typically logos, button images, CSS files and JavaScript
      files. The method will transform the given relative path to include cache
      related information, which enables better cache control.
      
      
      The created URL is an absolute URL with HTTPS protocol.
      
      
      Note: This method replaces the original mechanisms of using the webroot()
      method to construct a URL. The new method is better integrated into the
      overall cache management.


    **Parameters:**
    - relPath - the relative path of the file

    **Returns:**
    - the URL for the specified location


---

### httpsStatic(String, String)
- static httpsStatic(host: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : The method returns a static URL for a resource in the current site. Site
      resources are actually located in the cartridges associated with the site.
      This resources are typically logos, button images, CSS files and JavaScript
      files. The method will transform the given relative path to include cache
      related information, which enables better cache control.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.
      
      
      The created URL is an absolute URL with HTTPS protocol.
      
      
      Note: This method replaces the original mechanisms of using the webroot()
      method to construct a URL. The new method is better integrated into the
      overall cache management.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - relPath - the relative path of the file

    **Returns:**
    - the URL for the specified location


---

### httpsStatic(String, String, String)
- static httpsStatic(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns the absolute URL to the static location of the specified context. The context
      can be either a specific catalog (URLUtils.CONTEXT\_CATALOG),
      a content library (URLUtils.CONTEXT\_LIBRARY) or a site (URLUtils.CONTEXT\_SITE).
      Respectively either a URL to images in a catalog, a library or a site are created.
      
      
      The contextID parameter is optional and only used for context CONTEXT\_CATALOG, where
      is specifies the ID of a specific catalog. If defined, the static URL for the specified
      catalog is returned. If not defined, the static URL for the current site catalog
      is returned (or null if no site catalog is defined). 
      
      For context CONTEXT\_SITE and context CONTEXT\_LIBRARY, the contextID parameter is
      ignored and the static URL for the current site / site library is returned.
      
      
      Parameter relPath can be defined to specify the relative path within the context-specific
      path.
      
      
      The method returns an absolute URL with HTTPS protocol.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library

    **Returns:**
    - URL for the specified location


---

### httpsStatic(String, String, String, String)
- static httpsStatic(host: [String](TopLevel.String.md), context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns the absolute URL to the static location of the specified context. The context
      can be either a specific catalog (URLUtils.CONTEXT\_CATALOG),
      a content library (URLUtils.CONTEXT\_LIBRARY) or a site (URLUtils.CONTEXT\_SITE).
      Respectively either a URL to images in a catalog, a library or a site are created.
      
      
      The host parameter is optional. If provided, then this host name will be used
      in precedence to the host name provided by the current request. The specified host
      name must be defined in the alias settings for the site, otherwise an exception will
      be thrown.
      
      
      The contextID parameter is optional and only used for context CONTEXT\_CATALOG, where
      is specifies the ID of a specific catalog. If defined, the static URL for the specified
      catalog is returned. If not defined, the static URL for the current site catalog
      is returned (or null if no site catalog is defined). 
      
      For context CONTEXT\_SITE and context CONTEXT\_LIBRARY, the contextID parameter is
      ignored and the static URL for the current site / site library is returned.
      
      
      Parameter relPath can be defined to specify the relative path within the context-specific
      path.
      
      
      The method returns an absolute URL with HTTPS protocol.


    **Parameters:**
    - host - Optional host name, used to set the host explicitly.
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library

    **Returns:**
    - URL for the specified location


---

### httpsWebRoot()
- ~~static httpsWebRoot(): [URL](dw.web.URL.md)~~
  - : Return an absolute web root URL with HTTPS protocol and host and domain information from the current
      request. If an HTTP host is configured in the preferences the returned URL will include that host.
      
      Note: The use of this method is deprecated. The method httpsStatic() should
      be used instead. It provides better cache integration.


    **Returns:**
    - an absolute web root URL with HTTPS protocol and host information from the current
      request.


    **Deprecated:**
:::warning
Use the [httpsStatic(String)](dw.web.URLUtils.md#httpsstaticstring) or [httpsStatic(String, String, String)](dw.web.URLUtils.md#httpsstaticstring-string-string) method instead.
:::

---

### imageURL(String, Object)
- static imageURL(relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to staticURL( String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.
      
      The URL returned is always an absolute URL.


    **Parameters:**
    - relPath - the relative path of the file
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - the URL for the specified location


---

### imageURL(String, String, String, Object)
- static imageURL(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md), transform: [Object](TopLevel.Object.md)): [URL](dw.web.URL.md)
  - : Similar to staticURL( String, String, String ) this method returns a static URL for a resource
      in the current site. The method assumes, that the URL refers to an image an
      supports an additional parameter with optional image transformation parameters.
      The image transformation parameters must be specified as JavaScript object literal.
      
      The URL returned is always an absolute URL.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id
    - relPath - Relative path within the catalog or library
    - transform - Object with transformation parameters (see class header)

    **Returns:**
    - URL for the specified location


---

### sessionRedirect(String, URL)
- static sessionRedirect(host: [String](TopLevel.String.md), url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : This method is used to create a URL that redirects to a location in
      the current site with another host name. When the URL is submitted,
      the system copies all system cookies, such that user, session and basket
      information are shared across different hosts. 
      
      The specified host name must be defined in the alias settings for the site,
      otherwise an exception will be thrown when submitting the redirect URL.
      
      If the specified host is the same as the current host, the method will return
      a "normal" URL because no redirect is required.


    **Parameters:**
    - host - Target host with or without a site-path
    - url - Target URL on current site (relative or absolute),  pass null to redirect to new host only

    **Returns:**
    - an absolute secure URL to the redirect mechanism


---

### sessionRedirectHttpOnly(String, URL)
- static sessionRedirectHttpOnly(host: [String](TopLevel.String.md), url: [URL](dw.web.URL.md)): [URL](dw.web.URL.md)
  - : This method is used to create a URL that redirects to a location in
      the current site with another host name. When the URL is submitted,
      the system copies all system cookies, such that user, session and basket
      information are shared across different hosts. 
      
      The specified host name must be defined in the alias settings for the site,
      otherwise an exception will be thrown when submitting the redirect URL.
      
      If the specified host is the same as the current host, the method will return
      a "normal" URL because no redirect is required.
      
      
      **Note:** since this method generates a non-secure (HTTP) link, no
      HTTPS Cookies are copied, which might lead to sessions being incorrectly being
      detected as hijacked. It is strongly recommended to use [sessionRedirect(String, URL)](dw.web.URLUtils.md#sessionredirectstring-url)
      where possible.


    **Parameters:**
    - host - Target host with or without a site-path
    - url - Target URL on current site (relative or absolute),  pass null to redirect to new host only

    **Returns:**
    - an absolute URL to the redirect mechanism


---

### staticURL(String)
- static staticURL(relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : The method returns a static URL for a resource in the current site. Site
      resources are actually located in the cartridges associated with the site.
      This resources are typically logos, button images, CSS files and JavaScript
      files. The method will transform the given relative path to include cache
      related information, which enables better cache control.
      
      The created URL is a relative URL.
      
      Note: This method replaces the original mechanisms of using the webroot()
      method to construct a URL. The new method is better integrated into the
      overall cache management.


    **Parameters:**
    - relPath - the relative path of the file

    **Returns:**
    - the URL for the specified location


---

### staticURL(String, String, String)
- static staticURL(context: [String](TopLevel.String.md), contextID: [String](TopLevel.String.md), relPath: [String](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Returns the relative URL to the static location of the specified context. The context
      can be either a specific catalog (URLUtils.CONTEXT\_CATALOG),
      a content library (URLUtils.CONTEXT\_LIBRARY) or a site (URLUtils.CONTEXT\_SITE).
      Respectively either a URL to images in a catalog, a library or a site are created.
      
      
      The contextID parameter is optional and can be used with context either CONTEXT\_CATALOG or CONTEXT\_LIBRARY, where
      it specifies the ID of a specific catalog or a shared library respectively. If defined, the static URL for the specified
      catalog/shared library is returned. If not defined, the static URL for the current site catalog/site library
      is returned (or null if no site catalog/site library is defined). 
      
      For context CONTEXT\_SITE, the contextID parameter is ignored and the static URL for the current site is returned.
      
      
      Parameter relPath can be defined to specify the relative path within the context-specific
      path.
      
      
      The method returns an relative URL with the same protocol as the current request.


    **Parameters:**
    - context - Either CONTEXT\_CATALOG, CONTEXT\_LIBRARY or CONTEXT\_SITE
    - contextID - Optional context id, currently only used to specify a catalog id or a shared library id
    - relPath - Relative path within the catalog or library or site

    **Returns:**
    - URL for the specified location


---

### url(Boolean, URLAction, URLParameter...)
- ~~static url(appendSID: [Boolean](TopLevel.Boolean.md), action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)~~
  - : Return a relative URL.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding url() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - URL action
    - params - URL parameters

    **Returns:**
    - a relative URL.

    **Deprecated:**
:::warning
Use [url(URLAction, URLParameter...)](dw.web.URLUtils.md#urlurlaction-urlparameter) instead.
:::

---

### url(Boolean, String, String...)
- ~~static url(appendSID: [Boolean](TopLevel.Boolean.md), action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)~~
  - : Return a relative URL.
      
      Note: The use of this method is deprecated, because session URL rewriting
            is no longer supported. Use the corresponding url() method without the
            appendSID parameter instead.


    **Parameters:**
    - appendSID - when true the resulting URL will include session ID.
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs, e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - a relative URL.

    **Deprecated:**
:::warning
Use [url(String, String...)](dw.web.URLUtils.md#urlstring-string) instead.
:::

---

### url(URLAction, URLParameter...)
- static url(action: [URLAction](dw.web.URLAction.md), params: [URLParameter...](dw.web.URLParameter.md)): [URL](dw.web.URL.md)
  - : Return a relative URL.

    **Parameters:**
    - action - URL action
    - params - URL parameters

    **Returns:**
    - a relative URL.


---

### url(String, String...)
- static url(action: [String](TopLevel.String.md), namesAndParams: [String...](TopLevel.String.md)): [URL](dw.web.URL.md)
  - : Return a relative URL.

    **Parameters:**
    - action - the pipeline, which should be invoked, e.g.: 'Pipeline-StartNode'
    - namesAndParams - several strings with name=value pairs , e.g.: 'pid', 'value1', 'cgid', value2'.

    **Returns:**
    - a relative URL.


---

### webRoot()
- ~~static webRoot(): [URL](dw.web.URL.md)~~
  - : Return a relative web root URL. A web root URL is used to access all static
      media context for the site. The actual media file can be referenced by appending
      a relative path.
      
      Note: The use of this method is deprecated. The method staticURL() should
      be used instead. It provides better cache integration.


    **Returns:**
    - a relative web root URL.

    **Deprecated:**
:::warning
Use the [staticURL(String)](dw.web.URLUtils.md#staticurlstring) or the [staticURL(String, String, String)](dw.web.URLUtils.md#staticurlstring-string-string) method instead.
:::

---

<!-- prettier-ignore-end -->
