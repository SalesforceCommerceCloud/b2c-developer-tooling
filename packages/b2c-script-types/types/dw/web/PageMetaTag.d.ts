/**
 * Page meta tags are used in HTML documents to provide structured data about a web
 * page. They are usually part of the head section. Common tags are for example robots,
 * description or social tags like open graph (e.g. 'og:title'), or additionally
 * adding json-ld (JSON for linked data) and provides structured data that is easily crawlable.
 * 
 * Page meta tags can be obtained within:
 * 
 * - home page context
 * 
 * - dw.system.Site
 * 
 * - detail page context
 * 
 * - dw.catalog.Product
 * - dw.content.Content
 * 
 * - listing page context
 * 
 * - dw.catalog.ProductSearchModel
 * - dw.content.ContentSearchModel
 * 
 * and can be set at dw.web.PageMetaData container object, which is always available
 * in the pipeline dictionary and is used as transfer object to fill the head area with meaningful
 * page meta tag elements.
 */
declare class PageMetaTag {
    /**
     * Returns the page meta tag ID.
     */
    readonly ID: string;
    /**
     * Returns the page meta tag content.
     */
    readonly content: string;
    /**
     * Returns true if the page meta tag type is json-ld (JSON for linked data) and provides
     * structured data about the page for crawlers, false otherwise.
     */
    readonly jsonLd: boolean;
    /**
     * Returns true if the page meta tag type is name, false otherwise.
     */
    readonly name: boolean;
    /**
     * Returns true if the page meta tag type is property, false otherwise.
     */
    readonly property: boolean;
    /**
     * Returns true if the page meta tag type is title, false otherwise.
     */
    readonly title: boolean;
    private constructor();
    /**
     * Returns the page meta tag content.
     */
    getContent(): string;
    /**
     * Returns the page meta tag ID.
     */
    getID(): string;
    /**
     * Returns true if the page meta tag type is json-ld (JSON for linked data) and provides
     * structured data about the page for crawlers, false otherwise.
     */
    isJsonLd(): boolean;
    /**
     * Returns true if the page meta tag type is name, false otherwise.
     */
    isName(): boolean;
    /**
     * Returns true if the page meta tag type is property, false otherwise.
     */
    isProperty(): boolean;
    /**
     * Returns true if the page meta tag type is title, false otherwise.
     */
    isTitle(): boolean;
}

export = PageMetaTag;
