import ShippingOrder = require('../ShippingOrder');
import Status = require('../../system/Status');
import Order = require('../Order');

/**
 * This interface represents all script hooks that can be registered around
 * shipping order lifecycle. It contains the extension points (hook names), and
 * the functions that are called by each extension point. A function must be
 * defined inside a JavaScript source and must be exported. The script with the
 * exported hook function must be located inside a site cartridge. Inside the
 * site cartridge a 'package.json' file with a 'hooks' entry must exist.
 * 
 * "hooks": "./hooks.json"
 * 
 * The hooks entry links to a json file, relative to the 'package.json' file.
 * This file lists all registered hooks inside the hooks property:
 * 
 * ```
 * "hooks": [
 * {"name": "dw.order.shippingorder.updateShippingOrderItem", "script": "./shippingOrderUpdate.ds"},
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the
 * exported hook function.
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare interface ShippingOrderHooks {
    /**
     * The extension point name extensionPointAfterStatusChange.
     */
    readonly extensionPointAfterStatusChange: "dw.order.shippingorder.afterStatusChange";
    /**
     * The extension point name extensionPointChangeStatus.
     */
    readonly extensionPointChangeStatus: "dw.order.shippingorder.changeStatus";
    /**
     * The extension point name extensionPointCreateShippingOrders.
     */
    readonly extensionPointCreateShippingOrders: "dw.order.shippingorder.createShippingOrders";
    /**
     * The extension point name extensionPointNotifyStatusChange.
     */
    readonly extensionPointNotifyStatusChange: "dw.order.shippingorder.notifyStatusChange";
    /**
     * The extension point name
     * extensionPointPrepareCreateShippingOrders.
     */
    readonly extensionPointPrepareCreateShippingOrders: "dw.order.shippingorder.prepareCreateShippingOrders";
    /**
     * The extension point name extensionPointResolveShippingOrder .
     */
    readonly extensionPointResolveShippingOrder: "dw.order.shippingorder.resolveShippingOrder";
    /**
     * The extension point name extensionPointShippingOrderCancelled.
     */
    readonly extensionPointShippingOrderCancelled: "dw.order.shippingorder.setShippingOrderCancelled";
    /**
     * The extension point name extensionPointShippingOrderShipped.
     */
    readonly extensionPointShippingOrderShipped: "dw.order.shippingorder.setShippingOrderShipped";
    /**
     * The extension point name extensionPointShippingOrderWarehouse.
     */
    readonly extensionPointShippingOrderWarehouse: "dw.order.shippingorder.setShippingOrderWarehouse";
    /**
     * The extension point name extensionPointUpdateShippingOrderItem.
     */
    readonly extensionPointUpdateShippingOrderItem: "dw.order.shippingorder.updateShippingOrderItem";
    /**
     * After Status change hook.
     * 
     * The function is called by extension point
     * extensionPointAfterStatusChange.
     * 
     * The implementation of this hook is optional. If defined the hook is
     * called after extensionPointChangeStatus or respectively after
     * extensionPointShippingOrderShipped,
     * extensionPointShippingOrderCancelled or
     * extensionPointShippingOrderWarehouse
     * 
     * Runs inside of a transaction.
     */
    afterStatusChange(shippingOrder: ShippingOrder): Status;
    /**
     * Change the status of a shipping order.
     * 
     * The function is called by extension point
     * extensionPointChangeStatus.
     * 
     * Runs inside a transaction together with the hooks
     * extensionPointResolveShippingOrder
     * extensionPointUpdateShippingOrderItem.
     * 
     * Runs after the iteration over the input's items collection as the last
     * step in this transaction. The implementation of this hook is mandatory.
     */
    changeStatus(shippingOrder: ShippingOrder, updateData: any): Status;
    /**
     * Called during shipping order creation for an order.
     * 
     * The function is called by extension point
     * extensionPointCreateShippingOrders. It is responsible for
     * creating shipping orders and its items for the order. Preparations for
     * shipping order creation can be done before in hook
     * extensionPointPrepareCreateShippingOrders.
     * 
     * Runs inside of a transaction. The implementation of this hook is
     * mandatory.
     */
    createShippingOrders(order: Order): Status;
    /**
     * Notify Status change hook.
     * 
     * The function is called by extension point
     * extensionPointNotifyStatusChange.
     * 
     * The implementation of this hook is optional. If defined the hook is
     * called after extensionPointAfterStatusChange as the last step
     * in the shipping order update process.
     * 
     * Runs outside of a transaction.
     */
    notifyStatusChange(shippingOrder: ShippingOrder): Status;
    /**
     * Called before shipping order creation for an order takes place. Typically
     * the hook is used to check the payment authorization status of the order.
     * 
     * The function is called by extension point
     * extensionPointPrepareCreateShippingOrders.
     * 
     * Runs inside its own transaction. The value of the return status is used
     * to control whether hook createShippingOrders is called
     * for the order or not. The implementation of this hook is mandatory.
     */
    prepareCreateShippingOrders(order: Order): Status;
    /**
     * Resolve the shipping order. Will be called as first step of the update.
     * 
     * The function is called by extension point
     * extensionPointResolveShippingOrder.
     * 
     * Runs inside a transaction together with the hooks
     * 
     * extensionPointUpdateShippingOrderItem
     * extensionPointChangeStatus. The implementation of this hook is
     * mandatory.
     */
    resolveShippingOrder(updateData: any): ShippingOrder;
    /**
     * Change the status of a shipping order to cancelled.
     * 
     * The function is called by extension point
     * extensionPointShippingOrderCancelled.
     * 
     * This is an optional hook that can be implemented to have full control
     * over status change to destination status Cancelled. The following hooks
     * will be skipped if an implementation for this hook is registered:
     * extensionPointResolveShippingOrder,
     * extensionPointUpdateShippingOrderItem,
     * extensionPointChangeStatus.
     * 
     * Runs inside of a transaction.
     */
    setShippingOrderCancelled(updateData: any): Order;
    /**
     * Change the status of a shipping order to shipped.
     * 
     * The function is called by extension point
     * extensionPointShippingOrderShipped.
     * 
     * This is an optional hook that can be implemented to have full control
     * over status change to destination status Shipped. The following hooks
     * will be skipped if an implementation for this hook is registered:
     * extensionPointResolveShippingOrder
     * extensionPointUpdateShippingOrderItem,
     * extensionPointChangeStatus.
     * 
     * Runs inside of a transaction.
     */
    setShippingOrderShipped(updateData: any): Order;
    /**
     * Change the status of a shipping order to warehouse.
     * 
     * The function is called by extension point
     * extensionPointShippingOrderWarehouse.
     * 
     * This is an optional hook that can be implemented to have full control
     * over status change to destination status Warehouse. The following hooks
     * will be skipped if an implementation for this hook is registered:
     * extensionPointResolveShippingOrder,
     * extensionPointUpdateShippingOrderItem,
     * extensionPointChangeStatus.
     * 
     * Runs inside of a transaction.
     */
    setShippingOrderWarehouse(updateData: any): Order;
    /**
     * Updates the status of a shipping order item.
     * 
     * The function is called by extension point
     * extensionPointUpdateShippingOrderItem.
     * 
     * Runs inside a transaction together with the hooks
     * 
     * extensionPointResolveShippingOrder
     * extensionPointChangeStatus. The implementation of this hook is
     * mandatory.
     */
    updateShippingOrderItem(shippingOrder: ShippingOrder, updateItem: any): Status;
}

export = ShippingOrderHooks;
