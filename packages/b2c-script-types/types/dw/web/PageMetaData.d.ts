import PageMetaTag = require('./PageMetaTag');

/**
 * Contains meta data about the page.
 * 
 * For each request an instance of this class will be placed in the pipeline
 * dictionary under the key "CurrentPageMetaData".
 * The information stored in CurrentPageMetaData can be referenced in templates
 * and rendered in an HTML head section:
 * for example:
 * 
 * ```
 * `
 * <head>
 * <title>${pdict.CurrentPageMetaData.title}</title>
 * <meta name="description" content="${pdict.CurrentPageMetaData.description}"/>
 * .
 * .
 * .
 * </head>
 * `
 * ```
 * 
 * To update the CurrentPageMetaData there is the pipelet UpdatePageMetaData
 * provided.
 */
declare class PageMetaData {
    /**
     * Returns the page's description.
     */
    description: string;
    /**
     * Returns the page's key words.
     */
    keywords: string;
    /**
     * Returns all page meta tags added to this container.
     */
    readonly pageMetaTags: Array<PageMetaTag>;
    /**
     * Returns the page's title.
     */
    title: string;
    private constructor();
    /**
     * Adds a page meta tag to this container.
     */
    addPageMetaTag(pageMetaTag: PageMetaTag): void;
    /**
     * Adds a page meta tags list to this container.
     */
    addPageMetaTags(pageMetaTags: Array<PageMetaTag>): void;
    /**
     * Returns the page's description.
     */
    getDescription(): string;
    /**
     * Returns the page's key words.
     */
    getKeywords(): string;
    /**
     * Returns all page meta tags added to this container.
     */
    getPageMetaTags(): Array<PageMetaTag>;
    /**
     * Returns the page's title.
     */
    getTitle(): string;
    /**
     * Returns true if a page meta tag with the given ID is set, false otherwise.
     */
    isPageMetaTagSet(id: string): boolean;
    /**
     * Sets the page's description.
     */
    setDescription(description: string): void;
    /**
     * Sets the page's key words.
     */
    setKeywords(keywords: string): void;
    /**
     * Sets the page's title.
     */
    setTitle(title: string): void;
}

export = PageMetaData;
