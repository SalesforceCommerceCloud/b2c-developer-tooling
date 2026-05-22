import ObjectTypeDefinition = require('../object/ObjectTypeDefinition');
import Order = require('./Order');
import SeekableIterator = require('../util/SeekableIterator');
import utilMap = require('../util/Map');
import Status = require('../system/Status');
import Basket = require('./Basket');

/**
 * 
 * 
 * Provides static helper methods for managing orders.
 * 
 * Pipelet GetOrder and methods provided to access orders such as getOrder and
 * searchOrders can be limited by the site preference 'Limit Storefront Order
 * Access'. An insecure order access occurs in a storefront session when all of the following are true:
 * 
 * - The current storefront session isn’t the session in which the order was created.
 * - The session customer doesn’t match the order customer.
 * - The order status isn’t CREATED.
 * 
 * When an order is accessed in an insecure manner:
 * 
 * - If the preference is ACTIVE, the action is disallowed and a SecurityException with a message
 * beginning 'Unauthorized access to order' is thrown.
 * - If the preference is NOT ACTIVE, a SecurityException with a message beginning 'Unauthorized
 * access to order' is logged as an error.
 * 
 * In addition, the storefront should ensure the shopper is properly authenticated and authorized to read
 * or modify the content of an order object. For more information, see Access Control.
 * 
 * Don’t use dw.order.OrderMgr.searchOrder methods or processOrders
 * immediately after creating or updating an order. The order search index updates asynchronously, typically within seconds but occasionally longer depending on search service load, so it
 * might not include very recent changes. Instead, do one of the following:
 * 
 * - In the same request, pass the dw.order.Order object reference to the followup logic.
 * - For storefront use cases, especially when passing the order reference to a third party, use the
 * order token for security by using getOrder.
 * 
 * When implementing order history functionality, don't use the search or query methods in this class. Instead, use
 * dw.customer.OrderHistory.getOrders.
 */
declare class OrderMgr {
    private constructor();
    /**
     * 
     * 
     * This method cancels an order. Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
     * 
     * Setting of cancel code and cancel description can be done by calling
     * `Order.setCancelCode` and `Order.setCancelDescription`. *
     * If the order contains product or gift certificate line items associated with product list items, records of the
     * purchase of the product list items will be removed.
     * 
     * Inventory transactions and coupon redemptions associated with the order will be rolled back.
     * 
     * It is important to consider that this method will cancel orders with gift certificate line items.
     * 
     * If an order has any active post-processing objects (e.g. shipping orders, returns, appeasements), then it cannot
     * be cancelled directly. Its status is set automatically, based on the statuses of its post-processing objects. To
     * cancel such an order, you must cancel all related post-processing objects.
     * 
     * If your B2C Commerce instance is integrated with Order Management, then you manage order statuses in Order
     * Management. Use Order Management API endpoints.
     */
    static cancelOrder(order: Order): Status;
    /**
     * 
     * 
     * This method creates an order based on a basket. If successful, the new order will be in status
     * dw.order.Order.ORDER_STATUS_CREATED. The basket will be removed from the session and marked for removal.
     * 
     * This method throws an APIException with type 'CreateOrderException' if any of the following conditions are
     * encountered:
     * 
     * - any of the totals (net, gross, tax) of the basket is N/A
     * - any of the product items is not available (this takes previously reserved items into account)
     * - any campaign-based coupon in the basket is invalid (see dw.order.CouponLineItem.isValid
     * - the basket represents an order being edited, but the order has already been replaced by another order
     * - the basket represents an order being edited, but the customer associated with the original order is not the
     * same as the current customer
     * 
     * The method removes all empty shipments from the basket before creating the order. A shipment is said to be empty
     * if all of the following are true:
     * 
     * - it contains no product or gift certificate line items
     * - all total prices (net, gross, tax) are 0.0
     * 
     * This method decrements inventory for all products contained in the order. A previous call to
     * dw.order.Basket.reserveInventory is unnecessary and discouraged within the same request. The method
     * takes any items with reserved inventory into account, allowing an early reservation of items, e.g. at the
     * beginning of the checkout process. As described above, an APIException is thrown if any item is not available.
     * 
     * If the basket contains product or gift certificate line items associated with product list items, the method
     * updates the purchased quantity of the product list items; see
     * dw.customer.ProductListItem.getPurchasedQuantity.
     * 
     * The system generates an order number via hook dw.order.hooks.OrderHooks.createOrderNo. If no hook is
     * registered for the endpoint, the number is generated by calling createOrderSequenceNo. The format of
     * the number is based on the Order Number scheme defined in the Sequence Numbers preference configured for the site
     * or organization. The number is guaranteed to be unique, but is not guaranteed to be sequential. It can be higher
     * or lower than a previously created number. As a result, sorting orders by order number is not guaranteed to sort
     * them in their order of creation.
     * 
     * This method must not be used with the ReserveInventoryForOrder pipelet or
     * dw.order.Basket.reserveInventory in the same request.
     * 
     * When an order is created, search results don't include it until the next asynchronous update of the order search
     * index. See dw.order.OrderMgr.
     * 
     * Please note that this method might result in an order with a different customer ID than the originating
     * registered customer attached to the session. This happens if a registered customer logs in with the "RememberMe"
     * flag set to `true`, but is later logged out (either explicitly, or automatically via session
     * expiration) before calling this method. This is due to the internal order creation logic, which creates a new
     * guest customer and attaches it to the order in such cases. To avoid this situation, have your custom code verify
     * that the customer is authenticated before it calls this method.
     * 
     * Usage:
     * @example
     * var basket : Basket; // known
     * try
     * {
     * var order : Order = OrderMgr.createOrder(basket);
     * }
     * catch (e if e instanceof APIException && e.type === 'CreateOrderException')
     * {
     * // handle e
     * }
     * @throws dw.order.CreateOrderException indicates the order could not be created
     */
    static createOrder(basket: Basket): Order;
    /**
     * 
     * 
     * This method functions the same as createOrder, but allows the optional specification of
     * an `orderNo`. The `orderNo` must be unique within the context of a site.
     * 
     * If the `orderNo` is not specified, the behavior is the same as that of
     * createOrder. In that case, the system generates an order number via hook
     * dw.order.hooks.OrderHooks.createOrderNo. If no hook is registered for the endpoint, the number is
     * generated by calling createOrderSequenceNo. The format of the number is based on the Order Number
     * scheme defined in the Sequence Numbers preference configured for the site or organization. The number is
     * guaranteed to be unique, but is not guaranteed to be sequential. It can be higher or lower than a previously
     * created number. As a result, sorting orders by order number is not guaranteed to sort them in their order of
     * creation.
     * 
     * This method must not be used with the ReserveInventoryForOrder pipelet or
     * dw.order.Basket.reserveInventory in the same request.
     * 
     * When an order is created, search results don't include it until the next asynchronous update of the order search
     * index. See dw.order.OrderMgr.
     * 
     * Please note that this method might result in an order with a different customer ID than the originating
     * registered customer attached to the session. This happens if a registered customer logs in with the "RememberMe"
     * flag set to `true`, but is later logged out (either explicitly, or automatically via session
     * expiration) before calling this method. This is due to the internal order creation logic, which creates a new
     * guest customer and attaches it to the order in such cases. To avoid this situation, have your custom code verify
     * that the customer is authenticated before it calls this method.
     * 
     * Usage:
     * @example
     * var basket : Basket; // known
     * var orderNo : String; // known
     * try
     * {
     * var order : Order = OrderMgr.createOrder(basket, orderNo);
     * }
     * catch (e if e instanceof APIException && e.type === 'CreateOrderException')
     * {
     * // handle e
     * }
     * @throws dw.order.CreateOrderException indicates the order could not be created
     */
    static createOrder(basket: Basket, orderNo: string): Order;
    /**
     * 
     * 
     * Creates an order number.
     * 
     * The order number is created via hook dw.order.hooks.OrderHooks.createOrderNo. If no hook is registered
     * for the endpoint, the number is generated by calling createOrderSequenceNo. The format of the number
     * is based on the Order Number scheme defined in the Sequence Numbers preference configured for the site or
     * organization.
     * 
     * The number is guaranteed to be unique, but is not guaranteed to be sequential. It can be higher or lower than a
     * previously created number. As a result, sorting orders by order number is not guaranteed to sort them in their
     * order of creation.
     * @throws CreateException if order number creation failed
     */
    static createOrderNo(): string;
    /**
     * 
     * 
     * Creates an order number.
     * 
     * The format of the number is based on the Order Number scheme defined in the Sequence Numbers preference
     * configured for the site or organization.
     * 
     * The number is guaranteed to be unique, but is not guaranteed to be sequential. It can be higher or lower than a
     * previously created number. As a result, sorting orders by order number is not guaranteed to sort them in their
     * order of creation.
     * @throws CreateException if order number creation failed
     */
    static createOrderSequenceNo(): string;
    /**
     * 
     * 
     * Triggers the shipping order creation for an order.
     * 
     * Must be run outside of a transaction. Will call hooks of the shipping order creation process, which are:
     * 
     * - dw.order.hooks.ShippingOrderHooks.extensionPointPrepareCreateShippingOrders
     * - dw.order.hooks.ShippingOrderHooks.extensionPointCreateShippingOrders
     * - dw.order.hooks.ShippingOrderHooks.extensionPointAfterStatusChange
     * - dw.order.hooks.ShippingOrderHooks.extensionPointNotifyStatusChange
     * 
     * As a result, zero, one, or multiple dw.order.ShippingOrders are created.
     * 
     * Order post-processing APIs (gillian) are now inactive by default and will throw an exception if accessed.
     * Activation needs preliminary approval by Product Management. Please contact support in this case. Existing
     * customers using these APIs are not affected by this change and can use the APIs until further notice.
     */
    static createShippingOrders(order: Order): Status;
    /**
     * 
     * 
     * Returns the meta data for Orders.
     */
    static describeOrder(): ObjectTypeDefinition;
    /**
     * 
     * 
     * This method fails an unplaced order and is usually called if payment could not be authorized. The specified Order
     * must be in status CREATED, and will be set to status FAILED.
     * 
     * Inventory transactions and coupon redemptions associated with the Order will be rolled back.
     * 
     * If the order is failed in the same session in which it was created, the basket will be reopened such that it can
     * be used for a subsequent order.
     * @deprecated Please use failOrder instead.
     */
    static failOrder(order: Order): Status;
    /**
     * 
     * 
     * This method fails an unplaced order and is usually called if payment could not be authorized. The specified Order
     * must be in status CREATED, and will be set to status FAILED.
     * 
     * Inventory transactions and coupon redemptions associated with the Order will be rolled back.
     * 
     * This method does not alter shipments. Note that createOrder removes empty shipments
     * before creating the order, so a reopened basket might be missing shipments that existed before. If the removed
     * shipment was the default ("me"), the fallback default is the shipment with the lowest ID. See
     * dw.order.LineItemCtnr.getDefaultShipment and dw.order.Shipment.isDefault.
     * 
     * A basket can only be reopened if no other basket for the customer exists at the moment of the call to
     * `failOrder`, since a customer is limited to 1 storefront basket at a time. If, after order creation, a
     * call was made to BasketMgr.getCurrentOrNewBasket or pipelet GetBasket with parameter Create=true, then
     * a new basket has been created, and `failOrder` cannot reopen the basket the order was created with. If
     * a basket is reopened, it always masks sensitive information (e.g., credit card number), because during order
     * creation, basket payment information is permanently masked.
     */
    static failOrder(order: Order, reopenBasketIfPossible: boolean): Status;
    /**
     * 
     * 
     * Returns the order with the specified order number. Order access in the storefront can be limited; see
     * the class description. Use getOrder instead for secure access in a storefront session.
     * 
     * If Limit Storefront Order Access site preference is enabled, this method throws an exception when an
     * insecure access is attempted (refer to the conditions of insecure access in the description of OrderMgr
     * class). Use getOrder instead.
     * @throws SecurityException thrown when the Limit Storefront Order Access preference is enabled and the order is insecurely accessed
     * @see getOrder
     */
    static getOrder(orderNumber: string): Order;
    /**
     * 
     * 
     * Resolves an order using the orderNumber and orderToken.
     * 
     * The order token is generated during order creation in a secure way that is designed to reduce the
     * possibility of unauthorized access. You can retrieve the token via (dw.order.Order.getOrderToken.
     * 
     * This version of the getOrder method doesn’t return an exception when the Limit Storefront Order
     * Access site preference is enabled. Best security practice is to always enable this preference, and to use
     * this method when appropriate.
     * 
     * You should always use this method in the following cases.
     * 
     * - Integration use cases (such as asynchronous payment processing)
     * - When resolving orders from links (for example, order confirmation)
     * - Storefront use cases
     */
    static getOrder(orderNumber: string, orderToken: string): Order | null;
    /**
     * 
     * 
     * This method places an order and is usually called after payment has been authorized. The specified order must be
     * in status CREATED, and will be set to status NEW.
     * 
     * If the order contains product or gift certificate line items associated with product list items, records of the
     * purchase of the product list items will be made. For example, if the basket contains an item added from a gift
     * registry, the purchase history of the respective gift registry item is updated.
     * 
     * The order will count toward product and customer active data.
     * 
     * Placing an order leads to the generation of shipment numbers for all shipments and the invoice number of the
     * order. See dw.order.Shipment.getShipmentNo and dw.order.Order.getInvoiceNo. This is done
     * using sequences.
     */
    static placeOrder(order: Order): Status;
    /**
     * 
     * 
     * Executes a user-definable function on a set of orders. This method is intended to be used in batch processes and
     * jobs, since it allows efficient processing of large result sets (which might take a while to process). First, a
     * search with the given parameters is executed. Then the given function is executed once for each order of the
     * search result. The order is handed over as the only parameter to this function.
     * 
     * The search can be configured using a simple query language, which provides most common filter and operator
     * functionality. The callback function will be supplied with a single argument of type 'Order'. When the function
     * defines additional arguments, they will be undefined when called. When the method doesn't define any argument, it
     * will be called anyway. Error during execution of the callback will be logged, and execution will continue with
     * the next element from the result set. This method can be used as in this example (which counts the number of
     * orders):
     * @example
     * var count=0;
     * function callback(order: Order)
     * {
     * count++;
     * dw.system.Logger.debug("order found: "+order.documentNo)
     * }
     * OrderMgr.processOrders(callback, "buyerno=1");
     * dw.system.Logger.debug("found "+count+" orders for buyerno 1");
     */
    static processOrders(processFunction: Function, queryString: string, ...args: any[]): void;
    /**
     * 
     * 
     * Searches for a single order instance. Order access in the storefront can be limited; see the class description.
     * 
     * The search can be configured using a simple query language, which provides most common filter and operator
     * functionality.
     * 
     * The identifier for an attribute to use in a query condition is always the ID of the attribute as defined
     * in the type definition. For custom-defined attributes, the prefix 'custom' is required in the search term (e.g.
     * `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * 
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime
     * `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note that some system attributes are not queryable by default, regardless of the actual value type code.
     * 
     * The following operators are supported in a condition:
     * 
     * - `=` Equals - All types; supports NULL value (`thumbnail = NULL`)
     * - `!=` Not equals - All types; supports NULL value (`thumbnail != NULL`)
     * - `<` Less than - Integer, Number, and Date types only
     * - `>` Greater than - Integer, Number, and Date types only
     * - `<=` Less or equals than - Integer, Number, and Date types only
     * - `>=` Greater or equals than - Integer, Number, and Date types only
     * - `LIKE` Like - String types and Email only; use if leading or trailing wildcards will be used to
     * support substring search (e.g. `custom.country LIKE 'US*'`)
     * - `ILIKE` Caseindependent Like - String types and Email only; use to support case-insensitive
     * queries (e.g. `custom.country ILIKE 'usa'`); also supports wildcards for substring matching
     * 
     * Conditions can be combined using logical expressions 'AND', 'OR', and 'NOT', and nested using parentheses, e.g.
     * `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
     * 
     * The query language provides a placeholder syntax to pass objects as additional search parameters. Each passed
     * object is related to a placeholder in the query string. The placeholder must be an Integer that is surrounded by
     * braces. The first Integer value must be '0', the second '1', and so on, e.g.
     * `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
     * 
     * If there is more than one object matching the specified query criteria, the result is not deterministic. In order
     * to retrieve a single object from a sorted result set, it is recommended to use the following code:
     * `queryOrders("", "custom.myAttr asc", null).first()`. The method `first()` returns only the
     * next element and closes the iterator.
     * 
     * This method is deprecated and will be removed in a future release.
     * One of the following methods should be used instead:
     * searchOrder, searchOrders, and
     * searchOrders to search for orders and
     * processOrders to search for and process orders in jobs.
     * @deprecated Please use searchOrder instead.
     */
    static queryOrder(queryString: string, ...args: any[]): Order;
    /**
     * 
     * 
     * Searches for order instances. Order access in the storefront can be limited; see the class description.
     * 
     * The search can be configured using a simple query language, which provides most common filter and operator
     * functionality. When implementing order history functionality, don't use the search or query methods in this
     * class. Instead, use dw.customer.OrderHistory.getOrders.
     * 
     * The identifier for an attribute to use in a query condition is always the ID of the attribute as defined
     * in the type definition. For custom-defined attributes, the prefix 'custom' is required in the search term (e.g.
     * `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * 
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime
     * `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note that some system attributes are not queryable by default, regardless of the actual value type code.
     * 
     * The following operators are supported in a condition:
     * 
     * - `=` Equals - All types; supports NULL value (`thumbnail = NULL`)
     * - `!=` Not equals - All types; supports NULL value (`thumbnail != NULL`)
     * - `<` Less than - Integer, Number, and Date types only
     * - `>` Greater than - Integer, Number, and Date types only
     * - `<=` Less or equals than - Integer, Number, and Date types only
     * - `>=` Greater or equals than - Integer, Number, and Date types only
     * - `LIKE` Like - String types and Email only; use if leading or trailing wildcards will be used to
     * support substring search (e.g. `custom.country LIKE 'US*'`)
     * - `ILIKE` Caseindependent Like - String types and Email only; use to support case-insensitive
     * queries (e.g. `custom.country ILIKE 'usa'`); also supports wildcards for substring matching
     * 
     * Conditions can be combined using logical expressions 'AND', 'OR', and 'NOT', and nested using parentheses, e.g.
     * `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
     * 
     * The query language provides a placeholder syntax to pass objects as additional search parameters. Each passed
     * object is related to a placeholder in the query string. The placeholder must be an Integer that is surrounded by
     * braces. The first Integer value must be '0', the second '1', and so on, e.g.
     * `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`
     * 
     * The sorting parameter is optional and may contain a comma-separated list of attribute names to sort by.
     * Each sort attribute name may be followed by an optional sort direction specifier ('asc' | 'desc'). The default
     * sorting direction is ascending, if no direction was specified.
     * 
     * Example: `age desc, name`
     * 
     * Please note that specifying a localized custom attribute as the sorting attribute is currently not supported.
     * 
     * Sometimes it is desired to get all instances of a specified type with a special sorting condition. This can be
     * easily done by providing the 'type' of the custom object and the 'sortString' in combination with an empty
     * 'queryString', e.g. `queryOrders("sample", "", "custom.myAttr asc")`.
     * 
     * It is strongly recommended to call `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * 
     * This method is deprecated and will be removed in a future release.
     * One of the following methods should be used instead:
     * searchOrder, searchOrders, and
     * searchOrders to search for orders, and
     * processOrders to search for and process orders in jobs.
     * @see dw.util.SeekableIterator.close
     * @deprecated Please use searchOrders instead.
     */
    static queryOrders(queryString: string, sortString: string | null, ...args: any[]): SeekableIterator<Order>;
    /**
     * 
     * 
     * Searches for order instances. Order access in the storefront can be limited; see the class description.
     * 
     * The search can be configured with a map, which converts key-value pairs into a query expression. The key-value
     * pairs are turned into a sequence of '=' or 'like' conditions, which are combined with AND statements. When
     * implementing order history functionality, don't use the search or query methods in this class. Instead, use
     * dw.customer.OrderHistory.getOrders.
     * 
     * Example:
     * 
     * A map with the key/value pairs: 'name'/'tom*', 'age'/66 will be converted as follows:
     * `"name like 'tom*' and age = 66"`
     * 
     * The identifier for an attribute to use in a query condition is always the ID of the attribute as defined
     * in the type definition. For custom-defined attributes, the prefix 'custom' is required in the search term (e.g.
     * `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * 
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime
     * `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note that some system attributes are not queryable by default, regardless of the actual value type code.
     * 
     * The sorting parameter is optional and may contain a comma-separated list of attribute names to sort by.
     * Each sort attribute name may be followed by an optional sort direction specifier ('asc' | 'desc'). The default
     * sorting direction is ascending, if no direction was specified.
     * 
     * Example: `age desc, name`
     * 
     * Please note that specifying a localized custom attribute as the sorting attribute is currently not supported.
     * 
     * It is strongly recommended to call the `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * 
     * This method is deprecated and will be removed in a future release.
     * One of the following methods should be used instead:
     * searchOrder, searchOrders, and
     * searchOrders to search for orders and
     * processOrders to search for and process orders in jobs.
     * @see dw.util.SeekableIterator.close
     * @deprecated Please use searchOrders instead.
     */
    static queryOrders(queryAttributes: utilMap<any, any>, sortString: string | null): SeekableIterator<Order>;
    /**
     * 
     * 
     * Searches for a single order instance. Order access in the storefront can be limited; see the class description.
     * 
     * The search can be configured using a simple query language, which provides most common filter and operator
     * functionality.
     * 
     * The identifier for an attribute to use in a query condition is always the ID of the attribute as defined
     * in the type definition. For custom-defined attributes the prefix 'custom' is required in the search term (e.g.
     * `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * 
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime
     * `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note that some system attributes are not queryable by default, regardless of the actual value type code.
     * 
     * The following operators are supported in a condition:
     * 
     * - `=` Equals - All types; supports NULL value (`thumbnail = NULL`)
     * - `!=` Not equals - All types; supports NULL value (`thumbnail != NULL`)
     * - `<` Less than - Integer, Number, and Date types only
     * - `>` Greater than - Integer, Number, and Date types only
     * - `<=` Less or equals than - Integer, Number, and Date types only
     * - `>=` Greater or equals than - Integer, Number, and Date types only
     * - `LIKE` Like - String types and Email only; use if leading or trailing wildcards will be used to
     * support substring search (e.g. `custom.country LIKE 'US*'`)
     * - `ILIKE` Caseindependent Like - String types and Email only; use to support case-insensitive
     * queries (e.g. `custom.country ILIKE 'usa'`), also supports wildcards for substring matching
     * 
     * Conditions can be combined using logical expressions 'AND', 'OR', and 'NOT', and nested using parentheses, e.g.
     * `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
     * 
     * The query language provides a placeholder syntax to pass objects as additional search parameters. Each passed
     * object is related to a placeholder in the query string. The placeholder must be an Integer that is surrounded by
     * braces. The first Integer value must be '0', the second '1', and so on, e.g.
     * `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`.
     * 
     * If there is more than one object matching the specified query criteria, the result is not deterministic. In order
     * to retrieve a single object from a sorted result set, it is recommended to use the following code:
     * `queryOrders("", "custom.myAttr asc", null).first()`. The method `first()` returns only the
     * next element and closes the iterator.
     * 
     * If the order search API is configured to use the new Search Service, these differences apply:
     * 
     * - Search may match and return documents with missing (NULL) values in search fields, depending on
     * how the query is structured, potentially leading to broader result sets. For example, a query like
     * `custom.searchField != "some value"` also returns documents where `custom.searchField`
     * is NULL — whereas in relational databases, such documents are excluded.
     * - Wildcards are filtered from the query (*, %, +) and replaced by spaces
     * - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring
     * searches
     * - LIKE queries are always case-insensitive
     * - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending
     * on how they are combined
     * - Using logical operators may result in degraded performance, depending on how they are combined
     * 
     * Order search index updates are asynchronous, triggered only by committing changes to the underlying system.
     */
    static searchOrder(queryString: string, ...args: any[]): Order;
    /**
     * 
     * 
     * Searches for order instances. Order access in the storefront can be limited; see the class description.
     * 
     * The search can be configured using a simple query language, which provides most common filter and operator
     * functionality. When implementing order history functionality, don't use the search or query methods in this
     * class. Instead, use dw.customer.OrderHistory.getOrders.
     * 
     * The identifier for an attribute to use in a query condition is always the ID of the attribute as defined
     * in the type definition. For custom-defined attributes the prefix 'custom' is required in the search term (e.g.
     * `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * 
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime
     * `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note that some system attributes are not queryable by default, regardless of the actual value type code.
     * 
     * The following operators are supported in a condition:
     * 
     * - `=` Equals - All types; supports NULL value (`thumbnail = NULL`)
     * - `!=` Not equals - All types; supports NULL value (`thumbnail != NULL`)
     * - `<` Less than - Integer, Number, and Date types only
     * - `>` Greater than - Integer, Number, and Date types only
     * - `<=` Less or equals than - Integer, Number, and Date types only
     * - `>=` Greater or equals than - Integer, Number, and Date types only
     * - `LIKE` Like - String types and Email only; use if leading or trailing wildcards will be used to
     * support substring search (e.g. `custom.country LIKE 'US*'`)
     * - `ILIKE` Caseindependent Like - String types and Email only; use to support case-insensitive
     * queries (e.g. `custom.country ILIKE 'usa'`); also supports wildcards for substring matching
     * 
     * Note that wildcards are not supported by Search Service.
     * 
     * Conditions can be combined using logical expressions 'AND', 'OR', and 'NOT', and nested using parentheses, e.g.
     * `gender = {1} AND (age >= {2} OR (NOT profession LIKE {3}))`.
     * 
     * The query language provides a placeholder syntax to pass objects as additional search parameters. Each passed
     * object is related to a placeholder in the query string. The placeholder must be an Integer that is surrounded by
     * braces. The first Integer value must be '0', the second '1', and so on, e.g.
     * `querySystemObjects("sample", "age = {0} or creationDate >= {1}", 18, date)`.
     * 
     * The sorting parameter is optional and may contain a comma-separated list of attribute names to sort by.
     * Each sort attribute name may be followed by an optional sort direction specifier ('asc' | 'desc'). The default
     * sorting direction is ascending, if no direction was specified.
     * 
     * Example: `age desc, name`
     * 
     * Please note that specifying a localized custom attribute as the sorting attribute is currently not supported.
     * 
     * Sometimes it is desired to get all instances of a specified type with a special sorting condition. This can be
     * easily done by providing the 'type' of the custom object and the 'sortString' in combination with an empty
     * 'queryString', e.g. `queryOrders("sample", "", "custom.myAttr asc")`.
     * 
     * It is strongly recommended to call `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * 
     * If the order search API is configured to use the new Search Service, these differences apply:
     * 
     * - Search may match and return documents with missing (NULL) values in search fields, depending on
     * how the query is structured, potentially leading to broader result sets. For example, a query like
     * `custom.searchField != "some value"` also returns documents where `custom.searchField`
     * is NULL — whereas in relational databases, such documents are excluded.
     * - Wildcards are filtered from the query (*, %, +) and replaced by spaces
     * - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring
     * searches
     * - LIKE queries are always case-insensitive
     * - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending
     * on how they are combined
     * - Using logical operators may result in degraded performance, depending on how they are combined
     * - The result is limited to a maximum of 1000 orders
     * 
     * Order search index updates are asynchronous, triggered only by committing changes to the underlying system.
     * @see dw.util.SeekableIterator.close
     */
    static searchOrders(queryString: string, sortString: string | null, ...args: any[]): SeekableIterator<Order>;
    /**
     * 
     * 
     * Searches for order instances. Order access in the storefront can be limited; see the class description.
     * 
     * The search can be configured with a map, which converts key-value pairs into a query expression. The key-value
     * pairs are turned into a sequence of '=' or 'like' conditions, which are combined with AND statements.
     * 
     * Example:
     * 
     * A map with the key/value pairs: 'name'/'tom*', 'age'/66 will be converted as follows:
     * `"name like 'tom*' and age = 66"` Note that wildcards are not supported by Search Service.
     * 
     * The identifier for an attribute to use in a query condition is always the ID of the attribute as defined
     * in the type definition. For custom-defined attributes, the prefix 'custom' is required in the search term (e.g.
     * `custom.color = {1}`), while for system attributes no prefix is used (e.g. `name = {4}`).
     * 
     * Supported attribute value types with sample expression values:
     * 
     * - String `'String', 'Str*', 'Strin?'`
     * - Integer `1, 3E4`
     * - Number `1.0, 3.99E5`
     * - Date `yyyy-MM-dd e.g. 2007-05-31 (Default TimeZone = UTC)`
     * - DateTime
     * `yyyy-MM-dd'T'hh:mm:ss+Z e.g. 2007-05-31T00:00+Z (Z TimeZone = UTC) or 2007-05-31T00:00:00`
     * - Boolean `true, false`
     * - Email `'search@demandware.com', '*@demandware.com'`
     * - Set of String `'String', 'Str*', 'Strin?'`
     * - Set of Integer `1, 3E4`
     * - Set of Number `1.0, 3.99E5`
     * - Enum of String `'String', 'Str*', 'Strin?'`
     * - Enum of Integer `1, 3E4`
     * 
     * The following types of attributes are not queryable:
     * 
     * - Image
     * - HTML
     * - Text
     * - Quantity
     * - Password
     * 
     * Note that some system attributes are not queryable by default, regardless of the actual value type code.
     * 
     * The sorting parameter is optional and may contain a comma-separated list of attribute names to sort by.
     * Each sort attribute name may be followed by an optional sort direction specifier ('asc' | 'desc'). The default
     * sorting direction is ascending, if no direction was specified.
     * 
     * Example: `age desc, name`
     * 
     * Please note that specifying a localized custom attribute as the sorting attribute is currently not supported.
     * 
     * It is strongly recommended to call `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * 
     * If the order search API is configured to use the new Search Service, these differences apply:
     * 
     * - Search may match and return documents with missing (NULL) values in search fields, depending on
     * how the query is structured, potentially leading to broader result sets. For example, a query like
     * `custom.searchField != "some value"` also returns documents where `custom.searchField`
     * is NULL — whereas in relational databases, such documents are excluded.
     * - Wildcards are filtered from the query (*, %, +) and replaced by spaces
     * - LIKE and ILIKE queries are executed as fulltext queries (working on whole words), not as substring
     * searches
     * - LIKE queries are always case-insensitive
     * - Using logical operators may change the execution of LIKE/ILIKE clauses to exact string comparison, depending
     * on how they are combined
     * - Using logical operators may result in degraded performance, depending on how they are combined
     * - The result is limited to a maximum of 1000 orders
     * 
     * Order search index updates are asynchronous, triggered only by committing changes to the underlying system.
     * @see dw.util.SeekableIterator.close
     */
    static searchOrders(queryAttributes: utilMap<any, any>, sortString: string | null): SeekableIterator<Order>;
    /**
     * 
     * 
     * This method is used to turn a CANCELLED order into an OPEN order.
     * 
     * The specified order must be a cancelled order (dw.order.Order.ORDER_STATUS_CANCELLED). The method will
     * reserve inventory for all product line items, and create redemptions for all coupons. If successful, the status
     * of the order will be changed to dw.order.Order.ORDER_STATUS_OPEN. If the order contains product or gift
     * certificate line items associated with product list items, records of the purchase of the product list items will
     * be recreated.
     * 
     * If the undoCancelOrder call fails, the transaction is marked as ‘rollback only’ – all changes in the associated
     * transaction will no longer be committed.
     * 
     * Possible error status codes are:
     * 
     * - OrderProcessStatusCodes.COUPON_INVALID - coupon is not active anymore or maximum amount of
     * redemptions is reached
     * - OrderProcessStatusCodes.ORDER_NOT_CANCELLED - order is not in status
     * dw.order.Order.ORDER_STATUS_CANCELLED
     * - OrderProcessStatusCodes.INVENTORY_RESERVATION_FAILED - Inventory reservation for the order failed. In
     * cases when availability is too low then undoCancel or undoFail results in a reservation failure. This can be
     * avoided using the order site preferences to specifically allow overselling. See order site preferences under
     * "Constraints for Undoing Failed/Cancelled Orders".
     */
    static undoCancelOrder(order: Order): Status;
    /**
     * 
     * 
     * This method is used to turn a FAILED order into a CREATED order.
     * 
     * The specified order must be a failed order (dw.order.Order.ORDER_STATUS_FAILED). The method will reserve
     * inventory for all product line items, and create redemptions for all coupons. If successful, the status of the
     * order will be changed to dw.order.Order.ORDER_STATUS_CREATED.
     * 
     * If the undoFailOrder call fails, the transaction is marked as ‘rollback only’ – all changes in the associated
     * transaction will no longer be committed.
     * 
     * Possible error status codes are:
     * 
     * - OrderProcessStatusCodes.COUPON_INVALID - coupon is not active anymore or maximum amount of
     * redemptions is reached
     * - OrderProcessStatusCodes.ORDER_NOT_FAILED - order is not in status
     * dw.order.Order.ORDER_STATUS_FAILED
     * - OrderProcessStatusCodes.INVENTORY_RESERVATION_FAILED - Inventory reservation for the order failed. In
     * cases when availability is too low then undoCancel or undoFail results in a reservation failure. This can be
     * avoided using the order site preferences to specifically allow overselling. See order site preferences under
     * "Constraints for Undoing Failed/Cancelled Orders".
     */
    static undoFailOrder(order: Order): Status;
}

export = OrderMgr;
