import URL = require('./URL');
import URLAction = require('./URLAction');
import URLParameter = require('./URLParameter');

/**
 * URL utility class. Methods in this class generate URLs used in Commerce Cloud Digital.
 * 
 * Site related information in the generated URLs is determined from the current HTTP request.
 * 
 * Methods belong to two groups: generating absolute and relative URLs. Absolute URL methods
 * are further subdivided into those creating URLs with specified protocol and those
 * using protocol information from the request. Corresponding to the protocol, the host name
 * from the HTTP/HTTPS host preference is used. If preference is not set, the host name from the
 * current request is included in resulting absolute URL.
 * 
 * URLs do not include a session ID anymore. The appendSID argument therefore does not have any effect.
 * 
 * When creating a pipeline URL with one of the methods url(), http(), https() or abs() by default
 * the generated URL is a Commerce Cloud Digital URL ("/on/demandware.store/..."). If search friendly URLs are
 * enabled (old or new) the methods generate search friendly URLs. Search friendly URLs are only generated for
 * certain pipeline names. Here a list of these pipeline names:
 * 
 * - Product-Show with a 'pid' parameter [productID] - search friendly URL for a product
 * - Product-ShowInCategory with the 'cgid' parameter [categoryID] and 'pid' parameter [productID] - search friendly URL for a product shown in a specific category
 * - Search-Show with a 'cgid' parameter [categoryID] - search friendly URL for a category
 * - Search-Show with a 'pid' parameter [productID] - search friendly URL for a product
 * - Search-ShowContent with a 'fdid' parameter [folderID] - search friendly URL for a folder (ONLY works with new storefront URLs)
 * - Page-Show with a 'cid' parameter [contentID] - search friendly URL for a content page
 * 
 * Parameter `transform`:
 * 
 * Some methods allow the specification of image transformation parameters. Image
 * transformation is only performed if the Dynamic Imaging Service (DIS) is available
 * for the Commerce Cloud Digital instance. Otherwise a standard static content URL is returned.
 * The to-be-transformed image needs to be hosted on Digital.
 * 
 * Image transformation parameters are specified as JavaScript object literal. They
 * are translated into URL parameters. See Create Image Transformation URLs.
 * 
 * Type of transformation
 * Parameters
 * Description
 * 
 * Scale an image
 * 
 * `scaleWidth`
 * 
 * `scaleHeight`
 * 
 * `scaleMode`
 * 
 * The `scaleWidth` and `scaleHeight` parameters
 * are both integers; setting one of these parameters triggers a
 * scaling operation. If both are provided, the one that scales the
 * image less is used to calculate the scale factor. The image is then
 * automatically cropped accord to the second dimension, with a
 * centered position of the cropped area. If the parameter would scale
 * the image larger, only this operation is applied, if the image
 * remains within acceptable pixel dimensions.
 * 
 * Note: `scaleMode` can only be used in combination with `scaleHeight` and `scaleWidth`.
 * 
 * The `scaleMode` parameter can be set to `cut`
 * or `fit`. The default `scaleMode` is
 * `cut`, the behavior of which is explained above. If you
 * specify `fit` as the `scaleMode`, the system
 * scales the image into the given box of dimensions while keeping the
 * aspect ratio (possibly resulting in a smaller image in one
 * dimension).
 * 
 * Overlay an image
 * 
 * `imageX`
 * 
 * `imageY`
 * 
 * `imageURI`
 * 
 * The `imageX` and `imageY` parameters are both
 * integers. Valid values for these parameters are 0 or greater.
 * 
 * Supported formats are `png`, `jpg`, `jp2`, and
 * `gif`.
 * 
 * The `imageURI` parameter can be set to the absolute path
 * of the overlaid image. The value of the `imageURI`
 * parameter must be given in proper URL encoding, and it cannot exceed
 * 400 characters in length. The path may include query string
 * parameters, which supports dynamically generating the overlaid image
 * itself through this service; that is, the overlaid image can itself
 * be a transformed image.
 * 
 * If the overlaid image extends over the primary image's boundaries,
 * the overlaid image is cropped so that it fits directly over the
 * primary image.
 * 
 * Crop an image
 * 
 * `cropX`
 * 
 * `cropY`
 * 
 * `cropWidth`
 * 
 * `cropHeight`
 * 
 * The `cropX`, `cropY`, `cropWidth`,
 * `cropHeight` parameters are integers. All four parameters
 * must be specified to trigger a cropping operation.
 * 
 * Valid values for the `cropX` and `cropY`
 * parameters are 0 or greater. If the crop location defined by
 * `cropX` and `cropY` is outside the image area,
 * nothing is cropped.
 * 
 * Valid values for the `cropWidth` and
 * `cropHeight` parameters are 10 or greater. If the
 * `cropWidth` and `cropHeight` parameters
 * specify a size that is greater than the original image, the crop
 * area is reduced to the actual image area. If `cropWidth`
 * and `cropHeight` are 0 or less, no transformation is
 * applied.
 * 
 * Format an image
 * `format`
 * 
 * The `format` parameter specifies the target format of the
 * image. Supported formats are `png`, `jpg`, `jp2`, and
 * `gif`. If no target format is specified, no format
 * conversion is performed.
 * 
 * The source image file is references with attribute
 * `relPath`. Source image's format is recognized by the
 * file extension which must be `tif`, `tiff`,
 * `jpg`, `jpeg`, `png`, or
 * `gif`.
 * 
 * In the generated URL the file extension of the target format is used
 * in the URL path. This is to make sure the image is loaded from an
 * URL with a matching file extension. The source format is provided as
 * URL parameter.
 * 
 * Adjust image compression quality
 * `quality`
 * 
 * The `quality` parameter specifies a quality setting for `jpg` and `jp2` images,
 * and specifies the compression level for `png` images.
 * 
 * For `jpg` and `jp2` images, you can set values from 1–100 for the highest quality.
 * The default quality is 80. If you're not changing the default quality, you don't need to pass in a value.
 * 
 * For `png` images, the quality setting has no effect on the appearance of the `png`, since the compression is always lossless.
 * Instead you can use the quality setting to set the zlib compression level and filter-type for PNG images.
 * The tens digit sets the zlib compression level(1-9). The ones digit sets the filter type.
 * 
 * If the `png` setting is not present or set to 0, it uses a default value of 75.
 * If this setting is set to 100, it actually equals the quality setting 90.
 * 
 * Adjust Metadata stripping
 * `strip`
 * 
 * The `strip` parameter specifies if metadata like EXIF and color profiles is
 * stripped from the image during transformation.
 * 
 * Valid values for the `strip` parameter are between `true` and `false`.
 * The default is `true`
 * 
 * Change background color
 * `bgcolor(color) or bgcolor(color+alpha)`
 * 
 * The `bgcolor` parameter specifies the background color for images that support transparency
 * as well as JPEG images when being converted from a format that supports transparency.
 * Optionally, alpha setting for PNG images are also supported.
 * 
 * `bgcolor` expects a 6 digit hexadecimal value of RGB with an optional
 * two hexadecimal characters representing alpha value that determines transparency.
 * 
 * FF0000 = Red
 * 
 * FF000077 = Red with 50% transparency
 * 
 * Alpha values are optional. When the alpha value is omitted, the resulting color is opaque.
 * Alpha values are only valid when the image output format is PNG.
 * 
 * Example:
 * 
 * The following code
 * 
 * `var url = URLUtils.imageURL('/somepath/image.png', {scaleWidth: 100, format: 'jpg'});`
 * 
 * will produce an image transformation URL like
 * 
 * `http://<image server host name>/.../on/demandware.static/.../somepath/image.jpg?sw=100&sfrm=png`.
 */
declare class URLUtils {
    /**
     * ID for a catalog context. See staticURL() method.
     */
    static readonly CONTEXT_CATALOG = "ContextCatalog";
    /**
     * ID for a library context. See staticURL() method.
     */
    static readonly CONTEXT_LIBRARY = "ContextLibrary";
    /**
     * ID for a site context (= assigned cartridges). See staticURL() method.
     */
    static readonly CONTEXT_SITE = "ContextSite";
    private constructor();
    /**
     * Return an absolute URL with protocol and host from the current request.
     */
    static abs(action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return an absolute URL with protocol and host from current request.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding abs() method without the
     * appendSID parameter instead.
     * @deprecated Use abs instead.
     */
    static abs(appendSID: boolean, action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return an absolute URL with protocol and host from current request.
     */
    static abs(action: string, ...namesAndParams: string[]): URL;
    /**
     * Return an absolute URL with protocol and host from current request.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding method abs() without the
     * appendSID parameter instead.
     * @deprecated Use abs instead.
     */
    static abs(appendSID: boolean, action: string, ...namesAndParams: string[]): URL;
    /**
     * Similar to absStatic( String, String, String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     */
    static absImage(context: string, contextID: string, relPath: string, transform: any): URL;
    /**
     * Similar to absStatic( String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     */
    static absImage(relPath: string, transform: any): URL;
    /**
     * Returns the absolute URL to the static location of the specified context. The context
     * can be either a specific catalog (URLUtils.CONTEXT_CATALOG),
     * a content library (URLUtils.CONTEXT_LIBRARY) or a site (URLUtils.CONTEXT_SITE).
     * Respectively either a URL to images in a catalog, a library or a site are created.
     * 
     * The contextID parameter is optional and only used for context CONTEXT_CATALOG, where
     * is specifies the ID of a specific catalog. If defined, the static URL for the specified
     * catalog is returned. If not defined, the static URL for the current site catalog
     * is returned (or null if no site catalog is defined).
     * 
     * For context CONTEXT_SITE and context CONTEXT_LIBRARY, the contextID parameter is
     * ignored and the static URL for the current site / site library is returned.
     * 
     * Parameter relPath can be defined to specify the relative path within the context-specific
     * path.
     * 
     * The method returns an absolute URL with the same protocol as the current request.
     */
    static absStatic(context: string, contextID: string, relPath: string): URL | null;
    /**
     * The method returns a static URL for a resource in the current site. Site
     * resources are actually located in the cartridges associated with the site.
     * This resources are typically logos, button images, CSS files and JavaScript
     * files. The method will transform the given relative path to include cache
     * related information, which enables better cache control.
     * 
     * The created URL is an absolute URL with same protocol as the current incoming
     * request.
     * 
     * Note: This method replaces the original mechanisms of using the webroot()
     * method to construct a URL. The new method is better integrated into the
     * overall cache management.
     */
    static absStatic(relPath: string): URL;
    /**
     * Return an absolute web root URL with protocol and host same as the current request.
     * 
     * Note: The use of this method is deprecated. The method absStatic() should
     * be used instead. It provides better cache integration.
     * @deprecated Use absStatic or absStatic instead.
     */
    static absWebRoot(): URL;
    /**
     * Return a URL, which can be used in combination with an Interaction Continue Node, to
     * continue the user interface flow.
     */
    static continueURL(): URL;
    /**
     * Generates a hostname-only url if an alias is set, or an url to the Home-Show
     * pipeline in the default format using the protocol of the incoming request.
     */
    static home(): URL;
    /**
     * Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     */
    static http(action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding http() method without the
     * appendSID parameter instead.
     * @deprecated Use http instead.
     */
    static http(appendSID: boolean, action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     */
    static http(action: string, ...namesAndParams: string[]): URL;
    /**
     * Return an absolute URL with HTTP protocol. If an HTTP host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding http() method without the
     * appendSID parameter instead.
     * @deprecated Use http instead.
     */
    static http(appendSID: boolean, action: string, ...namesAndParams: string[]): URL;
    /**
     * Return a URL, which can be used in combination with an Interaction Continue Node, to
     * continue the user interface flow. For security reasons the httpContinue() function returns
     * a HTTPS continue URL if the interaction flow has started with a HTTPS request. Otherwise a
     * HTTP continue URL is returned.
     * If an HTTP/HTTPS host is configured in the preferences the returned URL will include that
     * host, otherwise, the host from current request is used.
     */
    static httpContinue(): URL;
    /**
     * Generates a hostname-only url if an alias is set, or an url to the Home-Show
     * pipeline in the default format using the HTTP protocol.
     */
    static httpHome(): URL;
    /**
     * Similar to httpStatic( String, String, String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     */
    static httpImage(context: string, contextID: string, relPath: string, transform: any): URL;
    /**
     * Similar to httpStatic( String, String, String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     */
    static httpImage(host: string, context: string, contextID: string, relPath: string, transform: any): URL;
    /**
     * Similar to httpStatic( String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     */
    static httpImage(relPath: string, transform: any): URL;
    /**
     * Similar to httpStatic( String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     */
    static httpImage(host: string, relPath: string, transform: any): URL;
    /**
     * Returns the absolute URL to the static location of the specified context. The context
     * can be either a specific catalog (URLUtils.CONTEXT_CATALOG),
     * a content library (URLUtils.CONTEXT_LIBRARY) or a site (URLUtils.CONTEXT_SITE).
     * Respectively either a URL to images in a catalog, a library or a site are created.
     * 
     * The contextID parameter is optional and only used for context CONTEXT_CATALOG, where
     * is specifies the ID of a specific catalog. If defined, the static URL for the specified
     * catalog is returned. If not defined, the static URL for the current site catalog
     * is returned (or null if no site catalog is defined).
     * 
     * For context CONTEXT_SITE and context CONTEXT_LIBRARY, the contextID parameter is
     * ignored and the static URL for the current site / site library is returned.
     * 
     * Parameter relPath can be defined to specify the relative path within the context-specific
     * path.
     * 
     * The method returns an absolute URL with HTTP protocol.
     */
    static httpStatic(context: string, contextID: string, relPath: string): URL | null;
    /**
     * Returns the absolute URL to the static location of the specified context. The context
     * can be either a specific catalog (URLUtils.CONTEXT_CATALOG),
     * a content library (URLUtils.CONTEXT_LIBRARY) or a site (URLUtils.CONTEXT_SITE).
     * Respectively either a URL to images in a catalog, a library or a site are created.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     * 
     * The contextID parameter is optional and only used for context CONTEXT_CATALOG, where
     * is specifies the ID of a specific catalog. If defined, the static URL for the specified
     * catalog is returned. If not defined, the static URL for the current site catalog
     * is returned (or null if no site catalog is defined).
     * 
     * For context CONTEXT_SITE and context CONTEXT_LIBRARY, the contextID parameter is
     * ignored and the static URL for the current site / site library is returned.
     * 
     * Parameter relPath can be defined to specify the relative path within the context-specific
     * path.
     * 
     * The method returns an absolute URL with HTTP protocol.
     */
    static httpStatic(host: string, context: string, contextID: string, relPath: string): URL | null;
    /**
     * The method returns a static URL for a resource in the current site. Site
     * resources are actually located in the cartridges associated with the site.
     * This resources are typically logos, button images, CSS files and JavaScript
     * files. The method will transform the given relative path to include cache
     * related information, which enables better cache control.
     * 
     * The created URL is an absolute URL with HTTP protocol.
     * 
     * Note: This method replaces the original mechanisms of using the webroot()
     * method to construct a URL. The new method is better integrated into the
     * overall cache management.
     */
    static httpStatic(relPath: string): URL;
    /**
     * The method returns a static URL for a resource in the current site. Site
     * resources are actually located in the cartridges associated with the site.
     * This resources are typically logos, button images, CSS files and JavaScript
     * files. The method will transform the given relative path to include cache
     * related information, which enables better cache control.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     * 
     * The created URL is an absolute URL with HTTP protocol.
     * 
     * Note: This method replaces the original mechanisms of using the webroot()
     * method to construct a URL. The new method is better integrated into the
     * overall cache management.
     */
    static httpStatic(host: string, relPath: string): URL;
    /**
     * Return an absolute web root URL with HTTP protocol and host information from current
     * request. If an HTTP host is configured in the preferences the returned URL will include
     * that host.
     * 
     * Note: The use of this method is deprecated. The method httpStatic() should
     * be used instead. It provides better cache integration.
     * @deprecated Use the httpStatic or httpStatic methods instead.
     */
    static httpWebRoot(): URL;
    /**
     * Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     */
    static https(action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding https() method without the
     * appendSID parameter instead.
     * @deprecated Use the https method instead.
     */
    static https(appendSID: boolean, action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     */
    static https(action: string, ...namesAndParams: string[]): URL;
    /**
     * Return an absolute URL with HTTPS protocol. If an HTTPS host is configured in the preferences
     * the returned URL will include that host, otherwise, the host from current request is used.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding https() method without the
     * appendSID parameter instead.
     * @deprecated Use the https method instead.
     */
    static https(appendSID: boolean, action: string, ...namesAndParams: string[]): URL;
    /**
     * Return a URL, which can be used in combination with an Interaction Continue Node, to
     * continue the user interface flow. An absolute URL with HTTPS protocol is returned.
     * If an HTTPS host is configured in the preferences the returned URL will include that
     * host, otherwise, the host from current request is used.
     */
    static httpsContinue(): URL;
    /**
     * Generates a hostname-only url if an alias is set, or an url to the Home-Show
     * pipeline in the default format using the HTTPS protocol.
     */
    static httpsHome(): URL;
    /**
     * Similar to httpsStatic( String, String, String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     */
    static httpsImage(context: string, contextID: string, relPath: string, transform: any): URL;
    /**
     * Similar to httpsStatic( String, String, String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     */
    static httpsImage(host: string, context: string, contextID: string, relPath: string, transform: any): URL;
    /**
     * Similar to httpsStatic( String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     */
    static httpsImage(relPath: string, transform: any): URL;
    /**
     * Similar to httpsStatic( String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     */
    static httpsImage(host: string, relPath: string, transform: any): URL;
    /**
     * Returns the absolute URL to the static location of the specified context. The context
     * can be either a specific catalog (URLUtils.CONTEXT_CATALOG),
     * a content library (URLUtils.CONTEXT_LIBRARY) or a site (URLUtils.CONTEXT_SITE).
     * Respectively either a URL to images in a catalog, a library or a site are created.
     * 
     * The contextID parameter is optional and only used for context CONTEXT_CATALOG, where
     * is specifies the ID of a specific catalog. If defined, the static URL for the specified
     * catalog is returned. If not defined, the static URL for the current site catalog
     * is returned (or null if no site catalog is defined).
     * 
     * For context CONTEXT_SITE and context CONTEXT_LIBRARY, the contextID parameter is
     * ignored and the static URL for the current site / site library is returned.
     * 
     * Parameter relPath can be defined to specify the relative path within the context-specific
     * path.
     * 
     * The method returns an absolute URL with HTTPS protocol.
     */
    static httpsStatic(context: string, contextID: string, relPath: string): URL | null;
    /**
     * Returns the absolute URL to the static location of the specified context. The context
     * can be either a specific catalog (URLUtils.CONTEXT_CATALOG),
     * a content library (URLUtils.CONTEXT_LIBRARY) or a site (URLUtils.CONTEXT_SITE).
     * Respectively either a URL to images in a catalog, a library or a site are created.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     * 
     * The contextID parameter is optional and only used for context CONTEXT_CATALOG, where
     * is specifies the ID of a specific catalog. If defined, the static URL for the specified
     * catalog is returned. If not defined, the static URL for the current site catalog
     * is returned (or null if no site catalog is defined).
     * 
     * For context CONTEXT_SITE and context CONTEXT_LIBRARY, the contextID parameter is
     * ignored and the static URL for the current site / site library is returned.
     * 
     * Parameter relPath can be defined to specify the relative path within the context-specific
     * path.
     * 
     * The method returns an absolute URL with HTTPS protocol.
     */
    static httpsStatic(host: string, context: string, contextID: string, relPath: string): URL | null;
    /**
     * The method returns a static URL for a resource in the current site. Site
     * resources are actually located in the cartridges associated with the site.
     * This resources are typically logos, button images, CSS files and JavaScript
     * files. The method will transform the given relative path to include cache
     * related information, which enables better cache control.
     * 
     * The created URL is an absolute URL with HTTPS protocol.
     * 
     * Note: This method replaces the original mechanisms of using the webroot()
     * method to construct a URL. The new method is better integrated into the
     * overall cache management.
     */
    static httpsStatic(relPath: string): URL;
    /**
     * The method returns a static URL for a resource in the current site. Site
     * resources are actually located in the cartridges associated with the site.
     * This resources are typically logos, button images, CSS files and JavaScript
     * files. The method will transform the given relative path to include cache
     * related information, which enables better cache control.
     * 
     * The host parameter is optional. If provided, then this host name will be used
     * in precedence to the host name provided by the current request. The specified host
     * name must be defined in the alias settings for the site, otherwise an exception will
     * be thrown.
     * 
     * The created URL is an absolute URL with HTTPS protocol.
     * 
     * Note: This method replaces the original mechanisms of using the webroot()
     * method to construct a URL. The new method is better integrated into the
     * overall cache management.
     */
    static httpsStatic(host: string, relPath: string): URL;
    /**
     * Return an absolute web root URL with HTTPS protocol and host and domain information from the current
     * request. If an HTTP host is configured in the preferences the returned URL will include that host.
     * 
     * Note: The use of this method is deprecated. The method httpsStatic() should
     * be used instead. It provides better cache integration.
     * @deprecated Use the httpsStatic or httpsStatic method instead.
     */
    static httpsWebRoot(): URL;
    /**
     * Similar to staticURL( String, String, String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     * 
     * The URL returned is always an absolute URL.
     */
    static imageURL(context: string, contextID: string, relPath: string, transform: any): URL;
    /**
     * Similar to staticURL( String ) this method returns a static URL for a resource
     * in the current site. The method assumes, that the URL refers to an image an
     * supports an additional parameter with optional image transformation parameters.
     * The image transformation parameters must be specified as JavaScript object literal.
     * 
     * The URL returned is always an absolute URL.
     */
    static imageURL(relPath: string, transform: any): URL;
    /**
     * This method is used to create a URL that redirects to a location in
     * the current site with another host name. When the URL is submitted,
     * the system copies all system cookies, such that user, session and basket
     * information are shared across different hosts.
     * 
     * The specified host name must be defined in the alias settings for the site,
     * otherwise an exception will be thrown when submitting the redirect URL.
     * 
     * If the specified host is the same as the current host, the method will return
     * a "normal" URL because no redirect is required.
     */
    static sessionRedirect(host: string, url: URL): URL;
    /**
     * This method is used to create a URL that redirects to a location in
     * the current site with another host name. When the URL is submitted,
     * the system copies all system cookies, such that user, session and basket
     * information are shared across different hosts.
     * 
     * The specified host name must be defined in the alias settings for the site,
     * otherwise an exception will be thrown when submitting the redirect URL.
     * 
     * If the specified host is the same as the current host, the method will return
     * a "normal" URL because no redirect is required.
     * 
     * Note: since this method generates a non-secure (HTTP) link, no
     * HTTPS Cookies are copied, which might lead to sessions being incorrectly being
     * detected as hijacked. It is strongly recommended to use sessionRedirect
     * where possible.
     */
    static sessionRedirectHttpOnly(host: string, url: URL): URL;
    /**
     * Returns the relative URL to the static location of the specified context. The context
     * can be either a specific catalog (URLUtils.CONTEXT_CATALOG),
     * a content library (URLUtils.CONTEXT_LIBRARY) or a site (URLUtils.CONTEXT_SITE).
     * Respectively either a URL to images in a catalog, a library or a site are created.
     * 
     * The contextID parameter is optional and can be used with context either CONTEXT_CATALOG or CONTEXT_LIBRARY, where
     * it specifies the ID of a specific catalog or a shared library respectively. If defined, the static URL for the specified
     * catalog/shared library is returned. If not defined, the static URL for the current site catalog/site library
     * is returned (or null if no site catalog/site library is defined).
     * 
     * For context CONTEXT_SITE, the contextID parameter is ignored and the static URL for the current site is returned.
     * 
     * Parameter relPath can be defined to specify the relative path within the context-specific
     * path.
     * 
     * The method returns an relative URL with the same protocol as the current request.
     */
    static staticURL(context: string, contextID: string, relPath: string): URL | null;
    /**
     * The method returns a static URL for a resource in the current site. Site
     * resources are actually located in the cartridges associated with the site.
     * This resources are typically logos, button images, CSS files and JavaScript
     * files. The method will transform the given relative path to include cache
     * related information, which enables better cache control.
     * 
     * The created URL is a relative URL.
     * 
     * Note: This method replaces the original mechanisms of using the webroot()
     * method to construct a URL. The new method is better integrated into the
     * overall cache management.
     */
    static staticURL(relPath: string): URL;
    /**
     * Return a relative URL.
     */
    static url(action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return a relative URL.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding url() method without the
     * appendSID parameter instead.
     * @deprecated Use url instead.
     */
    static url(appendSID: boolean, action: URLAction, ...params: URLParameter[]): URL;
    /**
     * Return a relative URL.
     */
    static url(action: string, ...namesAndParams: string[]): URL;
    /**
     * Return a relative URL.
     * 
     * Note: The use of this method is deprecated, because session URL rewriting
     * is no longer supported. Use the corresponding url() method without the
     * appendSID parameter instead.
     * @deprecated Use url instead.
     */
    static url(appendSID: boolean, action: string, ...namesAndParams: string[]): URL;
    /**
     * Return a relative web root URL. A web root URL is used to access all static
     * media context for the site. The actual media file can be referenced by appending
     * a relative path.
     * 
     * Note: The use of this method is deprecated. The method staticURL() should
     * be used instead. It provides better cache integration.
     * @deprecated Use the staticURL or the staticURL method instead.
     */
    static webRoot(): URL;
}

export = URLUtils;
