import LineItemCtnr = require('./LineItemCtnr');
import ExtensibleObject = require('../object/ExtensibleObject');
import CustomAttributes = require('../object/CustomAttributes');
import Order = require('./Order');
import Status = require('../system/Status');

declare global {
    module ICustomAttributes {
        interface Basket extends ICustomAttributes.LineItemCtnr {
        }
    }
}

/**
 * The Basket class represents a shopping cart.
 */
declare class Basket extends LineItemCtnr<ICustomAttributes.Basket> {
    /**
     * Returns if the basket was created by an agent.
     * 
     * An agent basket is created by an agent on behalf of the customer in comparison to a storefront basket which is
     * created by the customer e.g. in the storefront. An agent basket can be created with
     * BasketMgr.createAgentBasket.
     */
    readonly agentBasket: boolean;
    /**
     * Returns the timestamp when the inventory for this basket expires.
     * 
     * It will return `null` for the following reasons:
     * 
     * - No reservation for the basket was done
     * - Reservation is outdated meaning the timestamp is in the past
     * 
     * Please note that the expiry timestamp will not always be valid for the whole basket. It will not be valid for
     * new items added or items whose quantity has changed after the reservation was done.
     */
    readonly inventoryReservationExpiry: Date | null;
    /**
     * Returns the order that this basket represents if the basket is being used to edit an order, otherwise this method
     * returns null. Baskets created via dw.order.BasketMgr.createBasketFromOrder will create a reference
     * to the order that was used to create this basket (please check limitations around basket accessibility in
     * dw.order.BasketMgr.createBasketFromOrder).
     */
    readonly orderBeingEdited: Order;
    /**
     * Returns the number of the order that this basket represents if the basket is being used to edit an order,
     * otherwise this method returns null. Baskets created via dw.order.BasketMgr.createBasketFromOrder
     * will create a reference to the order that was used to create this basket (please check limitations around basket
     * accessibility in dw.order.BasketMgr.createBasketFromOrder).
     */
    readonly orderNoBeingEdited: string;
    /**
     * Use this method to check if the Basket was calculated with grouped taxation calculation.
     * 
     * If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.
     */
    readonly taxRoundedAtGroup: boolean;
    /**
     * Returns if the basket is temporary.
     * 
     * Temporary baskets are separate from shopper storefront and agent baskets, and are intended for use to perform
     * calculations or create an order without disturbing a shopper's open storefront basket. A temporary basket can be
     * created with BasketMgr.createTemporaryBasket.
     */
    readonly temporary: boolean;
    private constructor();
    /**
     * Returns the timestamp when the inventory for this basket expires.
     * 
     * It will return `null` for the following reasons:
     * 
     * - No reservation for the basket was done
     * - Reservation is outdated meaning the timestamp is in the past
     * 
     * Please note that the expiry timestamp will not always be valid for the whole basket. It will not be valid for
     * new items added or items whose quantity has changed after the reservation was done.
     */
    getInventoryReservationExpiry(): Date | null;
    /**
     * Returns the order that this basket represents if the basket is being used to edit an order, otherwise this method
     * returns null. Baskets created via dw.order.BasketMgr.createBasketFromOrder will create a reference
     * to the order that was used to create this basket (please check limitations around basket accessibility in
     * dw.order.BasketMgr.createBasketFromOrder).
     */
    getOrderBeingEdited(): Order;
    /**
     * Returns the number of the order that this basket represents if the basket is being used to edit an order,
     * otherwise this method returns null. Baskets created via dw.order.BasketMgr.createBasketFromOrder
     * will create a reference to the order that was used to create this basket (please check limitations around basket
     * accessibility in dw.order.BasketMgr.createBasketFromOrder).
     */
    getOrderNoBeingEdited(): string;
    /**
     * Returns if the basket was created by an agent.
     * 
     * An agent basket is created by an agent on behalf of the customer in comparison to a storefront basket which is
     * created by the customer e.g. in the storefront. An agent basket can be created with
     * BasketMgr.createAgentBasket.
     */
    isAgentBasket(): boolean;
    /**
     * Use this method to check if the Basket was calculated with grouped taxation calculation.
     * 
     * If the tax is rounded on group level, the tax is applied to the summed-up tax basis for each tax rate.
     */
    isTaxRoundedAtGroup(): boolean;
    /**
     * Returns if the basket is temporary.
     * 
     * Temporary baskets are separate from shopper storefront and agent baskets, and are intended for use to perform
     * calculations or create an order without disturbing a shopper's open storefront basket. A temporary basket can be
     * created with BasketMgr.createTemporaryBasket.
     */
    isTemporary(): boolean;
    /**
     * 
     * 
     * Release all inventory previously reserved for this basket. This is not needed for a normal workflow.
     * You can call `dw.order.Basket.reserveInventory()` one time after every basket change.
     * For performance and scaling reasons, avoid calling `dw.order.Basket.releaseInventory()`
     * before `dw.order.Basket.reserveInventory()`. The `reserveInventory` function works in
     * an optimized way to release inventory reservations that are no longer relevant.
     * 
     * The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
     * and results in an exception being thrown. This behavior differs when calling the method from an OCAPI
     * hook. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
     * handling, but to ensure the shortest possible locking of the inventory this method should only be called as
     * the last step in the OCAPI hook.
     */
    releaseInventory(): Status;
    /**
     * 
     * 
     * Reserves inventory for all items in this basket for 10 minutes. Any reservations created by previous calls of
     * this method are replaced.
     * 
     * Sample workflow for subsequent basket reservations:
     * 
     * 1. Request: Add item to basket and reserve the basket.
     * 
     * ```
     * transaction.begin()
     * basket.createProductLineItem("sku1",2,basket.defaultShipment)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku1:2} is complete.
     * ```
     * 
     * 2. Request: Add item to basket.
     * 
     * ```
     * transaction.begin()
     * basket.createProductLineItem("sku2",2,basket.defaultShipment)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku1:2, sku2:2} is complete. The previous reservation was overwritten.
     * ```
     * 
     * 3. Request: Remove item from basket.
     * 
     * ```
     * transaction.begin()
     * basket.removeProductLineItem(item1)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku2:2} is complete. The previous reservation was
     * // overwritten and a quantity of 2 is released for sku1.
     * ```
     * 
     * The method can be used to reserve basket items before checkout to ensure that inventory is still available at the
     * time an order is created from the basket using dw.order.OrderMgr.createOrder. If all or some
     * basket items are not reserved before creating an order, dw.order.OrderMgr.createOrder will
     * validate item availability and will fail if any item is unavailable. Calling this method in the same request as
     * dw.order.OrderMgr.createOrder is unnecessary and discouraged for performance reasons.
     * 
     * The maximum quantity that can be reserved at one time is equal to the ATS (Available To Sell) quantity. (See
     * dw.catalog.ProductInventoryRecord.getATS.)
     * 
     * When using B2C Commerce inventory, reserving basket inventory does not reduce ATS. In this case, converting the
     * basket to an order reduces ATS by the reserved amount. For example, consider a product with an ATS quantity of 5
     * and no reservations. If a basket reserves a quantity of 3, then other baskets still see an ATS of 5 but can only
     * reserve a quantity of 2.
     * 
     * When using Omnichannel Inventory, reserving basket inventory reduces ATS. In this case, converting the basket to
     * an order doesn't reduce ATS. In the previous example, after the first basket reserved a quantity of 3, other
     * baskets would see an ATS of 2.
     * 
     * Reservations can only be made for products with an inventory record. The reservation of product bundles is
     * controlled by the Use Bundle Inventory Only setting on the inventory list. The setting allows inventory to
     * be reserved for just the bundle or for the bundle and its bundled products.
     * 
     * The following conditions must be met for the method to succeed:
     * 
     * - an inventory list must be assigned to the current site
     * - all products in the basket must exist, and must not be of type Master or ProductSet
     * - each product line item must have a valid quantity
     * - each product must have an inventory record, or the inventory list must define that products without inventory
     * record are available by default
     * - the reservation must succeed for each item as described above.
     * 
     * The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
     * and results in an exception being thrown. This behavior differs when calling the method from an OCAPI
     * hook. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
     * handling, but to ensure the shortest possible locking of the inventory this method should only be called as
     * the last step in the OCAPI hook.
     * 
     * If the reservation fails with an ERROR status, existing valid reservations for the basket will remain unchanged
     * but no new reservations will be made. This might lead to a partially reserved basket.
     * 
     * Behaves same as `reserveInventory( null, false );`.
     * 
     * This method must not be used with
     * 
     * - the CreateOrder2 pipelet, or
     * - dw.order.OrderMgr.createOrder, or
     * - dw.order.OrderMgr.createOrder
     * 
     * in the same request.
     */
    reserveInventory(): Status;
    /**
     * 
     * 
     * Reserve inventory for all items in this basket for 10 minutes. Any reservations created by previous calls of
     * this method are replaced.
     * 
     * Sample workflow for subsequent basket reservations:
     * 
     * 1. Request: Add item to basket and reserve the basket.
     * 
     * ```
     * transaction.begin()
     * basket.createProductLineItem("sku1",2,basket.defaultShipment)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku1:2} is complete.
     * ```
     * 
     * 2. Request: Add item to basket.
     * 
     * ```
     * transaction.begin()
     * basket.createProductLineItem("sku2",2,basket.defaultShipment)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku1:2, sku2:2} is complete. The previous reservation was overwritten.
     * ```
     * 
     * 3. Request: Remove item from basket.
     * 
     * ```
     * transaction.begin()
     * basket.removeProductLineItem(item1)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku2:2} is complete. The previous reservation was
     * // overwritten and a quantity of 2 is released for sku1.
     * ```
     * 
     * The method can be used to reserve basket items before checkout to ensure that inventory is still available at the
     * time an order is created from the basket using dw.order.OrderMgr.createOrder. If all or some
     * basket items are not reserved before creating an order, dw.order.OrderMgr.createOrder will
     * validate item availability and will fail if any item is unavailable. Calling this method in the same request as
     * dw.order.OrderMgr.createOrder is unnecessary and discouraged for performance reasons.
     * 
     * The maximum quantity that can be reserved at one time is equal to the ATS (Available To Sell) quantity. (See
     * dw.catalog.ProductInventoryRecord.getATS.)
     * 
     * When using B2C Commerce inventory, reserving basket inventory does not reduce ATS. In this case, converting the
     * basket to an order reduces ATS by the reserved amount. For example, consider a product with an ATS quantity of 5
     * and no reservations. If a basket reserves a quantity of 3, then other baskets still see an ATS of 5 but can only
     * reserve a quantity of 2.
     * 
     * When using Omnichannel Inventory, reserving basket inventory reduces ATS. In this case, converting the basket to
     * an order doesn't reduce ATS. In the previous example, after the first basket reserved a quantity of 3, other
     * baskets would see an ATS of 2.
     * 
     * Reservations can only be made for products with an inventory record. The reservation of product bundles is
     * controlled by the Use Bundle Inventory Only setting on the inventory list. The setting allows inventory to
     * be reserved for just the bundle or for the bundle and its bundled products.
     * 
     * The following conditions must be met for the method to succeed:
     * 
     * - an inventory list must be assigned to the current site
     * - all products in the basket must exist, and must not be of type Master or ProductSet
     * - each product line item must have a valid quantity
     * - each product must have an inventory record, or the inventory list must define that products without inventory
     * record are available by default
     * - the reservation must succeed for each item as described above.
     * 
     * The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
     * and results in an exception being thrown. This behavior differs when calling the method from an OCAPI
     * hook. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
     * handling, but to ensure the shortest possible locking of the inventory this method should only be called as
     * the last step in the OCAPI hook.
     * 
     * getInventoryReservationExpiry can be used to determine when the expiration will expire.
     * 
     * If the reservation fails with an ERROR status, existing valid reservations for the basket will remain unchanged
     * but no new reservations will be made. This might lead to a partially reserved basket.
     * 
     * Behaves same as `reserveInventory( reservationDurationInMinutes, false );`.
     * 
     * This method must not be used with
     * 
     * - the CreateOrder2 pipelet, or
     * - dw.order.OrderMgr.createOrder, or
     * - dw.order.OrderMgr.createOrder
     * 
     * in the same request.
     */
    reserveInventory(reservationDurationInMinutes: number): Status;
    /**
     * 
     * 
     * Reserve inventory for all items in this basket for 10 minutes. Any reservations created by previous calls of
     * this method are replaced.
     * 
     * Sample workflow for subsequent basket reservations:
     * 
     * 1. Request: Add item to basket and reserve the basket.
     * 
     * ```
     * transaction.begin()
     * basket.createProductLineItem("sku1",2,basket.defaultShipment)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku1:2} is complete
     * ```
     * 
     * 2. Request: Add item to basket.
     * 
     * ```
     * transaction.begin()
     * basket.createProductLineItem("sku2",2,basket.defaultShipment)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku1:2, sku2:2} is complete. The previous reservation was overwritten.
     * ```
     * 
     * 3. Request: Remove item from basket.
     * 
     * ```
     * transaction.begin()
     * basket.removeProductLineItem(item1)
     * basket.commit()
     * basket.reserveInventory()
     * // The reservation {sku2:2} is complete. The previous reservation was
     * // overwritten and a quantity of 2 is released for sku1.
     * ```
     * 
     * The method can be used to reserve basket items before checkout to ensure that inventory is still available at the
     * time an order is created from the basket using dw.order.OrderMgr.createOrder. If all or some
     * basket items are not reserved before creating an order, dw.order.OrderMgr.createOrder will
     * validate item availability and will fail if any item is unavailable. Calling this method in the same request as
     * dw.order.OrderMgr.createOrder is unnecessary and discouraged for performance reasons.
     * 
     * The maximum quantity that can be reserved at one time is equal to the ATS (Available To Sell) quantity. (See
     * dw.catalog.ProductInventoryRecord.getATS.)
     * 
     * When using B2C Commerce inventory, reserving basket inventory does not reduce ATS. In this case, converting the
     * basket to an order reduces ATS by the reserved amount. For example, consider a product with an ATS quantity of 5
     * and no reservations. If a basket reserves a quantity of 3, then other baskets still see an ATS of 5 but can only
     * reserve a quantity of 2.
     * 
     * When using Omnichannel Inventory, reserving basket inventory reduces ATS. In this case, converting the basket to
     * an order doesn't reduce ATS. In the previous example, after the first basket reserved a quantity of 3, other
     * baskets would see an ATS of 2.
     * 
     * Reservations can only be made for products with an inventory record. The reservation of product bundles is
     * controlled by the Use Bundle Inventory Only setting on the inventory list. The setting allows inventory to
     * be reserved for just the bundle or for the bundle and its bundled products.
     * 
     * The following conditions must be met for the method to succeed:
     * 
     * - an inventory list must be assigned to the current site
     * - all products in the basket must exist, and must not be of type Master or ProductSet
     * - each product line item must have a valid quantity
     * - each product must have an inventory record, or the inventory list must define that products without inventory
     * record are available by default
     * - the reservation must succeed for each item as described above or `removeIfNotAvailable` is set to
     * `true`
     * 
     * The method implements its own transaction handling. Calling the method from inside a transaction is disallowed
     * and results in an exception being thrown. This behavior differs when calling the method from an OCAPI
     * hook. OCAPI hooks handle transactions themselves, so in this case there is also no need to do any transaction
     * handling, but to ensure the shortest possible locking of the inventory this method should only be called as
     * the last step in the OCAPI hook.
     * 
     * getInventoryReservationExpiry can be used to determine when the expiration will expire.
     * 
     * If the reservation fails with an ERROR status, existing valid reservations for the basket will remain unchanged
     * but no new reservations will be made. This might lead to a partially reserved basket.
     * 
     * If the reservation succeeds with an OK status and `removeIfNotAvailable` is `true`, basket
     * line items quantities might have been changed or line items might have been removed. The returned
     * dw.system.Status object will contain information about the changes. Possible values for
     * dw.system.StatusItem.getCode are:
     * 
     * - BUNDLE_REMOVED - a bundle item was removed completely
     * - ITEM_REMOVED - a product line item was removed completely
     * - ITEM_QUANTITY_REDUCED - the quantity of a line item was reduced
     * 
     * dw.system.StatusItem.getDetails will contain for each item the sku and uuid of the item
     * which was changed/removed.
     * 
     * This method must not be used with
     * 
     * - the CreateOrder2 pipelet, or
     * - dw.order.OrderMgr.createOrder, or
     * - dw.order.OrderMgr.createOrder
     * 
     * in the same request.
     */
    reserveInventory(reservationDurationInMinutes: number, removeIfNotAvailable: boolean): Status;
    /**
     * Set the type of the business this order has been placed in.
     * 
     * Possible values are dw.order.LineItemCtnr.BUSINESS_TYPE_B2C or dw.order.LineItemCtnr.BUSINESS_TYPE_B2B.
     */
    setBusinessType(aType: number): void;
    /**
     * Set the channel type in which sales channel this order has been created. This can be used to distinguish order
     * placed through e.g. Storefront, Call Center or Marketplace.
     * 
     * Possible values are dw.order.LineItemCtnr.CHANNEL_TYPE_STOREFRONT,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_CALLCENTER, dw.order.LineItemCtnr.CHANNEL_TYPE_MARKETPLACE,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_DSS, dw.order.LineItemCtnr.CHANNEL_TYPE_STORE,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_PINTEREST, dw.order.LineItemCtnr.CHANNEL_TYPE_TWITTER,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_FACEBOOKADS, dw.order.LineItemCtnr.CHANNEL_TYPE_SUBSCRIPTIONS,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_ONLINERESERVATION,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_INSTAGRAMCOMMERCE, dw.order.LineItemCtnr.CHANNEL_TYPE_GOOGLE,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_YOUTUBE, dw.order.LineItemCtnr.CHANNEL_TYPE_TIKTOK,
     * dw.order.LineItemCtnr.CHANNEL_TYPE_SNAPCHAT, dw.order.LineItemCtnr.CHANNEL_TYPE_WHATSAPP The
     * value for dw.order.LineItemCtnr.CHANNEL_TYPE_CUSTOMERSERVICECENTER and
     * dw.order.LineItemCtnr.CHANNEL_TYPE_CHATGPT and dw.order.LineItemCtnr.CHANNEL_TYPE_GEMINI are also
     * available, but it can not be set by the scripting API, it is set only internally.
     */
    setChannelType(aType: number): void;
    /**
     * Sets the customer number of the customer associated with this container.
     * 
     * Note this method has little effect as it only sets the customer number and it does not re-link the basket with
     * a customer profile</> object, nor is the number copied into the dw.order.Order should one be created from
     * the basket. Use dw.order.Order.setCustomer instead for a registered customer. For a
     * guest customer the customerNo is usually generated during order creation and the attribute is set at order level.
     * @deprecated The method has been deprecated. Please use dw.order.Order.setCustomer
     * instead for registered customer. For guest customer the customerNo is usually generated during order
     * creation and the attribute is set at order level.
     */
    setCustomerNo(customerNo: string): void;
    /**
     * Register a "start checkout" event for the current basket. This event is tracked for AB test statistics
     * but otherwise has no effect on the basket. The system will register at most one checkout per basket per session.
     */
    startCheckout(): void;
    /**
     * Updates the basket currency if different to session currency, otherwise does nothing.
     * 
     * Use dw.system.Session.setCurrency to set the currency for the session. To reflect the session
     * currency change to the basket you need to update the basket with this method. This ensures that any upcoming
     * basket recalculation, which is based on the session currency, matches the basket currency.
     * @example
     * ...
     * if (basket.getBillingAddress().getCountryCode() == 'DE'){
     * var newCurrency : Currency = Currency.getCurrency('EUR');
     * session.setCurrency( newCurrency );
     * basket.updateCurrency();
     * }
     * customBasketRecalculate();
     * ...
     */
    updateCurrency(): void;
}

export = Basket;
