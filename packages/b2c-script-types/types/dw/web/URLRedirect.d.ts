/**
 * Represents a URLRedirect in Commerce Cloud Digital.
 */
declare class URLRedirect {
    /**
     * Returns the URL which was calculated to be the redirect URL.
     * The Location parameter can be directly used as value for an redirect location.
     */
    readonly location: string;
    /**
     * Returns the corresponding status code for the redirect location.
     */
    readonly status: number;
    private constructor();
    /**
     * Returns the URL which was calculated to be the redirect URL.
     * The Location parameter can be directly used as value for an redirect location.
     */
    getLocation(): string;
    /**
     * Returns the corresponding status code for the redirect location.
     */
    getStatus(): number;
}

export = URLRedirect;
