import Page = require('./Page');
import utilMap = require('../util/Map');

/**
 * This is the context that is handed over to the `render` and `serialize` function of the respective page type
 * script.
 * @example
 * `String : render( PageScriptContext context)`
 * `Object : serialize( PageScriptContext context)`
 */
declare class PageScriptContext {
    /**
     * Returns the processed version of the underlying unprocessed raw values (also see Page.getAttribute)
     * of this page's attributes which you can use in your respective page type `render` and `serialize` function
     * implementing your business and rendering/serialization functionality. Processing the raw value is comprised of expansion
     * and conversion, in this order.
     * 
     * - expansion - dynamic placeholders are transformed into actual values, for example url/link placeholders in
     * markup text are resolved to real URLs
     * - conversion - the raw value (see Page.getAttribute) is resolved into an actual
     * DWScript object depending on the type of the attribute as specified in its respective attribute definition
     * 
     * - `boolean` -> boolean
     * - `category` -> dw.catalog.Category
     * - `custom` -> dw.util.Map
     * - `cms_record` -> dw.experience.cms.CMSRecord
     * - `enum` -> either string or integer
     * - `file` -> dw.content.MediaFile
     * - `image` -> dw.experience.image.Image
     * - `integer` -> integer
     * - `markup` -> string
     * - `page` -> string
     * - `product` -> dw.catalog.Product
     * - `string` -> string
     * - `text` -> string
     * - `url` -> string
     */
    readonly content: utilMap<any, any>;
    /**
     * Returns the page for which the corresponding page type script is currently executed.
     */
    readonly page: Page;
    /**
     * Returns the `parameters` argument as passed when kicking off page rendering via
     * 
     * - PageMgr.renderPage
     * - PageMgr.renderPage
     * 
     * and serialization
     * 
     * - PageMgr.serializePage
     * - PageMgr.serializePage
     * @deprecated Please use getRuntimeParameters instead.
     */
    readonly renderParameters: string;
    /**
     * Returns the `parameters` argument as passed when kicking off page rendering via
     * 
     * - PageMgr.renderPage
     * - PageMgr.renderPage
     * 
     * and page serialization via
     * 
     * - PageMgr.serializePage
     * - PageMgr.serializePage
     */
    readonly runtimeParameters: string;
    private constructor();
    /**
     * Returns the processed version of the underlying unprocessed raw values (also see Page.getAttribute)
     * of this page's attributes which you can use in your respective page type `render` and `serialize` function
     * implementing your business and rendering/serialization functionality. Processing the raw value is comprised of expansion
     * and conversion, in this order.
     * 
     * - expansion - dynamic placeholders are transformed into actual values, for example url/link placeholders in
     * markup text are resolved to real URLs
     * - conversion - the raw value (see Page.getAttribute) is resolved into an actual
     * DWScript object depending on the type of the attribute as specified in its respective attribute definition
     * 
     * - `boolean` -> boolean
     * - `category` -> dw.catalog.Category
     * - `custom` -> dw.util.Map
     * - `cms_record` -> dw.experience.cms.CMSRecord
     * - `enum` -> either string or integer
     * - `file` -> dw.content.MediaFile
     * - `image` -> dw.experience.image.Image
     * - `integer` -> integer
     * - `markup` -> string
     * - `page` -> string
     * - `product` -> dw.catalog.Product
     * - `string` -> string
     * - `text` -> string
     * - `url` -> string
     */
    getContent(): utilMap<any, any>;
    /**
     * Returns the page for which the corresponding page type script is currently executed.
     */
    getPage(): Page;
    /**
     * Returns the `parameters` argument as passed when kicking off page rendering via
     * 
     * - PageMgr.renderPage
     * - PageMgr.renderPage
     * 
     * and serialization
     * 
     * - PageMgr.serializePage
     * - PageMgr.serializePage
     * @deprecated Please use getRuntimeParameters instead.
     */
    getRenderParameters(): string;
    /**
     * Returns the `parameters` argument as passed when kicking off page rendering via
     * 
     * - PageMgr.renderPage
     * - PageMgr.renderPage
     * 
     * and page serialization via
     * 
     * - PageMgr.serializePage
     * - PageMgr.serializePage
     */
    getRuntimeParameters(): string;
}

export = PageScriptContext;
