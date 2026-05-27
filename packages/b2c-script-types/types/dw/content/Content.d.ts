import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Page = require('../experience/Page');
import Collection = require('../util/Collection');
import Folder = require('./Folder');
import PageMetaTag = require('../web/PageMetaTag');

declare global {
    module ICustomAttributes {
        interface Content extends CustomAttributes {
        }
    }
}

/**
 * Class representing a Content asset in Commerce Cloud Digital.
 */
declare class Content extends ExtensibleObject<ICustomAttributes.Content> {
    /**
     * Returns the ID of the content asset.
     */
    readonly ID: string;
    /**
     * Returns the Folder associated with this Content. The folder is
     * used to determine the classification of the content.
     */
    readonly classificationFolder: Folder;
    /**
     * Returns the description in the current locale or null.
     */
    readonly description: string | null;
    /**
     * Returns all folders to which this content is assigned.
     */
    readonly folders: Collection<Folder>;
    /**
     * Returns the name of the content asset.
     */
    readonly name: string;
    /**
     * Returns the online status of the content.
     */
    readonly online: boolean;
    /**
     * Returns the online status flag of the content.
     */
    readonly onlineFlag: boolean;
    /**
     * Returns if the content is a dw.experience.Page or not.
     */
    readonly page: boolean;
    /**
     * Returns the page description for the content in the current locale
     * or null if there is no page description.
     */
    readonly pageDescription: string | null;
    /**
     * Returns the page keywords for the content in the current locale
     * or null if there is no page title.
     */
    readonly pageKeywords: string | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the content detail page meta tag context and rules.
     * The rules are obtained from the current content or inherited from the default folder,
     * up to the root folder.
     */
    readonly pageMetaTags: Array<PageMetaTag>;
    /**
     * Returns the page title for the content in the current locale
     * or null if there is no page title.
     */
    readonly pageTitle: string | null;
    /**
     * Returns the page URL for the content in the current locale
     * or null if there is no page URL.
     */
    readonly pageURL: string | null;
    /**
     * Returns the search status of the content.
     */
    readonly searchable: boolean;
    /**
     * Returns the online status flag of the content.
     */
    readonly searchableFlag: boolean;
    /**
     * Returns the contents change frequency needed for the sitemap creation.
     */
    readonly siteMapChangeFrequency: string;
    /**
     * Returns the status if the content is included into the sitemap.
     */
    readonly siteMapIncluded: number;
    /**
     * Returns the contents priority needed for the sitemap creation.
     * If no priority is defined, the method returns 0.0.
     */
    readonly siteMapPriority: number;
    /**
     * Returns the value of attribute 'template'.
     */
    readonly template: string;
    private constructor();
    /**
     * Returns the Folder associated with this Content. The folder is
     * used to determine the classification of the content.
     */
    getClassificationFolder(): Folder;
    /**
     * Returns the description in the current locale or null.
     */
    getDescription(): string | null;
    /**
     * Returns all folders to which this content is assigned.
     */
    getFolders(): Collection<Folder>;
    /**
     * Returns the ID of the content asset.
     */
    getID(): string;
    /**
     * Returns the name of the content asset.
     */
    getName(): string;
    /**
     * Returns the online status flag of the content.
     */
    getOnlineFlag(): boolean;
    /**
     * Returns the page description for the content in the current locale
     * or null if there is no page description.
     */
    getPageDescription(): string | null;
    /**
     * Returns the page keywords for the content in the current locale
     * or null if there is no page title.
     */
    getPageKeywords(): string | null;
    /**
     * Returns the page meta tag for the specified id.
     * 
     * The meta tag content is generated based on the content detail page meta tag context and rule.
     * The rule is obtained from the current content or inherited from the default folder,
     * up to the root folder.
     * 
     * Null will be returned if the meta tag is undefined on the current instance, or if no rule can be found for the
     * current context, or if the rule resolves to an empty string.
     */
    getPageMetaTag(id: string): PageMetaTag | null;
    /**
     * Returns all page meta tags, defined for this instance for which content can be generated.
     * 
     * The meta tag content is generated based on the content detail page meta tag context and rules.
     * The rules are obtained from the current content or inherited from the default folder,
     * up to the root folder.
     */
    getPageMetaTags(): Array<PageMetaTag>;
    /**
     * Returns the page title for the content in the current locale
     * or null if there is no page title.
     */
    getPageTitle(): string | null;
    /**
     * Returns the page URL for the content in the current locale
     * or null if there is no page URL.
     */
    getPageURL(): string | null;
    /**
     * Returns the online status flag of the content.
     */
    getSearchableFlag(): boolean;
    /**
     * Returns the contents change frequency needed for the sitemap creation.
     */
    getSiteMapChangeFrequency(): string;
    /**
     * Returns the status if the content is included into the sitemap.
     */
    getSiteMapIncluded(): number;
    /**
     * Returns the contents priority needed for the sitemap creation.
     * If no priority is defined, the method returns 0.0.
     */
    getSiteMapPriority(): number;
    /**
     * Returns the value of attribute 'template'.
     */
    getTemplate(): string;
    /**
     * Returns the online status of the content.
     */
    isOnline(): boolean;
    /**
     * Returns if the content is a dw.experience.Page or not.
     */
    isPage(): boolean;
    /**
     * Returns the search status of the content.
     */
    isSearchable(): boolean;
    /**
     * Converts the content into the dw.experience.Page representation if isPage yields true.
     * @see dw.experience.PageMgr.getPage
     */
    toPage(): Page | null;
}

export = Content;
