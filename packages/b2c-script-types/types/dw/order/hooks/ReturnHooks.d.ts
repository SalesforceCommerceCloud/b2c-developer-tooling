import Return = require('../Return');
import Status = require('../../system/Status');

/**
 * This interface represents all script hooks that can be registered to
 * customizing the order center return resource. It contains the extension
 * points (hook names), and the functions that are called by each extension
 * point. A function must be defined inside a JavaScript source and must be
 * exported. The script with the exported hook function must be located inside a
 * site cartridge. Inside the site cartridge a 'package.json' file with a
 * 'hooks' entry must exist.
 * 
 * "hooks": "./hooks.json"
 * 
 * The hooks entry links to a json file, relative to the 'package.json' file.
 * This file lists all registered hooks inside the hooks property:
 * 
 * ```
 * "hooks": [
 * {"name": "dw.order.return.createReturn",           "script": "./returns.ds"},
 * {"name": "dw.order.return.addReturnItem",          "script": "./returns.ds"},
 * {"name": "dw.order.return.changeStatus",           "script": "./returns.ds"},
 * ]
 * ```
 * 
 * A hook entry has a 'name' and a 'script' property.
 * 
 * - The 'name' contains the extension point, the hook name.
 * - The 'script' contains the script relative to the hooks file, with the
 * exported hook function.
 * 
 * Overview Return Functionality Business objects
 * dw.order.ReturnCase All returns exist in the context of a
 * dw.order.ReturnCase, each dw.order.Order can have any number
 * of dw.order.ReturnCases.
 * 
 * A dw.order.ReturnCase has dw.order.ReturnCaseItems, each of
 * which is associated with an dw.order.OrderItem (an extension to
 * either a dw.order.ProductLineItem or a
 * dw.order.ShippingLineItem).
 * 
 * Each dw.order.ReturnCaseItem defines an
 * dw.order.ReturnCaseItem.getAuthorizedQuantity representing the
 * maximum quantity expected to be returned. A dw.order.ReturnCaseItem
 * may be associated with 0..n dw.order.ReturnItems -
 * dw.order.ReturnItems are added to the dw.order.ReturnCaseItem
 * when dw.order.Returns are created.
 * 
 * Either - a dw.order.ReturnCase may be used as an RMA, in which
 * case they are created when a customer first shows a wish to return item(s).
 * The customer then includes the RMA number with the returned item(s). The
 * dw.order.Return created as a result is then associated with the
 * existing dw.order.ReturnCase.
 * 
 * Or - a dw.order.ReturnCase is automatically created as part of
 * the return creation, i.e. the customer returns some item(s) leading to a
 * creation of both a dw.order.Return and an associated
 * dw.order.ReturnCase.
 * 
 * The scripting api allows access to the dw.order.ReturnCases, whether
 * the dw.order.ReturnCase is an RMA or not, and the
 * dw.order.ReturnCase status. Both the dw.order.ReturnCaseItems
 * and any dw.order.Returns associated with the
 * dw.order.ReturnCase can be accessed.
 * 
 * A dw.order.ReturnCase has one of these status values:
 * 
 * - New - the dw.order.ReturnCase has been created and can be edited
 * previous to its authorization
 * - CONFIRMED - the dw.order.ReturnCase is CONFIRMED, can no longer
 * be edited, no dw.order.Returns have been associated with it. Only an
 * New- dw.order.ReturnCase can be CONFIRMED
 * - PARTIAL_RETURNED - the dw.order.ReturnCase has been associated
 * with at least one dw.order.Return, but is not yet complete. Only an
 * CONFIRMED- dw.order.ReturnCase can be set to PARTIAL_RETURNED
 * - RETURNED - the dw.order.ReturnCase has been associated with
 * dw.order.Returns which match the expected authorized quantity. Only
 * an CONFIRMED- or PARTIAL_RETURNED- return-case can be set to RETURNED
 * - Cancelled - the dw.order.ReturnCase has been cancelled (only a
 * New- or CONFIRMED- dw.order.ReturnCase can be cancelled)
 * 
 * dw.order.Return
 * A dw.order.Return represents a physical customer return, and contains
 * 1..n dw.order.ReturnItems. A dw.order.Return is associated
 * with one dw.order.ReturnCase, and each dw.order.ReturnItem is
 * associated with one dw.order.ReturnCaseItem and (via the
 * dw.order.ReturnCaseItem) a single dw.order.OrderItem usually
 * representing an dw.order.Order dw.order.ProductLineItem.
 * 
 * A dw.order.ReturnItem records the quantity returned.
 * 
 * A dw.order.Return can have one of these status values:
 * 
 * - NEW - the dw.order.Return is new, i.e. needs to undergo a check
 * before it can be marked as COMPLETED
 * - COMPLETED - the return is complete, this is a precondition for refunding
 * the customer for a return.
 * 
 * Credit Invoice
 * As a result of making a dw.order.Return, the customer may be
 * refunded. The refund amount is held in a credit dw.order.Invoice
 * which may be associated either with one dw.order.Return
 * or with one dw.order.ReturnCase. The dw.order.Invoice
 * is passed to the refund payment hook allowing custom code to handle
 * the payment refund.
 * 
 * Process overview
 * Create dw.order.ReturnCase
 * The creation of dw.order.ReturnCases is supported using the data-api.
 * The api supports, within the context of an dw.order.Order, the
 * specification of an (optional) RMA-number and addition of
 * dw.order.ReturnCaseItems for a given order-item and quantity.
 * Authorize dw.order.ReturnCase
 * Following its creation, a dw.order.ReturnCase needs to be CONFIRMED -
 * an CONFIRMED dw.order.ReturnCase cannot be modified.
 * Cancel dw.order.ReturnCase
 * Following its creation or authorization, a dw.order.ReturnCase may be
 * cancelled.
 * Create dw.order.Return
 * dw.order.Returns may be imported or created via the data-api. These
 * apis specify an (optional) RMA allowing a dw.order.Return to be
 * associated with a dw.order.ReturnCase, and
 * dw.order.ReturnItems with a quantity and a key allowing them to be
 * associated with an order-item. The process is delegated to custom scripts
 * which control the creation of the dw.order.Return and the addition of
 * the dw.order.ReturnItems:
 * 
 * Hook extensionPointCreateReturn
 * The creation of the new dw.order.Return is delegated to the custom
 * script when this hook is called, passing the order, and details of the
 * dw.order.Return to be created to the script. Typically the script
 * accesses the dw.order.ReturnCase from the order and creates the
 * return with the provided return-number. It may also update the
 * dw.order.Order, dw.order.ReturnCase or
 * dw.order.Return using custom values passed in the
 * dw.order.Return details.
 * 
 * `
 * 
 * exports.createReturn = function (order:Order, returnDetails) {
 * 
 * var returnNumber=returnDetails.returnNumber;
 * 
 * var returnCase = order.getReturnCase(returnDetails.returnCaseNumber);
 * 
 * var newReturn = returnCase.createReturn(returnNumber);
 * 
 * return newReturn;
 * 
 * }`
 * 
 * Hook extensionPointAddReturnItem
 * This call delegates the creation of individual dw.order.ReturnItems
 * to a custom script, passing the dw.order.Order, returnNumber,
 * returnCaseItemId and return-item-details. Typically the script will access
 * the dw.order.ReturnCaseItem from the order and create a new
 * dw.order.ReturnItem for it.
 * 
 * `exports.addReturnItem = function (retrn:Return, returnItemDetails) {
 * 
 * var returnCaseItem = order.getReturnCaseItem(returnCaseItemId);
 * 
 * var item = returnCaseItem.createReturnItem(returnNr);
 * 
 * `
 * 
 * Hook extensionPointChangeStatus
 * This call delegates the update of the return-status to a custom script,
 * passing the dw.order.Order, returnNumber and new status. The custom
 * script is responsible for setting the status and taking any other actions
 * necessary, including the possibility of creating a credit invoice:
 * 
 * `changeStatus = function (retrn:Return, status) {
 * 
 * retrn.status=status;
 * 
 * `
 * 
 * Hook extensionPointAfterStatusChange
 * This call delegates the update of the return-status to a custom script,
 * passing the dw.order.Order, returnNumber and new status. The custom
 * script is responsible for setting the status and taking any other actions
 * necessary, including the possibility of creating a credit invoice:
 * 
 * `changeStatus = function (retrn:Return, status) {
 * 
 * retrn.status=status;
 * 
 * `
 * 
 * Order post-processing APIs (gillian) are now inactive by default and will throw
 * an exception if accessed. Activation needs preliminary approval by Product Management.
 * Please contact support in this case. Existing customers using these APIs are not
 * affected by this change and can use the APIs until further notice.
 */
declare interface ReturnHooks {
    /**
     * The extension point name extensionPointAddReturnItem.
     */
    readonly extensionPointAddReturnItem: "dw.order.return.addReturnItem";
    /**
     * The extension point name extensionPointAfterStatusChange.
     */
    readonly extensionPointAfterStatusChange: "dw.order.return.afterStatusChange";
    /**
     * The extension point name extensionPointChangeStatus.
     */
    readonly extensionPointChangeStatus: "dw.order.return.changeStatus";
    /**
     * The extension point name extensionPointCreateReturn.
     */
    readonly extensionPointCreateReturn: "dw.order.return.createReturn";
    /**
     * The extension point name extensionPointNotifyStatusChange.
     */
    readonly extensionPointNotifyStatusChange: "dw.order.return.notifyStatusChange";
    /**
     * The hook provides customization in the process of assigning the returned
     * amount, quantity etc. Here it is possible to refund differently based on
     * the return reason code for example. Also one could correct the inventory
     * based on the return information. Utilize
     * dw.order.ReturnCaseItem.createReturnItem to create a new
     * dw.order.ReturnItem.
     */
    addReturnItem(retrn: Return, inputData: any): Status;
    /**
     * Called after method changeStatus returns
     * Status.OK. The call is made in a separate database transaction allowing
     * the script implementation to make an independent remote call if desired.
     */
    afterStatusChange(retrn: Return): Status;
    /**
     * Responsible to change the status of a dw.order.Return: the custom
     * script is responsible for setting the new status using
     * dw.order.Return.setStatus.
     * 
     * The invoice handling should be implemented here using
     * dw.order.Return.createInvoice or
     * dw.order.ReturnCase.createInvoice. For example create an
     * dw.order.Invoice for a dw.order.Return moving to status
     * dw.order.Return.STATUS_COMPLETED.
     */
    changeStatus(retrn: Return, inputData: any): Status;
    /**
     * This hook is responsible for creating a new dw.order.Return,
     * based on a dw.order.ReturnCase. 2 basic workflows are supported:
     * 
     * -
     * On-the-fly return: create the parent dw.order.ReturnCase using
     * dw.order.Order.createReturnCase.
     * -
     * Return-merchandise-authorization (RMA) workflow: resolve an existing
     * dw.order.ReturnCase using
     * dw.order.Order.getReturnCase.
     * 
     * In both cases use dw.order.ReturnCase.createReturn to create the dw.order.Return based on the inputData.
     * 
     * Additional functionality like creating history entry, handling the return
     * fees or the shipping cost credit can be implemented in the hook after the
     * dw.order.Return is created.
     */
    createReturn(inputData: any): Return;
    /**
     * Called after method changeStatus returns
     * Status.OK (and after method afterStatusChange)
     * to inform of a successful status change. The call is made outside any
     * database transaction. This is the best hook in which to send customer
     * notifications as the status change has already been successfully written
     * to the database
     */
    notifyStatusChange(retrn: Return): Status;
}

export = ReturnHooks;
