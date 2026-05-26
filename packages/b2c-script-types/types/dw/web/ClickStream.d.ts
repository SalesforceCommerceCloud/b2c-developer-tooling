import ClickStreamEntry = require('./ClickStreamEntry');
import List = require('../util/List');

/**
 * Represents the click stream in the session. A maximum number of 50 clicks is
 * recorded per session. After the maximum is reached, each time the customer
 * clicks on a new link, the oldest click stream entry is purged. The
 * ClickStream always remembers the first click.
 * 
 * The click stream is consulted when the GetLastVisitedProducts pipelet is
 * called to retrieve the products that the customer has recently visited.
 */
declare class ClickStream {
    /**
     * Returns a collection with all clicks. The first entry is the oldest
     * entry. The last entry is the latest entry. The method returns a copy of
     * the click stream, which makes it safe to work with the click stream,
     * while it might be modified.
     */
    readonly clicks: List<ClickStreamEntry>;
    /**
     * Identifies if the clickstream recording is enabled or not.
     * It is considered enabled if either:
     * - the method dw.system.Session.isTrackingAllowed returns true
     * - or if the above method returns false but the preference 'ClickstreamHonorDNT' is set to false.
     * 
     * When clickstream tracking is not enabled the getFirst method still operates as expected
     * but the rest of the clicks are not collected.
     */
    readonly enabled: boolean;
    /**
     * Returns the first click within this session. This first click
     * is stored independent of whether entries are purged.
     */
    readonly first: ClickStreamEntry;
    /**
     * Returns the last recorded click stream, which is also typically
     * the current click. In where rare cases (e.g. RedirectURL pipeline) this
     * is not the current click, but instead the last recorded click.
     */
    readonly last: ClickStreamEntry;
    /**
     * Identifies if this is only a partial click stream. If the maximum number
     * of clicks (50) is recorded, the oldest entry is automatically purged with
     * each additional click. In this case, this flag indicates that the click
     * stream is only partial.
     */
    readonly partial: boolean;
    private constructor();
    /**
     * Returns a collection with all clicks. The first entry is the oldest
     * entry. The last entry is the latest entry. The method returns a copy of
     * the click stream, which makes it safe to work with the click stream,
     * while it might be modified.
     */
    getClicks(): List<ClickStreamEntry>;
    /**
     * Returns the first click within this session. This first click
     * is stored independent of whether entries are purged.
     */
    getFirst(): ClickStreamEntry;
    /**
     * Returns the last recorded click stream, which is also typically
     * the current click. In where rare cases (e.g. RedirectURL pipeline) this
     * is not the current click, but instead the last recorded click.
     */
    getLast(): ClickStreamEntry;
    /**
     * Identifies if the clickstream recording is enabled or not.
     * It is considered enabled if either:
     * - the method dw.system.Session.isTrackingAllowed returns true
     * - or if the above method returns false but the preference 'ClickstreamHonorDNT' is set to false.
     * 
     * When clickstream tracking is not enabled the getFirst method still operates as expected
     * but the rest of the clicks are not collected.
     */
    isEnabled(): boolean;
    /**
     * Identifies if this is only a partial click stream. If the maximum number
     * of clicks (50) is recorded, the oldest entry is automatically purged with
     * each additional click. In this case, this flag indicates that the click
     * stream is only partial.
     */
    isPartial(): boolean;
}

export = ClickStream;
