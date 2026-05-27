import Quantity = require('../value/Quantity');
import Money = require('../value/Money');
import ProductPriceInfo = require('./ProductPriceInfo');
import Collection = require('../util/Collection');
import ProductPriceTable = require('./ProductPriceTable');

/**
 * ProductPriceModel provides methods to access all the
 * dw.catalog.PriceBook information of a product. A ProductPriceModel
 * instance is retrieved by calling dw.catalog.Product.getPriceModel
 * or dw.catalog.Product.getPriceModel for a
 * specific product. The latter method will return a model which also includes
 * the additional option prices of an option product.
 * 
 * When the current price of a product is accessed in the storefront via its
 * price model, a price lookup is performed. The high-level steps of this price
 * lookup are:
 * 
 * - Get all price books applicable in the context of the current site, time,
 * session, customer, source code.
 * - Identify all prices in the applicable price books and for a requested
 * quantity.
 * - Calculate the best-price of all identified prices. The best-price is the
 * lowest price.
 * 
 * In more detail:
 * 
 * Identify applicable price books
 * 
 * - If any price books are explicitly registered in the session (see pipelet
 * SetApplicablePriceBooks), use these price books and their direct parents for
 * price lookup. Ignore all inactive price books, price books not valid at the
 * current time, and price books with a currency other than the session currency.
 * 
 * Otherwise:
 * 
 * - If a valid source code is registered with the current session, get all
 * price books assigned to the source code and their parent price books. Ignore
 * all inactive price books, price books not valid at the current time, and
 * price books with a currency other than the session currency.
 * - Get all price books assigned to site and their parent price books. Ignore
 * all inactive price books, price books not valid at the current time, and
 * price books with a currency other than the session currency.
 * 
 * Identify all prices:
 * 
 * - Get all price definitions for the product from all applicable price
 * books. Ignore price definitions not valid at the current time.
 * - Convert any percentage price definition into a monetary amount. As the
 * base price for this calculation, the minimum product price for the minimum
 * order quantity of the product, including product options, is used.
 * - Compare all prices and identify the lowest (= best) price.
 * - Calculate best price for each defined price cut in the price table and
 * return price table.
 * 
 * Variation Price Fallback:
 * 
 * - If no applicable pricebooks for a variant is found, the price lookup gets
 * the price books from the variant's master product
 * - A price books is also not applicable of the price definition for the
 * variant in the price book is not valid at the current time.
 * 
 * Typically, in order to do a standard price lookup, it is only necessary to
 * call `Product.getPriceModel().getPrice()`. However, Commerce Cloud
 * Digital also supports tiered prices, meaning that higher quantities receive
 * a lower price. In this case, the merchant typically wants to display a table
 * of price points on product detail pages. Therefore, the ProductPriceModel
 * provides the method getPriceTable to retrieve a table of these prices.
 * 
 * If a merchant wants to know not only what the price of a given product is,
 * but what price book the price was derived from, this class provides the
 * method getPriceInfo. This class also provides methods to lookup
 * product prices in specific price books by name and quantity. See
 * getPriceBookPrice.
 */
declare class ProductPriceModel {
    /**
     * Returns the quantity for which the base price is defined. This
     * is typically 1.0.
     */
    readonly basePriceQuantity: Quantity;
    /**
     * Calculates and returns the maximum price-book price of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPrice.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * Warning:  If the product represented by this model is a master
     * product with numerous variants, this method can be very expensive and
     * should be avoided.
     */
    readonly maxPrice: Money;
    /**
     * Calculates and returns the maximum price-book price per unit of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPricePerUnit.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * e.g.
     * suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
     * v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
     * The max price per unit of mp will be max($6/2, $5/5, $10/20) = $3
     */
    readonly maxPricePerUnit: Money;
    /**
     * Calculates and returns the minimum price-book price of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPrice.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * Warning:  If the product represented by this model is a master
     * product with numerous variants, this method can be very expensive and
     * should be avoided.
     */
    readonly minPrice: Money;
    /**
     * Calculates and returns the minimum price-book price per unit of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPricePerUnit.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * e.g.
     * suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
     * v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
     * The min price per unit of mp will be min($6/2, $5/5, $10/20) = $0.5
     */
    readonly minPricePerUnit: Money;
    /**
     * Returns the active price of a product, calculated based on base price quantity
     * 1.00. The price is returned for the currency of the current session.
     * 
     * The price lookup is based on the configuration of price books. It depends
     * on various settings, such as which price books are active, or explicitly
     * set as applicable in the current session.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * If no price could be found, MONEY.NOT_AVAILABLE is returned.
     */
    readonly price: Money;
    /**
     * Returns the active price info of a product, calculated based on base price
     * quantity 1.00. The price is returned for the currency of the current
     * session.
     * 
     * This method is similar to `getPrice()` but instead of just
     * returning the price value, it returns a `ProductPriceInfo`
     * which contains additional information such as the PriceBook which defined
     * the price and the percentage discount this price point represents.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * If no price info could be found, null is returned.
     * @see getPrice
     * @see getPriceInfo
     */
    readonly priceInfo: ProductPriceInfo | null;
    /**
     * Returns all the eligible `</>ProductPriceInfo`</>(s), calculated based
     * on base price quantity 1.00. This will return an empty list if getPriceInfo() would return null, and if there is
     * only one price info in the collection it will be the same price info as getPriceInfo(). Two or more price infos
     * indicate that there are that many price books that meet the criteria for returning the price shown in the
     * storefront.
     * @see getPriceInfo
     */
    readonly priceInfos: Collection<ProductPriceInfo>;
    /**
     * Returns the sales price per unit of a product, calculated based on base price
     * quantity 1.00.
     * 
     * The product sales price per unit is returned for the current session currency.
     * Hence, the using this method is only useful in storefront processes.
     * 
     * The price lookup is based on the configuration of price books. It depends
     * on various settings, such as which price books are active, or explicitly
     * set as applicable in the current session.
     * 
     * If no price could be found, MONEY.N_A is returned.
     */
    readonly pricePerUnit: Money;
    /**
     * Returns true if this product is a master product (or product set) and the
     * collection of online variants (or set products respectively) contains
     * products of different prices.
     * 
     * Warning:  If the product represented by this model is a master
     * product with numerous variants, this method can be very expensive and
     * should be avoided.
     */
    readonly priceRange: boolean;
    /**
     * Returns the product price table object. The price table represents a map
     * between order quantities and prices, and also provides % off information
     * to be shown to storefront customers. The price is returned for the
     * currency of the current session.
     * 
     * Usually, the product price table is printed on product detail pages in
     * the storefront.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * All other methods of this class are based on the information in the
     * product price table.
     */
    readonly priceTable: ProductPriceTable;
    private constructor();
    /**
     * Returns the quantity for which the base price is defined. This
     * is typically 1.0.
     */
    getBasePriceQuantity(): Quantity;
    /**
     * Calculates and returns the maximum price-book price of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPrice.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * Warning:  If the product represented by this model is a master
     * product with numerous variants, this method can be very expensive and
     * should be avoided.
     */
    getMaxPrice(): Money;
    /**
     * Calculates and returns the maximum price in a given price book of all
     * variants (for master products) or set-products (for product sets) for
     * base quantity 1.00. This value can be used to display a range of prices
     * in storefront.
     * 
     * This method follows the same rules as
     * getPriceBookPrice in determining the price book
     * price for each variant or set-product. If the product represented by this
     * model is not a master product or product set, then this method behaves
     * the same as getPriceBookPrice.
     */
    getMaxPriceBookPrice(priceBookID: string): Money;
    /**
     * Calculates and returns the maximum price per unit in a given price book of all
     * variants (for master products) or set-products (for product sets) for
     * base quantity 1.00. This value can be used to display a range of price per units
     * in storefront.
     * 
     * This method follows the same rules as
     * getPriceBookPricePerUnit in determining the price book
     * price for each variant or set-product. If the product represented by this
     * model is not a master product or product set, then this method behaves
     * the same as getPriceBookPricePerUnit.
     */
    getMaxPriceBookPricePerUnit(priceBookID: string): Money;
    /**
     * Calculates and returns the maximum price-book price per unit of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPricePerUnit.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * e.g.
     * suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
     * v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
     * The max price per unit of mp will be max($6/2, $5/5, $10/20) = $3
     */
    getMaxPricePerUnit(): Money;
    /**
     * Calculates and returns the minimum price-book price of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPrice.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * Warning:  If the product represented by this model is a master
     * product with numerous variants, this method can be very expensive and
     * should be avoided.
     */
    getMinPrice(): Money;
    /**
     * Calculates and returns the minimum price in a given price book of all
     * variants (for master products) or set-products (for product sets) for
     * base quantity 1.00. This value can be used to display a range of prices
     * in storefront.
     * 
     * This method follows the same rules as
     * getPriceBookPrice in determining the price book
     * price for each variant or set-product. If the product represented by this
     * model is not a master product or product set, then this method behaves
     * the same as getPriceBookPrice.
     */
    getMinPriceBookPrice(priceBookID: string): Money;
    /**
     * Calculates and returns the minimum price per unit in a given price book of all
     * variants (for master products) or set-products (for product sets) for
     * base quantity 1.00. This value can be used to display a range of price per units
     * in storefront.
     * 
     * This method follows the same rules as
     * getPriceBookPricePerUnit in determining the price book
     * price for each variant or set-product. If the product represented by this
     * model is not a master product or product set, then this method behaves
     * the same as getPriceBookPricePerUnit.
     */
    getMinPriceBookPricePerUnit(priceBookID: string): Money;
    /**
     * Calculates and returns the minimum price-book price per unit of all variants (for
     * master products) or set-products (for product sets) for base quantity
     * 1.00. This value can be used to display a range of prices in storefront.
     * If the product represented by this model is not a master product or
     * product set, then this method behaves the same as getPricePerUnit.
     * Only online products are considered. If the "orderable products only"
     * search preference is enabled for the current site, then only orderable
     * products are considered. For master products, only variants with all
     * variation attributes configured are considered.
     * 
     * e.g.
     * suppose one master product mp (price = $6, unitQuantity = 2), it has 2 variants:
     * v1(price = $5, unitQuantity = 5), v2(price = $10, unitQuantity = 20).
     * The min price per unit of mp will be min($6/2, $5/5, $10/20) = $0.5
     */
    getMinPricePerUnit(): Money;
    /**
     * Returns the active price of a product, calculated based on base price quantity
     * 1.00. The price is returned for the currency of the current session.
     * 
     * The price lookup is based on the configuration of price books. It depends
     * on various settings, such as which price books are active, or explicitly
     * set as applicable in the current session.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * If no price could be found, MONEY.NOT_AVAILABLE is returned.
     */
    getPrice(): Money;
    /**
     * Returns the active price of a product, calculated based on the passed order
     * quantity. The price is returned for the currency of the current session.
     * 
     * The price lookup is based on the configuration of price books. It depends
     * on various settings, such as which price books are active, or explicitly
     * set as applicable in the current session.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * If passed order quantity < 1 (and greater than zero), price for quantity
     * 1 is returned.
     * 
     * If no price could be found, MONEY.NOT_AVAILABLE is returned.
     */
    getPrice(quantity: Quantity): Money;
    /**
     * Returns the active price of the product in the specified price book for
     * quantity 1.00.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * Money.NOT_AVAILABLE will be returned in any of the following cases:
     * 
     * - priceBookID is null or does not identify a valid price book.
     * - The price book has no price for the product.
     * - None of the prices for the product in the price book is currently
     * active.
     * - The currently active price entry is a percentage.
     */
    getPriceBookPrice(priceBookID: string): Money | null;
    /**
     * Returns the active price of the product in the specified price book for
     * the specified quantity.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * Money.NOT_AVAILABLE will be returned in any of the following cases:
     * 
     * - priceBookID is null or does not identify a valid price book.
     * - quantity is null.
     * - The price book has no price for the product.
     * - None of the prices for the product in the price book is currently
     * active.
     * - The currently active price entry is a percentage.
     */
    getPriceBookPrice(priceBookID: string, quantity: Quantity): Money | null;
    /**
     * This method acts similarly to getPriceBookPrice but
     * returns a ProductPriceInfo object wrapping the actual price with
     * additional information.
     */
    getPriceBookPriceInfo(priceBookID: string): ProductPriceInfo | null;
    /**
     * This method acts similarly to
     * getPriceBookPrice but returns a
     * ProductPriceInfo object wrapping the actual price with additional
     * information.
     */
    getPriceBookPriceInfo(priceBookID: string, quantity: Quantity): ProductPriceInfo | null;
    /**
     * Returns the active price per unit of the product in the specified price book for
     * quantity 1.00.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * Money.NOT_AVAILABLE will be returned in any of the following cases:
     * 
     * - The priceBookID does not identify a valid price book.
     * - The price book has no price for the product.
     * - None of the prices for the product in the price book is currently
     * active.
     * - The currently active price entry is a percentage.
     */
    getPriceBookPricePerUnit(priceBookID: string): Money;
    /**
     * Returns the active price per unit of the product in the specified price book for
     * the specified quantity.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * Money.NOT_AVAILABLE will be returned in any of the following cases:
     * 
     * - The priceBookID does not identify a valid price book.
     * - The price book has no price for the product.
     * - None of the prices for the product in the price book is currently
     * active.
     * - The currently active price entry is a percentage.
     */
    getPriceBookPricePerUnit(priceBookID: string, quantity: Quantity): Money;
    /**
     * Returns the active price info of a product, calculated based on base price
     * quantity 1.00. The price is returned for the currency of the current
     * session.
     * 
     * This method is similar to `getPrice()` but instead of just
     * returning the price value, it returns a `ProductPriceInfo`
     * which contains additional information such as the PriceBook which defined
     * the price and the percentage discount this price point represents.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * If no price info could be found, null is returned.
     * @see getPrice
     * @see getPriceInfo
     */
    getPriceInfo(): ProductPriceInfo | null;
    /**
     * Returns the active price info of a product, calculated based on the passed order
     * quantity. The price is returned for the currency of the current session.
     * 
     * This method is similar to `getPrice(Quantity)` but instead of
     * just returning the price value, it returns a
     * `ProductPriceInfo` which contains additional information such
     * as the PriceBook which defined the price and the percentage discount this
     * price point represents.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * If no price info could be found, null is returned.
     * @see getPrice
     */
    getPriceInfo(quantity: Quantity): ProductPriceInfo | null;
    /**
     * Returns all the eligible `</>ProductPriceInfo`</>(s), calculated based
     * on base price quantity 1.00. This will return an empty list if getPriceInfo() would return null, and if there is
     * only one price info in the collection it will be the same price info as getPriceInfo(). Two or more price infos
     * indicate that there are that many price books that meet the criteria for returning the price shown in the
     * storefront.
     * @see getPriceInfo
     */
    getPriceInfos(): Collection<ProductPriceInfo>;
    /**
     * Returns the sales price per unit of a product, calculated based on base price
     * quantity 1.00.
     * 
     * The product sales price per unit is returned for the current session currency.
     * Hence, the using this method is only useful in storefront processes.
     * 
     * The price lookup is based on the configuration of price books. It depends
     * on various settings, such as which price books are active, or explicitly
     * set as applicable in the current session.
     * 
     * If no price could be found, MONEY.N_A is returned.
     */
    getPricePerUnit(): Money;
    /**
     * Returns the sales price per unit of a product, calculated based on the passed
     * order quantity.
     * 
     * The product sales price per unit is returned for the current session currency.
     * Hence, the using this method is only useful in storefront processes.
     * 
     * The price lookup is based on the configuration of price books. It depends
     * on various settings, such as which price books are active, or explicitely
     * set as applicable in the current session.
     * 
     * If no price could be found, MONEY.N_A is returned.
     */
    getPricePerUnit(quantity: Quantity): Money;
    /**
     * Calculates and returns the percentage off amount of the passed
     * comparePrice to the passed basePrice.
     * @deprecated Use dw.value.Money.percentLessThan
     */
    getPricePercentage(basePrice: Money, comparePrice: Money): number;
    /**
     * Returns the product price table object. The price table represents a map
     * between order quantities and prices, and also provides % off information
     * to be shown to storefront customers. The price is returned for the
     * currency of the current session.
     * 
     * Usually, the product price table is printed on product detail pages in
     * the storefront.
     * 
     * If the product represented by this model is an option product, option
     * prices will be added to the price book price if the price model was
     * initialized with an option model.
     * 
     * All other methods of this class are based on the information in the
     * product price table.
     */
    getPriceTable(): ProductPriceTable;
    /**
     * Returns true if this product is a master product (or product set) and the
     * collection of online variants (or set products respectively) contains
     * products of different prices.
     * 
     * Warning:  If the product represented by this model is a master
     * product with numerous variants, this method can be very expensive and
     * should be avoided.
     */
    isPriceRange(): boolean;
    /**
     * Returns true if this product is a master product (or product set) and the
     * collection of online variants (or set products respectively) contains
     * products of different prices in the specified price book.
     */
    isPriceRange(priceBookID: string): boolean;
}

export = ProductPriceModel;
