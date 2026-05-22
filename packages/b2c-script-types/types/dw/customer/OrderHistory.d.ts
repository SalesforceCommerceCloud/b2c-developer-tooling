import SeekableIterator = require('../util/SeekableIterator');
import Order = require('../order/Order');

/**
 * The class provides access to past orders of the customer.
 * 
 * Note: This class allows access to sensitive financial and cardholder data. Pay special attention to PCI DSS
 * v3. requirements 1, 3, 7, and 9. It also allows access to sensitive personal and private information. Pay attention
 * to appropriate legal and regulatory requirements related to this data.
 * Note: The following methods do not work with Salesforce Order Management orders.
 */
declare class OrderHistory {
    /**
     * Returns the number of orders the customer has placed in the store.
     * 
     * If the customer is anonymous, this method always returns zero. If an active data record is available for this
     * customer, the orders count is retrieved from that record, otherwise a real-time query is used to get the count.
     */
    readonly orderCount: number;
    /**
     * Retrieves the order history for the customer in the current storefront site.
     * 
     * If the result exceeds 1000 orders, only the first 1000 orders are retrieved. Same as
     * 
     * ```
     * orderHistory.getOrders( null, "creationDate DESC" )
     * ```
     * 
     * It is strongly recommended to call `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * @see getOrders
     */
    readonly orders: SeekableIterator<Order>;
    private constructor();
    /**
     * Returns the number of orders the customer has placed in the store.
     * 
     * If the customer is anonymous, this method always returns zero. If an active data record is available for this
     * customer, the orders count is retrieved from that record, otherwise a real-time query is used to get the count.
     */
    getOrderCount(): number;
    /**
     * Retrieves the order history for the customer in the current storefront site.
     * 
     * If the result exceeds 1000 orders, only the first 1000 orders are retrieved. Same as
     * 
     * ```
     * orderHistory.getOrders( null, "creationDate DESC" )
     * ```
     * 
     * It is strongly recommended to call `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * @see getOrders
     */
    getOrders(): SeekableIterator<Order>;
    /**
     * Retrieves the order history for the customer in the current storefront site.
     * 
     * If the result exceeds 1000 orders, only the first 1000 orders are retrieved. Optionally, you can retrieve a subset
     * of the orders by specifying a query. At maximum 3 expressions are allowed to be specified and no custom attribute
     * expressions are allowed.
     * 
     * It is strongly recommended to call `dw.util.SeekableIterator.close` on the returned
     * SeekableIterator if not all of its elements are being retrieved. This will ensure the proper cleanup of system
     * resources.
     * 
     * Example:
     * @example
     * var orderHistory : dw.customer.OrderHistory = customer.getOrderHistory();
     * var orders = orderHistory.getOrders("status = {0}", "creationDate DESC", dw.order.Order.ORDER_STATUS_NEW);
     * for each (var order : dw.order.Order in orders) {
     * // ... process orders
     * }
     * orders.close();
     */
    getOrders(query: string, sortString: string, ...params: any[]): SeekableIterator<Order>;
}

export = OrderHistory;
