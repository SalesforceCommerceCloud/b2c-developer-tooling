import AbstractItem = require('./AbstractItem');
import Quantity = require('../value/Quantity');
import Collection = require('../util/Collection');
import ReturnItem = require('./ReturnItem');
import EnumValue = require('../value/EnumValue');
import Money = require('../value/Money');

/**
 * An item of a dw.order.ReturnCase, created using method
 * dw.order.ReturnCase.createItem. Initially the
 * ReturnCaseItem is NEW. No dw.order.Return can be
 * created at this point. From NEW the item transitions in CONFIRMED state.
 * Now Return can be created. Next transition is either to
 * PARTIAL_RETURNED or to CANCELLED. At the end the item can be RETURNED (no other
 * Returns can be created.
 * 
 * The custom code implementing the ReturnHooks is
 * responsible to provide the logic for the transitions. Please refer to the
 * documentation of dw.order.hooks.ReturnHooks for further
 * information.
 * 
 * When the related ReturnCase were confirmed, only the the custom attributes of the return case item can be changed.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class ReturnCaseItem extends AbstractItem {
    /**
     * constant for ReturnCase Status CANCELLED
     */
    static readonly STATUS_CANCELLED: string;
    /**
     * constant for ReturnCase Status CONFIRMED
     */
    static readonly STATUS_CONFIRMED: string;
    /**
     * constant for ReturnCase Status NEW
     */
    static readonly STATUS_NEW: string;
    /**
     * constant for ReturnCase Status PARTIAL RETURNED
     */
    static readonly STATUS_PARTIAL_RETURNED: string;
    /**
     * constant for ReturnCase Status RETURNED
     */
    static readonly STATUS_RETURNED: string;
    /**
     * Return the dw.value.Quantity authorized for this ReturnCaseItem, may be N/A.
     */
    authorizedQuantity: Quantity;
    /**
     * Price of a single unit before discount application.
     */
    readonly basePrice: Money;
    /**
     * Return the note for this return case item.
     */
    note: string | null;
    /**
     * Returns null or the parent item.
     */
    parentItem: ReturnCaseItem | null;
    /**
     * Returns the reason code for return case item.
     */
    reasonCode: EnumValue;
    /**
     * Mandatory number of dw.order.ReturnCase to which this item belongs
     */
    readonly returnCaseNumber: string;
    /**
     * Unsorted collection of dw.order.ReturnItems associated with this ReturnCaseItem.
     * @see createReturnItem
     */
    readonly returnItems: Collection<any>;
    /**
     * Gets the return case item status.
     * 
     * The possible values are STATUS_NEW,STATUS_CONFIRMED,
     * STATUS_PARTIAL_RETURNED, STATUS_RETURNED,
     * STATUS_CANCELLED.
     */
    status: EnumValue;
    private constructor();
    /**
     * Create a new dw.order.ReturnItem for this ReturnCaseItem and assign it to the
     * given dw.order.Return.
     */
    createReturnItem(returnNumber: string): ReturnItem;
    /**
     * Return the dw.value.Quantity authorized for this ReturnCaseItem, may be N/A.
     */
    getAuthorizedQuantity(): Quantity;
    /**
     * Price of a single unit before discount application.
     */
    getBasePrice(): Money;
    /**
     * Return the note for this return case item.
     */
    getNote(): string | null;
    /**
     * Returns null or the parent item.
     */
    getParentItem(): ReturnCaseItem | null;
    /**
     * Returns the reason code for return case item.
     */
    getReasonCode(): EnumValue;
    /**
     * Mandatory number of dw.order.ReturnCase to which this item belongs
     */
    getReturnCaseNumber(): string;
    /**
     * Unsorted collection of dw.order.ReturnItems associated with this ReturnCaseItem.
     * @see createReturnItem
     */
    getReturnItems(): Collection<any>;
    /**
     * Gets the return case item status.
     * 
     * The possible values are STATUS_NEW,STATUS_CONFIRMED,
     * STATUS_PARTIAL_RETURNED, STATUS_RETURNED,
     * STATUS_CANCELLED.
     */
    getStatus(): EnumValue;
    /**
     * Set the optional authorized dw.value.Quantity for this item. Passing null will result in an N/A Quantity
     * being set.
     */
    setAuthorizedQuantity(authorizedQuantity: Quantity | null): void;
    /**
     * Sets a note for this return case item.
     */
    setNote(note: string): void;
    /**
     * Set a parent item. The parent item must belong to the same
     * dw.order.ReturnCase. An infinite parent-child loop is disallowed
     * as is a parent-child depth greater than 10. Setting a parent item
     * indicates a dependency of the child item on the parent item, and can be
     * used to form a parallel structure to that accessed using
     * dw.order.ProductLineItem.getParent.
     */
    setParentItem(parentItem: ReturnCaseItem): void;
    /**
     * Changes the reason code. Initially the reason code is set on return case
     * item creation.
     */
    setReasonCode(reasonCode: string): void;
    /**
     * Sets the status.
     * 
     * The possible values are STATUS_NEW,STATUS_CONFIRMED,
     * STATUS_PARTIAL_RETURNED, STATUS_RETURNED,
     * STATUS_CANCELLED.
     * @throws NullPointerException if status is  null
     * @throws IllegalArgumentException if the status transition to the status is not allowed
     */
    setStatus(statusString: string): void;
}

export = ReturnCaseItem;
