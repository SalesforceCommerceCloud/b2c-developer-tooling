import AbstractItem = require('./AbstractItem');

/**
 * Represents an item of an dw.order.Appeasement which is associated with one dw.order.OrderItem usually representing an dw.order.Order
 * dw.order.ProductLineItem. Items are created using method dw.order.Appeasement.addItems
 * 
 * When the related Appeasement were set to status COMPLETED, only the the custom attributes of the appeasement item can be changed.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare class AppeasementItem extends AbstractItem {
    /**
     * Returns the number of the dw.order.Appeasement to which this item belongs.
     */
    readonly appeasementNumber: string;
    /**
     * Returns null or the parent item.
     */
    parentItem: AppeasementItem | null;
    private constructor();
    /**
     * Returns the number of the dw.order.Appeasement to which this item belongs.
     */
    getAppeasementNumber(): string;
    /**
     * Returns null or the parent item.
     */
    getParentItem(): AppeasementItem | null;
    /**
     * Set a parent item. The parent item must belong to the same
     * dw.order.Appeasement. An infinite parent-child loop is disallowed
     * as is a parent-child depth greater than 10. Setting a parent item
     * indicates a dependency of the child item on the parent item, and can be
     * used to form a parallel structure to that accessed using
     * dw.order.ProductLineItem.getParent.
     */
    setParentItem(parentItem: AppeasementItem): void;
}

export = AppeasementItem;
