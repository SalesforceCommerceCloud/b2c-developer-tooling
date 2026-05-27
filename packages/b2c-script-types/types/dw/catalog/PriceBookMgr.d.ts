import Collection = require('../util/Collection');
import PriceBook = require('./PriceBook');

/**
 * Price book manager provides methods to access price books.
 */
declare class PriceBookMgr {
    /**
     * Returns all price books defined for the organization.
     */
    static readonly allPriceBooks: Collection<PriceBook>;
    /**
     * Returns a collection of price books that are set in the user session.
     */
    static applicablePriceBooks: Collection<PriceBook>;
    /**
     * Returns all price books assigned to the current site.
     * 
     * Please note that this doesn't include parent price books not assigned to the site, but considered by the price
     * lookup.
     */
    static readonly sitePriceBooks: Collection<PriceBook>;
    private constructor();
    /**
     * Assign a price book to a site. This requires a transaction, see dw.system.Transaction.wrap
     */
    static assignPriceBookToSite(priceBook: PriceBook, siteId: string): boolean;
    /**
     * Returns all price books defined for the organization.
     */
    static getAllPriceBooks(): Collection<PriceBook>;
    /**
     * Returns a collection of price books that are set in the user session.
     */
    static getApplicablePriceBooks(): Collection<PriceBook>;
    /**
     * Returns the price book of the current organization matching the specified ID.
     */
    static getPriceBook(priceBookID: string): PriceBook | null;
    /**
     * Returns all price books assigned to the current site.
     * 
     * Please note that this doesn't include parent price books not assigned to the site, but considered by the price
     * lookup.
     */
    static getSitePriceBooks(): Collection<PriceBook>;
    /**
     * Sets one or more price books to be considered by the product price lookup. The information is stored in the user
     * session. If no price book is set in the user session, all active and valid price books assigned to the site are
     * used for the price lookup. If price books are set, only those price books are considered by the price lookup.
     * Note that the system does not assure that a price book set by this API is assigned to the current site.
     */
    static setApplicablePriceBooks(...priceBooks: PriceBook[]): void;
    /**
     * Unassign a price book from all sites. This requires a transaction, see
     * dw.system.Transaction.wrap
     */
    static unassignPriceBookFromAllSites(priceBook: PriceBook): boolean;
    /**
     * Unassign a price book from a site. This requires a transaction, see
     * dw.system.Transaction.wrap
     */
    static unassignPriceBookFromSite(priceBook: PriceBook, siteId: string): boolean;
}

export = PriceBookMgr;
