/**
 * The class is needed for the URL creation within template processing. It
 * represents a reference to a pipeline name and start node, usually used in a
 * HREF or a FORM action. URLAction instances are usually passed to one of the
 * methods in dw.web.URLUtils in order to generate an appropriately
 * constructed Commerce Cloud Digital URL.  For example:
 * 
 * `
 * var urlAction : URLAction = new URLAction("SimplePipeline-Start", "SampleSite");
 * 
 * var url : URL = URLUtils.abs(false, urlAction1);
 * 
 * // url.toString() equals "http://" + request.httpHost + "/on/demandware.store/Sites-SampleSite-Site/default/SimplePipeline-Start"
 * 
 * `
 */
declare class URLAction {
    /**
     * Constructs an action for the current site and locale.
     */
    constructor(action: string);
    /**
     * Constructs an action for the specified site and the current locale.
     */
    constructor(action: string, siteName: string);
    /**
     * Constructs an action for the specified site and locale.
     */
    constructor(action: string, siteName: string, locale: string);
    /**
     * Constructs an URL action for the specified site, locale and hostname.
     * 
     * The hostname must be defined in the site alias settings. If no hostname is provided, the HTTP/HTTPS
     * host defined in the site alias settings will be used. If no HTTP/HTTPS host is defined in the site alias
     * settings, the hostname of the current request is used.
     * @throws Exception if hostName is not defined in site alias settings
     */
    constructor(action: string, siteName: string, locale: string, hostName: string);
}

export = URLAction;
