/**
 * Represent an entry in the click stream.
 */
declare class ClickStreamEntry {
    /**
     * Returns the host.
     */
    readonly host: string;
    /**
     * Returns the locale sent from the user agent.
     */
    readonly locale: string;
    /**
     * Returns the path.
     */
    readonly path: string;
    /**
     * Returns the name of the called pipeline. In most cases the
     * name can be derived from the path, but not in all cases. If with
     * URL rewritting a special landing page is defined for a DNS name, than
     * the system internally might use a specific pipeline associated with
     * this landing page.
     */
    readonly pipelineName: string;
    /**
     * Returns the query string.
     */
    readonly queryString: string;
    /**
     * Returns the referer.
     */
    readonly referer: string;
    /**
     * Returns the remote address.
     */
    readonly remoteAddress: string;
    /**
     * Returns the entry's timestamp.
     */
    readonly timestamp: number;
    /**
     * Returns the full URL for this click. The URL is returned as relative
     * URL.
     */
    readonly url: string;
    /**
     * Returns the user agent.
     */
    readonly userAgent: string;
    private constructor();
    /**
     * Returns the host.
     */
    getHost(): string;
    /**
     * Returns the locale sent from the user agent.
     */
    getLocale(): string;
    /**
     * Returns a specific parameter value from the stored query
     * string. The method can be used to extract a source code or
     * affiliate id out of the URLs in the click stream.
     * 
     * The method returns null if there is no parameter with the given name.
     */
    getParameter(name: string): string | null;
    /**
     * Returns the path.
     */
    getPath(): string;
    /**
     * Returns the name of the called pipeline. In most cases the
     * name can be derived from the path, but not in all cases. If with
     * URL rewritting a special landing page is defined for a DNS name, than
     * the system internally might use a specific pipeline associated with
     * this landing page.
     */
    getPipelineName(): string;
    /**
     * Returns the query string.
     */
    getQueryString(): string;
    /**
     * Returns the referer.
     */
    getReferer(): string;
    /**
     * Returns the remote address.
     */
    getRemoteAddress(): string;
    /**
     * Returns the entry's timestamp.
     */
    getTimestamp(): number;
    /**
     * Returns the full URL for this click. The URL is returned as relative
     * URL.
     */
    getUrl(): string;
    /**
     * Returns the user agent.
     */
    getUserAgent(): string;
}

export = ClickStreamEntry;
