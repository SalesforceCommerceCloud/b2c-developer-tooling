import ActiveData = require('../object/ActiveData');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');

declare global {
    module ICustomAttributes {
        interface CustomerActiveData extends ICustomAttributes.ActiveData {
        }
    }
}

/**
 * Represents the active data for a dw.customer.Customer in Commerce Cloud Digital.
 * 
 * Note: this class allows access to sensitive personal and private information.
 * Pay attention to appropriate legal and regulatory requirements when developing.
 */
declare class CustomerActiveData extends ActiveData<ICustomAttributes.CustomerActiveData> {
    /**
     * Returns the average order value of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly avgOrderValue: number;
    /**
     * Returns the discount value resulting from coupons, that has been applied
     * to orders of the customer, or `null` if none has been set or
     * the value is no longer valid.
     */
    readonly discountValueWithCoupon: number;
    /**
     * Returns the discount value resulting from promotions other than coupons,
     * that has been applied to orders of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly discountValueWithoutCoupon: number;
    /**
     * Returns the number of orders for the Customer that contained at least
     * one product unit marked as a gift, or `null` if none has been
     * set or the value is no longer valid.
     */
    readonly giftOrders: number;
    /**
     * Returns the number of product units in orders for the customer
     * that were marked as a gift, or `null` if none has been set
     * or the value is no longer valid.
     */
    readonly giftUnits: number;
    /**
     * Returns the date of the last order for the customer, or `null`
     * if there are no orders for the customer.
     */
    readonly lastOrderDate: Date | null;
    /**
     * Returns the lifetime order value of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly orderValue: number;
    /**
     * Returns the order value of the customer, over the most recent 30 days,
     * or `null` if none has been set or the value is no longer valid.
     */
    readonly orderValueMonth: number;
    /**
     * Returns the orders of the customer, or `null` if none
     * has been set or the value is no longer valid.
     */
    readonly orders: number;
    /**
     * Returns an array containing the master product SKUs of variation products
     * in orders for the customer, or an empty collection if no SKUs have been
     * set or the collection of SKUs is no longer valid. There is no specific
     * limit on the number of SKUs that will be returned in the collection, but
     * there is also no guarantee that it will contain the SKUs for all products
     * ordered by the customer.
     */
    readonly productMastersOrdered: string[];
    /**
     * Returns an array containing the SKUs of products in baskets abandoned
     * by the customer in the last 30 days, or an empty collection if no SKUs
     * have been set or the collection is no longer valid.  There is no specific
     * limit on the number of SKUs that will be returned in the collection, but
     * there is also no guarantee that it will contain the SKUs for all products
     * in baskets abandoned by the customer.
     */
    readonly productsAbandonedMonth: string[];
    /**
     * Returns an array containing the SKUs of products in orders
     * for the customer, or an empty collection if no SKUs have been set or the
     * collection of SKUs is no longer valid.  There is no specific limit on the
     * number of SKUs that will be returned in the collection, but there is also
     * no guarantee that it will contain the SKUs for all products ordered by
     * the customer.
     */
    readonly productsOrdered: string[];
    /**
     * Returns an array containing the SKUs of products viewed by the
     * customer in the last 30 days, or an empty collection if no SKUs have been
     * set or the collection is no longer valid.  There is no specific limit on
     * the number of SKUs that will be returned in the collection, but there is
     * also no guarantee that it will contain the SKUs for all products viewed
     * by the customer.
     */
    readonly productsViewedMonth: string[];
    /**
     * Returns the returned revenue of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly returnValue: number;
    /**
     * Returns the number of returns of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    readonly returns: number;
    /**
     * Returns the number of orders for the customer where a source code was
     * in effect, or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly sourceCodeOrders: number;
    /**
     * Returns an array containing the IDs of up to the top 20 categories for
     * customer orders, or an empty list if no categories have been set or the
     * list of categories is no longer valid. The top category is the one for
     * which the most orders for the customer contained at least one product
     * found in that category.
     */
    readonly topCategoriesOrdered: string[];
    /**
     * Returns the visits of the customer, over the most recent 30 days,
     * or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly visitsMonth: number;
    /**
     * Returns the visits of the customer, over the most recent 7 days,
     * or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly visitsWeek: number;
    /**
     * Returns the visits of the customer, over the most recent 365 days,
     * or `null` if none has been set or the value
     * is no longer valid.
     */
    readonly visitsYear: number;
    private constructor();
    /**
     * Returns the average order value of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    getAvgOrderValue(): number;
    /**
     * Returns the discount value resulting from coupons, that has been applied
     * to orders of the customer, or `null` if none has been set or
     * the value is no longer valid.
     */
    getDiscountValueWithCoupon(): number;
    /**
     * Returns the discount value resulting from promotions other than coupons,
     * that has been applied to orders of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    getDiscountValueWithoutCoupon(): number;
    /**
     * Returns the number of orders for the Customer that contained at least
     * one product unit marked as a gift, or `null` if none has been
     * set or the value is no longer valid.
     */
    getGiftOrders(): number;
    /**
     * Returns the number of product units in orders for the customer
     * that were marked as a gift, or `null` if none has been set
     * or the value is no longer valid.
     */
    getGiftUnits(): number;
    /**
     * Returns the date of the last order for the customer, or `null`
     * if there are no orders for the customer.
     */
    getLastOrderDate(): Date | null;
    /**
     * Returns the lifetime order value of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    getOrderValue(): number;
    /**
     * Returns the order value of the customer, over the most recent 30 days,
     * or `null` if none has been set or the value is no longer valid.
     */
    getOrderValueMonth(): number;
    /**
     * Returns the orders of the customer, or `null` if none
     * has been set or the value is no longer valid.
     */
    getOrders(): number;
    /**
     * Returns an array containing the master product SKUs of variation products
     * in orders for the customer, or an empty collection if no SKUs have been
     * set or the collection of SKUs is no longer valid. There is no specific
     * limit on the number of SKUs that will be returned in the collection, but
     * there is also no guarantee that it will contain the SKUs for all products
     * ordered by the customer.
     */
    getProductMastersOrdered(): string[];
    /**
     * Returns an array containing the SKUs of products in baskets abandoned
     * by the customer in the last 30 days, or an empty collection if no SKUs
     * have been set or the collection is no longer valid.  There is no specific
     * limit on the number of SKUs that will be returned in the collection, but
     * there is also no guarantee that it will contain the SKUs for all products
     * in baskets abandoned by the customer.
     */
    getProductsAbandonedMonth(): string[];
    /**
     * Returns an array containing the SKUs of products in orders
     * for the customer, or an empty collection if no SKUs have been set or the
     * collection of SKUs is no longer valid.  There is no specific limit on the
     * number of SKUs that will be returned in the collection, but there is also
     * no guarantee that it will contain the SKUs for all products ordered by
     * the customer.
     */
    getProductsOrdered(): string[];
    /**
     * Returns an array containing the SKUs of products viewed by the
     * customer in the last 30 days, or an empty collection if no SKUs have been
     * set or the collection is no longer valid.  There is no specific limit on
     * the number of SKUs that will be returned in the collection, but there is
     * also no guarantee that it will contain the SKUs for all products viewed
     * by the customer.
     */
    getProductsViewedMonth(): string[];
    /**
     * Returns the returned revenue of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    getReturnValue(): number;
    /**
     * Returns the number of returns of the customer, or `null`
     * if none has been set or the value is no longer valid.
     */
    getReturns(): number;
    /**
     * Returns the number of orders for the customer where a source code was
     * in effect, or `null` if none has been set or the value
     * is no longer valid.
     */
    getSourceCodeOrders(): number;
    /**
     * Returns an array containing the IDs of up to the top 20 categories for
     * customer orders, or an empty list if no categories have been set or the
     * list of categories is no longer valid. The top category is the one for
     * which the most orders for the customer contained at least one product
     * found in that category.
     */
    getTopCategoriesOrdered(): string[];
    /**
     * Returns the visits of the customer, over the most recent 30 days,
     * or `null` if none has been set or the value
     * is no longer valid.
     */
    getVisitsMonth(): number;
    /**
     * Returns the visits of the customer, over the most recent 7 days,
     * or `null` if none has been set or the value
     * is no longer valid.
     */
    getVisitsWeek(): number;
    /**
     * Returns the visits of the customer, over the most recent 365 days,
     * or `null` if none has been set or the value
     * is no longer valid.
     */
    getVisitsYear(): number;
}

export = CustomerActiveData;
