import Region = require('./Region');
import Collection = require('../util/Collection');
import Folder = require('../content/Folder');

/**
 * 
 * 
 * This class represents a page designer managed page. A page comprises of
 * multiple regions that hold components, which themselves again can have
 * regions holding components, i.e. spanning a hierarchical tree of components.
 * 
 * Using
 * 
 * - PageMgr.renderPage
 * - PageMgr.renderPage
 * 
 * a page can be rendered. As such page implements a render function for creating
 * render output the render function of the page itself will also want to access
 * its various properties like the SEO title etc.
 * 
 * Apart from rendering to markup a page can also be serialized, i.e. transformed
 * into a json string using
 * 
 * - PageMgr.serializePage
 * - PageMgr.serializePage
 * @see Region
 * @see Component
 * @see PageMgr
 */
declare class Page {
    /**
     * Returns the id of this page.
     */
    readonly ID: string;
    /**
     * Get the aspect type of the page.
     * If an aspect type is set for this page (and is found in the deployed code version), then the page is treated as dynamic page during
     * rendering and serialization.
     * @see PageMgr.renderPage
     * @see PageMgr.serializePage
     */
    readonly aspectTypeID: string;
    /**
     * Returns the classification dw.content.Folder associated with this page.
     */
    readonly classificationFolder: Folder | null;
    /**
     * Returns the description of this page.
     */
    readonly description: string;
    /**
     * Returns all folders to which this page is assigned.
     */
    readonly folders: Collection<Folder>;
    /**
     * Returns the name of this page.
     */
    readonly name: string;
    /**
     * Returns the SEO description of this page.
     */
    readonly pageDescription: string;
    /**
     * Returns the SEO keywords of this page.
     */
    readonly pageKeywords: string;
    /**
     * Returns the SEO title of this page.
     */
    readonly pageTitle: string;
    /**
     * Returns the search words of the page used for the search index.
     */
    readonly searchWords: string;
    /**
     * Returns the type id of this page.
     */
    readonly typeID: string;
    /**
     * Returns `true` if the page is currently visible which is the case if:
     * 
     * - page is published
     * - the page is set to visible in the current locale
     * - all visibility rules apply, requiring that
     * 
     * - schedule matches
     * - customer group matches
     * - aspect attribute qualifiers match
     * - campaign and promotion qualifiers match
     * 
     * If any of these is not the case then `false` will be returned.
     * <p style="color:red">
     * As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
     * call should NOT happen in a pagecached context outside of the processing induced by rendering/serialization (see the corresponding
     * methods in PageMgr).
     * 
     * Use hasVisibilityRules prior to calling this method in order to check for the existence of visibility rules. If there are
     * visibility rules then do not apply pagecaching. Otherwise the visibility decision making would end up in the pagecache and any subsequent
     * call would just return from the pagecache instead of performing the isVisible check again as desired.
     * @example
     * ...
     * var page = PageMgr.getPage(pageID);
     * if (page.hasVisibilityRules())
     * {
     * // pagecaching is NOT ok here
     * if (page.isVisible())
     * {
     * response.writer.print(PageMgr.renderPage(pageID, {});
     * }
     * }
     * else
     * {
     * // pagecaching is ok here, but requires a pagecache refresh if merchants start adding visibility rules to the page
     * }
     * ...
     * @see isVisible
     */
    readonly visible: boolean;
    private constructor();
    /**
     * Get the aspect type of the page.
     * If an aspect type is set for this page (and is found in the deployed code version), then the page is treated as dynamic page during
     * rendering and serialization.
     * @see PageMgr.renderPage
     * @see PageMgr.serializePage
     */
    getAspectTypeID(): string;
    /**
     * 
     * Returns the raw attribute value identified by the specified attribute id.
     * By raw attribute value we denote the unprocessed value as provided for the attribute
     * driven by the type of the respective attribute definition:
     * 
     * - `boolean` -> boolean
     * - `category` -> string representing a catalog category ID
     * - `custom` -> dw.util.Map that originates from a stringified curly brackets {} JSON object
     * - `cms_record` -> dw.util.Map that originates from a stringified curly brackets {} JSON object whose entries must adhere to the `cmsrecord.json` schema
     * - `enum` -> either string or integer
     * - `file` -> string representing a file path within a library
     * - `image` -> dw.util.Map that originates from a stringified curly brackets {} JSON object whose entries must adhere to the `content/schema/image.json` schema
     * - `integer` -> integer
     * - `markup` -> string representing HTML markup
     * - `page` -> string representing a page ID
     * - `product` -> string representing a product SKU
     * - `string` -> string
     * - `text` -> string
     * - `url` -> string representing a URL
     * 
     * There is two places an attribute value can come from - either it was persisted at design time (e.g.
     * by the merchant by editing a component in Page Designer) or it was injected in shape of an aspect attribute at rendering time
     * through the execution of code. The persistent value, if existing, takes precedence over the injected aspect
     * attribute one. Injection of a value through an aspect attribute will only occur if the page attribute's
     * attribute definition was declared using the `"dynamic_lookup"` property and its aspect attribute alias matches
     * the ID of the respective aspect attribute.
     * 
     * Accessing the raw value can be helpful if render and serialization logic of the
     * page needs to operate on these unprocessed values. An unprocessed value
     * might be fundamentally different from its processed counterpart, the latter being
     * provided through the content dictionary (see PageScriptContext.getContent)
     * when the render/serialize function of the page is invoked.
     */
    getAttribute(attributeID: string): any | null;
    /**
     * Returns the classification dw.content.Folder associated with this page.
     */
    getClassificationFolder(): Folder | null;
    /**
     * Returns the description of this page.
     */
    getDescription(): string;
    /**
     * Returns all folders to which this page is assigned.
     */
    getFolders(): Collection<Folder>;
    /**
     * Returns the id of this page.
     */
    getID(): string;
    /**
     * Returns the name of this page.
     */
    getName(): string;
    /**
     * Returns the SEO description of this page.
     */
    getPageDescription(): string;
    /**
     * Returns the SEO keywords of this page.
     */
    getPageKeywords(): string;
    /**
     * Returns the SEO title of this page.
     */
    getPageTitle(): string;
    /**
     * Returns the page region that matches the given id.
     */
    getRegion(id: string): Region | null;
    /**
     * Returns the search words of the page used for the search index.
     */
    getSearchWords(): string;
    /**
     * Returns the type id of this page.
     */
    getTypeID(): string;
    /**
     * Returns `true` if the page has visibility rules (scheduling, customer groups, aspect attribute qualifiers,
     * campaign and promotion qualifiers) applied, otherwise `false`. Use this
     * method prior to isVisible, so you do not call the latter in a pagecached context.
     */
    hasVisibilityRules(): boolean;
    /**
     * Returns `true` if the page is currently visible which is the case if:
     * 
     * - page is published
     * - the page is set to visible in the current locale
     * - all visibility rules apply, requiring that
     * 
     * - schedule matches
     * - customer group matches
     * - aspect attribute qualifiers match
     * - campaign and promotion qualifiers match
     * 
     * If any of these is not the case then `false` will be returned.
     * <p style="color:red">
     * As visibility is driven by the merchant configured dynamic visibility rules, e.g. scheduling and custom segmentation, this
     * call should NOT happen in a pagecached context outside of the processing induced by rendering/serialization (see the corresponding
     * methods in PageMgr).
     * 
     * Use hasVisibilityRules prior to calling this method in order to check for the existence of visibility rules. If there are
     * visibility rules then do not apply pagecaching. Otherwise the visibility decision making would end up in the pagecache and any subsequent
     * call would just return from the pagecache instead of performing the isVisible check again as desired.
     * @example
     * ...
     * var page = PageMgr.getPage(pageID);
     * if (page.hasVisibilityRules())
     * {
     * // pagecaching is NOT ok here
     * if (page.isVisible())
     * {
     * response.writer.print(PageMgr.renderPage(pageID, {});
     * }
     * }
     * else
     * {
     * // pagecaching is ok here, but requires a pagecache refresh if merchants start adding visibility rules to the page
     * }
     * ...
     * @see isVisible
     */
    isVisible(): boolean;
}

export = Page;
