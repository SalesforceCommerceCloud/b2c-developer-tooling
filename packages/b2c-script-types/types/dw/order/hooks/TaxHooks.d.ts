import Status = require('../../system/Status');
import LineItemCtnr = require('../LineItemCtnr');
import Order = require('../Order');

/**
 * This interface represents tax extension points for Commerce App tax providers.
 * 
 * These hooks provide integration points for external tax calculation services installed via the Commerce App
 * framework. They are distinct from the legacy `dw.order.calculateTax` extension point.
 * 
 * IMPORTANT: These hooks should only be implemented and registered by Commerce Apps
 * (applications installed via the Commerce App framework with a CAP file). They are not intended for custom merchant
 * cartridges or storefront implementations. Merchants who want custom tax calculation logic should use the legacy
 * `dw.order.calculateTax` extension point instead.
 * 
 * Hook Registration A function must be defined inside a JavaScript source and must be exported. The script
 * with the exported hook function must be located inside a site cartridge. Inside the site cartridge a
 * `package.json` file with a 'hooks' entry must exist:
 * 
 * ```
 * "hooks": "./hooks.json"
 * ```
 * 
 * The hooks entry links to a JSON file, relative to the `package.json` file. This file lists all registered
 * hooks inside the hooks property:
 * 
 * ```
 * "hooks": [
 * {"name": "sfcc.app.tax.calculate", "script": "./calculate.js"},
 * {"name": "sfcc.app.tax.commit", "script": "./commit.js"},
 * {"name": "sfcc.app.tax.cancel", "script": "./cancel.js"}
 * ]
 * ```
 * 
 * A hook entry has a `name` and a `script` property:
 * 
 * - The `name` contains the extension point name (the hook name).
 * - The `script` contains the script path relative to the hooks file, with the exported hook
 * function.
 * 
 * Function Naming Convention: The exported JavaScript function name must match the last segment of the
 * extension point name, for example, `calculate`, `commit`, `cancel`..
 * 
 * Order Lifecycle Context Each hook fires at a specific point in the order lifecycle:
 * 
 * - calculate: Fires during basket calculation on every basket operation (e.g., adding items,
 * changing quantities, updating shipping). Calculates tax amounts for the basket line items.
 * - commit: Fires immediately after successful order creation (order status `CREATED`).
 * Notifies the tax provider that the order has been created and tax amounts should be committed.
 * - cancel: Fires on order cancellation or failure. Notifies the tax provider to void or cancel
 * previously committed tax amounts.
 * 
 * Hook Precedence
 * 
 * - When `sfcc.app.tax.calculate` is registered, it takes precedence over the legacy
 * `dw.order.calculateTax` hook.
 * - If the Commerce App hook is not registered, the platform falls back to `dw.order.calculateTax` (if
 * registered).
 * - If neither hook is available, the platform uses default platform tax calculation.
 * 
 * Important: If you override the `dw.order.calculate` hook (the parent basket calculation
 * hook), the platform's tax hook selection logic is bypassed entirely. In this case, if you want to use Commerce App
 * tax providers, you must manually invoke the `sfcc.app.tax.calculate` hook from within your custom
 * `dw.order.calculate` implementation.
 * 
 * SCAPI Behavior
 * 
 * SCAPI requests with `ScapiHookExecutionEnabled` disabled bypass all hooks (both Commerce App tax hooks and
 * the legacy `dw.order.calculateTax` hook) and go straight to the default platform tax calculation.
 * 
 * Hook Arguments and Return Types
 * 
 * - calculate: Receives a `dw.order.LineItemCtnr` (typically a
 * `dw.order.Basket`) as the first argument. Must return a `dw.system.Status` object (or
 * `null` for success).
 * - commit: Receives a `dw.order.Order` object as the first argument. Must return a
 * `dw.system.Status` object (or `null` for success).
 * - cancel: Receives a `dw.order.Order` object as the first argument. Must return a
 * `dw.system.Status` object (or `null` for success).
 * 
 * Error Handling
 * For calculate hook:
 * 
 * - Always blocks on error: Both returning a `Status.ERROR` and throwing an exception
 * prevent the basket calculation from completing successfully. The platform logs the error and halts the current basket
 * operation. Since order creation requires a successful basket calculation, this also prevents orders from being
 * created with incorrect tax amounts.
 * 
 * For commit hook:
 * 
 * The Commerce App developer chooses whether errors should block order creation by how they handle errors in their hook
 * implementation:
 * 
 * - Non-blocking error: Catch exceptions and return a `Status.ERROR`. The platform logs
 * the error as a warning and continues with the order lifecycle. Use this when the tax provider is temporarily
 * unavailable but the order should still be created.
 * 
 * ```
 * return new Status(Status.ERROR, 'TAX_COMMIT_FAILED', 'Details about the failure');
 * ```
 * 
 * - Blocking error: Let exceptions propagate (don't catch them). The platform logs the error and
 * rolls back the order lifecycle operation, preventing the order from being created.
 * 
 * ```
 * throw new Error('Tax provider unavailable');
 * ```
 * 
 * For cancel hook:
 * 
 * The Commerce App developer chooses whether errors should block order cancellation by how they handle errors in their
 * hook implementation:
 * 
 * - Non-blocking error: Catch exceptions and return a `Status.ERROR`. The platform logs
 * the error as a warning and continues with the order lifecycle. Use this when the tax provider is temporarily
 * unavailable but the order cancellation should still proceed.
 * 
 * ```
 * return new Status(Status.ERROR, 'TAX_CANCEL_FAILED', 'Details about the failure');
 * ```
 * 
 * - Blocking error: Let exceptions propagate (don't catch them). The platform logs the error and
 * rolls back the order cancellation operation.
 * @example
 * throw new Error('Tax provider unavailable');
 */
declare interface TaxHooks {
    /**
     * The extension point name extensionPointAppCalculateTax.
     */
    readonly extensionPointAppCalculateTax: "sfcc.app.tax.calculate";
    /**
     * The extension point name extensionPointAppCancelTax.
     */
    readonly extensionPointAppCancelTax: "sfcc.app.tax.cancel";
    /**
     * The extension point name extensionPointAppCommitTax.
     */
    readonly extensionPointAppCommitTax: "sfcc.app.tax.commit";
    /**
     * The function is called by extension point extensionPointAppCalculateTax. It calculates tax amounts for
     * the basket line items during basket calculation. This hook fires on every basket operation (e.g., adding items,
     * changing quantities, updating shipping), not only before order creation.
     * 
     * Note: If the `dw.order.calculate` hook is overridden, the platform's automatic tax
     * hook selection is bypassed. You must manually invoke this hook from within your custom
     * `dw.order.calculate` implementation if you want to use Commerce App tax providers.
     * 
     * Error Handling: Both returning a `Status.ERROR` and throwing an exception will
     * prevent the basket calculation from completing successfully. The platform logs the error and halts the current
     * basket operation. Since order creation requires a successful basket calculation, this also prevents orders from
     * being created with incorrect tax amounts.
     * 
     * SCAPI Behavior: When `ScapiHookExecutionEnabled` is disabled, SCAPI requests bypass
     * this hook and use default platform tax calculation.
     * 
     * Sample Implementation:
     * 
     * ```
     * function calculate(basket) {
     * var TaxMgr = require('dw/order/TaxMgr');
     * var Status = require('dw/system/Status');
     * var HTTPClient = require('dw/net/HTTPClient');
     * 
     * // 1. Extract shipping address and line items
     * var shipment = basket.getDefaultShipment();
     * var shippingAddress = shipment.getShippingAddress();
     * 
     * // 2. Build request for external tax provider
     * var taxRequest = {
     * addresses: {
     * shipTo: {
     * line1: shippingAddress.getAddress1(),
     * city: shippingAddress.getCity(),
     * region: shippingAddress.getStateCode(),
     * country: shippingAddress.getCountryCode().getValue(),
     * postalCode: shippingAddress.getPostalCode()
     * }
     * },
     * lines: []
     * };
     * 
     * // Add product line items
     * var pliIterator = basket.getProductLineItems().iterator();
     * while (pliIterator.hasNext()) {
     * var pli = pliIterator.next();
     * taxRequest.lines.push({
     * itemCode: pli.getProductID(),
     * quantity: pli.getQuantityValue(),
     * amount: pli.getAdjustedPrice().getValue(),
     * taxCode: pli.getTaxClassID() // Product tax category
     * });
     * }
     * 
     * // 3. Call external tax service
     * var httpClient = new HTTPClient();
     * httpClient.open('POST', 'https://api.taxprovider.com/calculate');
     * httpClient.setRequestHeader('Authorization', 'Bearer ' + apiKey);
     * httpClient.send(JSON.stringify(taxRequest));
     * 
     * if (httpClient.statusCode !== 200) {
     * return new Status(Status.ERROR, 'TAX_CALC_FAILED', 'Tax calculation failed: ' + httpClient.errorText);
     * }
     * 
     * var taxResponse = JSON.parse(httpClient.text);
     * 
     * // 4. Apply tax amounts to basket line items using TaxMgr
     * taxResponse.lines.forEach(function(line, index) {
     * var pli = basket.getProductLineItems()[index];
     * TaxMgr.setProductLineTax(pli, line.tax);
     * });
     * 
     * // Set shipping tax if applicable
     * if (taxResponse.shippingTax) {
     * TaxMgr.setShippingTax(shipment, taxResponse.shippingTax);
     * }
     * 
     * return new Status(Status.OK);
     * }
     * 
     * exports.calculate = calculate;
     * ```
     * 
     * Common APIs used: `dw.order.TaxMgr` (setProductLineTax, setShippingTax),
     * dw.net.HTTPClient, `dw.order.LineItemCtnr` (getProductLineItems, getShipments),
     * `dw.order.ProductLineItem` (getProductID, getTaxClassID), `dw.order.OrderAddress`
     * (getAddress1, getCity, getStateCode).
     */
    calculate(lineItemCtnr: LineItemCtnr<any>): Status | null;
    /**
     * The function is called by extension point extensionPointAppCancelTax during OrderMgr.failOrder() or
     * OrderMgr.cancelOrder(). It notifies the Commerce App tax provider that the order has been cancelled or has
     * failed, and that previously committed tax amounts should be voided or cancelled in the tax provider.
     * 
     * Error Handling:
     * 
     * - Non-blocking error: Return `Status.ERROR`. The platform logs the error as a
     * warning and continues with the order lifecycle. Use this when the tax provider is temporarily unavailable but the
     * order cancellation should still proceed.
     * - Blocking error: Throw an exception. The platform logs the error and rolls back the order
     * lifecycle operation.
     * 
     * SCAPI Behavior: When `ScapiHookExecutionEnabled` is disabled, SCAPI requests bypass
     * this hook.
     * 
     * Sample Implementation:
     * 
     * ```
     * function cancel(order) {
     * var Status = require('dw/system/Status');
     * var HTTPClient = require('dw/net/HTTPClient');
     * 
     * // 1. Retrieve the external transaction ID stored during commit
     * var taxProviderTransactionId = order.custom.taxProviderTransactionId;
     * 
     * if (!taxProviderTransactionId) {
     * // No transaction to cancel - tax was never committed
     * return new Status(Status.OK);
     * }
     * 
     * // 2. Build void/cancel request for external tax provider
     * var cancelRequest = {
     * code: order.getOrderNo(),
     * type: 'SalesInvoice'
     * };
     * 
     * // 3. Call external tax service to void/cancel the transaction
     * var httpClient = new HTTPClient();
     * httpClient.open('POST', 'https://api.taxprovider.com/transactions/' + taxProviderTransactionId + '/void');
     * httpClient.setRequestHeader('Authorization', 'Bearer ' + apiKey);
     * httpClient.send(JSON.stringify(cancelRequest));
     * 
     * if (httpClient.statusCode !== 200 && httpClient.statusCode !== 204) {
     * // Non-blocking error: log warning but allow order cancellation to proceed
     * return new Status(Status.ERROR, 'TAX_CANCEL_FAILED',
     * 'Failed to void tax transaction in provider, order cancellation will proceed. Error: ' + httpClient.errorText);
     * }
     * 
     * return new Status(Status.OK);
     * }
     * 
     * exports.cancel = cancel;
     * ```
     * 
     * Common APIs used: dw.net.HTTPClient, `dw.order.Order` (getOrderNo, custom
     * attributes), dw.system.Status.
     */
    cancel(order: Order): Status | null;
    /**
     * The function is called by extension point extensionPointAppCommitTax during order creation in the order
     * creation transaction. It notifies the Commerce App tax provider that the order has been successfully created and
     * that tax amounts should be committed to the tax provider. The order is in `CREATED` status at this
     * point (before being placed).
     * 
     * Error Handling:
     * 
     * - Non-blocking error: Return `Status.ERROR`. The platform logs the error as a
     * warning and continues with the order lifecycle. Use this when the tax provider is temporarily unavailable but the
     * order should still be created.
     * - Blocking error: Throw an exception. The platform logs the error and rolls back the order
     * lifecycle operation, preventing the order from being created.
     * 
     * SCAPI Behavior: When `ScapiHookExecutionEnabled` is disabled, SCAPI requests bypass
     * this hook.
     * 
     * Sample Implementation:
     * 
     * ```
     * function commit(order) {
     * var Transaction = require('dw/system/Transaction');
     * var Status = require('dw/system/Status');
     * var HTTPClient = require('dw/net/HTTPClient');
     * 
     * // 1. Build commit request for external tax provider
     * var commitRequest = {
     * code: order.getOrderNo(), // Use order number as unique transaction ID
     * type: 'SalesInvoice',
     * companyCode: 'DEFAULT',
     * date: order.getCreationDate(),
     * customerCode: order.getCustomerNo(),
     * addresses: {
     * shipTo: {
     * line1: order.getDefaultShipment().getShippingAddress().getAddress1(),
     * city: order.getDefaultShipment().getShippingAddress().getCity(),
     * region: order.getDefaultShipment().getShippingAddress().getStateCode(),
     * country: order.getDefaultShipment().getShippingAddress().getCountryCode().getValue(),
     * postalCode: order.getDefaultShipment().getShippingAddress().getPostalCode()
     * }
     * },
     * lines: [],
     * commit: true // Tell provider to commit the transaction
     * };
     * 
     * // Add order line items
     * var pliIterator = order.getProductLineItems().iterator();
     * while (pliIterator.hasNext()) {
     * var pli = pliIterator.next();
     * commitRequest.lines.push({
     * itemCode: pli.getProductID(),
     * quantity: pli.getQuantityValue(),
     * amount: pli.getAdjustedPrice().getValue(),
     * tax: pli.getAdjustedTax().getValue()
     * });
     * }
     * 
     * // 2. Call external tax service to commit transaction
     * var httpClient = new HTTPClient();
     * httpClient.open('POST', 'https://api.taxprovider.com/transactions');
     * httpClient.setRequestHeader('Authorization', 'Bearer ' + apiKey);
     * httpClient.send(JSON.stringify(commitRequest));
     * 
     * if (httpClient.statusCode !== 200 && httpClient.statusCode !== 201) {
     * // Non-blocking error: log warning but allow order to proceed
     * return new Status(Status.ERROR, 'TAX_COMMIT_FAILED',
     * 'Failed to commit tax to provider, order will proceed. Error: ' + httpClient.errorText);
     * }
     * 
     * var commitResponse = JSON.parse(httpClient.text);
     * 
     * // 3. Store external transaction ID in order custom attribute for later reference (cancel/refund)
     * Transaction.wrap(function() {
     * order.custom.taxProviderTransactionId = commitResponse.id;
     * });
     * 
     * return new Status(Status.OK);
     * }
     * 
     * exports.commit = commit;
     * ```
     * 
     * Common APIs used: dw.system.Transaction, dw.net.HTTPClient, `dw.order.Order`
     * (getOrderNo, getProductLineItems, getDefaultShipment, custom attributes), `dw.order.ProductLineItem`
     * (getAdjustedTax).
     */
    commit(order: Order): Status | null;
}

export = TaxHooks;
